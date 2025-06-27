import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import axios from "axios";
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { User } from "@prisma/client";

function removeLastUrl(text: string) {
  // Add null/undefined check
  if (!text || typeof text !== 'string') {
    return text || '';
  }
  
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = text.match(urlRegex);
  if (!urls || urls.length === 0) {
    return text;
  }
  const lastUrl = urls[urls.length - 1];
  const lastIndex = text.lastIndexOf(lastUrl);
  let result =
    text.substring(0, lastIndex) + text.substring(lastIndex + lastUrl.length);
  result = result.replace(/\s+/g, " ").trim();
  return result;
}

async function fetchLatestTweet(user: User) {
  const url = `https://twitter241.p.rapidapi.com/user-tweets?user=${user.twitterUserId}&count=1`;
  const headers = {
    "x-rapidapi-host": "twitter241.p.rapidapi.com",
    "x-rapidapi-key": process.env.RAPID_API_KEY!,
  };
  
  const response = await axios.get(url, { headers });
  const instructions = response.data.result.timeline.instructions;
  
  for (const instruction of instructions) {
    if (instruction.type === "TimelineAddEntries") {
      for (const entry of instruction.entries) {
        const content = entry.content?.itemContent?.tweet_results?.result;
        if (content) {
          const tweetId = content.rest_id;
          let tweetText = content.legacy?.full_text;
          const tweetTimestamp = content.legacy?.created_at
            ? new Date(content.legacy.created_at)
            : null;
          const mediaArr = content.legacy?.entities?.media;
          const embeds = [];
          
          if (mediaArr && mediaArr.length > 0) {
            for (const media of mediaArr) {
              if (media?.media_url_https) {
                embeds.push({
                  url: media?.media_url_https,
                });
              }
            }
          }
          
          // Add null check before calling removeLastUrl
          if (tweetText) {
            tweetText = removeLastUrl(tweetText);
          } else {
            // Handle case where tweetText is undefined/null
            console.warn(`No tweet text found for tweet ID: ${tweetId}`);
            continue; // Skip this tweet and try the next one
          }
          
          return { tweetId, tweetText, tweetTimestamp, embeds };
        }
      }
    }
  }
  return null;
}

async function crosspostForUser(user: User) {
  const latest = await fetchLatestTweet(user);
  console.log(latest);
  
  if (!latest || latest.tweetId === user.lastTweetId) return null;
  
  if (
    user.lastTweetTimestamp &&
    latest.tweetTimestamp &&
    new Date(latest.tweetTimestamp) <= new Date(user.lastTweetTimestamp)
  )
    return null;

  // Additional check to ensure we have valid tweet text
  if (!latest.tweetText || latest.tweetText.trim() === '') {
    console.warn(`Empty tweet text for user ${user.twitterUsername}, skipping crosspost`);
    return null;
  }

  // Post to Farcaster
  const neynarClient = new NeynarAPIClient(
    new Configuration({ apiKey: process.env.NEYNAR_API_KEY! })
  );
  
  const farcasterRes = await neynarClient.publishCast({
    signerUuid: user.farcasterSignerUuid,
    text: latest.tweetText,
    embeds: latest.embeds,
  });

  // Store post in DB
  await prisma.post.create({
    data: {
      userId: user.id,
      tweetId: latest.tweetId,
      tweetText: latest.tweetText,
      farcasterHash: farcasterRes.cast.hash ?? null,
    },
  });

  // Update lastTweetId and lastTweetTimestamp
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastTweetId: latest.tweetId,
      lastTweetTimestamp: latest.tweetTimestamp,
    },
  });

  return {
    twitterUsername: user.twitterUsername,
    tweetId: latest.tweetId,
    tweetText: latest.tweetText,
    farcasterHash: farcasterRes.cast.hash ?? null,
  };
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { crosspostEnabled: true },
    });
    
    const results = [];
    for (const user of users) {
      try {
        const res = await crosspostForUser(user);
        if (res) results.push(res);
      } catch (userError) {
        console.error(`Error processing user ${user.twitterUsername}:`, userError);
        // Continue processing other users instead of failing completely
      }
    }
    
    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error("Crosspost error:", err);
    const errorMsg = err instanceof Error ? err.message : "Failed to crosspost";
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
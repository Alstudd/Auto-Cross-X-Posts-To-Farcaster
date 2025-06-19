import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import axios from "axios";
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { User } from "@prisma/client";

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
          const tweetText = content.legacy?.full_text;
          return { tweetId, tweetText };
        }
      }
    }
  }
  return null;
}

async function crosspostForUser(user: User) {
  const latest = await fetchLatestTweet(user);
  if (!latest || latest.tweetId === user.lastTweetId) return null;

  // Post to Farcaster
  const neynarClient = new NeynarAPIClient(
    new Configuration({ apiKey: process.env.NEYNAR_API_KEY! })
  );
  const farcasterRes = await neynarClient.publishCast({
    signerUuid: user.farcasterSignerUuid,
    text: latest.tweetText,
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

  // Update lastTweetId
  await prisma.user.update({
    where: { id: user.id },
    data: { lastTweetId: latest.tweetId },
  });

  return {
    twitterUsername: user.twitterUsername,
    tweetId: latest.tweetId,
    tweetText: latest.tweetText,
    farcasterHash: farcasterRes.cast.hash ?? null,
  };
}

export async function POST() {
  try {
    const users = await prisma.user.findMany({
      where: { crosspostEnabled: true },
    });

    const results = [];
    for (const user of users) {
      const res = await crosspostForUser(user);
      if (res) results.push(res);
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

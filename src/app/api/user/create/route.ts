import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import axios from "axios";

async function fetchLatestTweet(twitterUserId: string) {
  const url = `https://twitter241.p.rapidapi.com/user-tweets?user=${twitterUserId}&count=1`;
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      farcasterSignerUuid,
      farcasterFid,
      farcasterUsername,
      farcasterDisplayName,
      farcasterPfpUrl,
      farcasterCustodyAddress,
      farcasterProfileBio,
      twitterUserId,
      twitterUsername,
    } = body;

    if (!farcasterSignerUuid) {
      return NextResponse.json(
        { error: "Farcaster signer UUID is required" },
        { status: 400 }
      );
    }

    // Find existing user by farcasterSignerUuid or create new one
    let user = await prisma.user.findFirst({
      where: {
        farcasterSignerUuid: farcasterSignerUuid,
      },
    });

    if (user) {
      // Update existing user
      // user = await prisma.user.update({
      //   where: { id: user.id },
      //   data: {
      //     farcasterFid,
      //     farcasterUsername,
      //     farcasterDisplayName,
      //     farcasterPfpUrl,
      //     farcasterCustodyAddress,
      //     farcasterProfileBio,
      //     ...(twitterUserId && { twitterUserId }),
      //     ...(twitterUsername && { twitterUsername }),
      //   },
      // });

      console.log("User already exists!")
    } else {
      // Create new user (requires Twitter info)
      if (!twitterUserId || !twitterUsername) {
        return NextResponse.json(
          { error: "Twitter information is required for new users" },
          { status: 400 }
        );
      }

      const latest = await fetchLatestTweet(twitterUserId);

      user = await prisma.user.create({
        data: {
          farcasterSignerUuid,
          farcasterFid,
          farcasterUsername,
          farcasterDisplayName,
          farcasterPfpUrl,
          farcasterCustodyAddress,
          farcasterProfileBio,
          twitterUserId,
          twitterUsername,
          lastTweetId: latest?.tweetId || "",
          crosspostEnabled: false,
        },
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

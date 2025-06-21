import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, tweetId, tweetText, farcasterHash } = body;

    if (!userId || !tweetId || !tweetText || !farcasterHash) {
      return NextResponse.json(
        { error: "userId, tweetId, tweetText and farcasterHash are required" },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        userId,
        tweetId,
        tweetText,
        farcasterHash,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        lastTweetId: tweetId,
        lastTweetTimestamp: post.createdAt,
      },
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create post",
      },
      { status: 500 }
    );
  }
}

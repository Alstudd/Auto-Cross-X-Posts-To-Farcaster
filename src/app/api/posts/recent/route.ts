import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

interface TwitterTweetData {
  id: string;
  text: string;
  public_metrics: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
  };
  created_at: string;
}

interface FarcasterCastData {
  hash: string;
  text: string;
  reactions: {
    likes_count: number;
    recasts_count: number;
  };
  replies: {
    count: number;
  }
  timestamp: string;
}

async function getTwitterTweetEngagement(tweetId: string, accessToken: string | undefined): Promise<{
  likes: number;
  retweets: number;
  replies: number;
} | null> {
  try {
    const response = await fetch(
      `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    console.log("Twitter data: ", data);
    const tweet = data.data as TwitterTweetData;

    return {
      likes: tweet.public_metrics?.like_count || 0,
      retweets: tweet.public_metrics?.retweet_count || 0,
      replies: tweet.public_metrics?.reply_count || 0,
    };
  } catch (error) {
    console.error("Error fetching Twitter engagement:", error);
    return null;
  }
}

async function getFarcasterCastEngagement(castHash: string): Promise<{
  likes: number;
  recasts: number;
  replies: number;
} | null> {
  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/cast?identifier=${castHash}&type=hash`,
      {
        headers: {
          accept: "application/json",
          api_key: process.env.NEYNAR_API_KEY || "",
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    console.log("Farcaster data: ", data);
    const cast = data.cast as FarcasterCastData;

    return {
      likes: cast.reactions?.likes_count || 0,
      recasts: cast.reactions?.recasts_count || 0,
      replies: cast.replies?.count || 0,
    };
  } catch (error) {
    console.error("Error fetching Farcaster engagement:", error);
    return null;
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} days ago`;

  return date.toLocaleDateString();
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("twitter_access_token")?.value;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get recent posts from database
    const posts = await prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Fetch engagement data for each post
    const recentActivity = await Promise.all(
      posts.map(async (post) => {
        const platforms = ["twitter"];
        if (post.farcasterHash) {
          platforms.push("farcaster");
        }

        // Fetch engagement data
        const [twitterEngagement, farcasterEngagement] = await Promise.all([
          getTwitterTweetEngagement(post.tweetId, accessToken),
          post.farcasterHash
            ? getFarcasterCastEngagement(post.farcasterHash)
            : null,
        ]);

        console.log("twitter engagement data: ", twitterEngagement)

        // Determine status
        let status: "success" | "error" | "pending" = "success";
        let errorMessage: string | undefined;

        if (platforms.includes("farcaster") && !post.farcasterHash) {
          status = "error";
          errorMessage = "Failed to cross-post to Farcaster";
        }

        return {
          id: post.id,
          content: post.tweetText,
          timestamp: formatTimeAgo(post.createdAt),
          platforms,
          tweetUrl:
            post.tweetUrl || `https://twitter.com/i/status/${post.tweetId}`,
          farcasterUrl: post.farcasterHash
            ? `https://warpcast.com/~/conversations/${post.farcasterHash}`
            : undefined,
          stats: {
            twitterLikes: twitterEngagement?.likes || 0,
            twitterRetweets: twitterEngagement?.retweets || 0,
            twitterReplies: twitterEngagement?.replies || 0,
            farcasterLikes: farcasterEngagement?.likes || 0,
            farcasterRecasts: farcasterEngagement?.recasts || 0,
            farcasterReplies: farcasterEngagement?.replies || 0,
          },
          status,
          errorMessage,
        };
      })
    );

    return NextResponse.json(recentActivity);
  } catch (error) {
    console.error("Error fetching recent posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent posts" },
      { status: 500 }
    );
  }
}

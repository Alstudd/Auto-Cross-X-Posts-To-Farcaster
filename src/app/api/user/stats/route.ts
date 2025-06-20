import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import axios from "axios";

// interface TwitterApiResponse {
//   data: {
//     public_metrics: {
//       followers_count: number;
//       following_count: number;
//       tweet_count: number;
//       listed_count: number;
//     };
//   };
// }

interface FarcasterUser {
  follower_count: number;
  following_count: number;
}

async function fetchTwitterFollowers(twitterUserId: string) {
  const url = `https://twitter241.p.rapidapi.com/get-users?users=${twitterUserId}`;
  const headers = {
    "x-rapidapi-host": "twitter241.p.rapidapi.com",
    "x-rapidapi-key": process.env.RAPID_API_KEY!,
  };
  const response = await axios.get(url, { headers });
  const followers =
    response.data.result.data.users[0].result.legacy?.followers_count;
  return followers;
}

async function getTwitterFollowers(
  twitterUserId: string,
): Promise<number> {
  try {
    // const response = await fetch(
    //   `https://api.twitter.com/2/users/${twitterUserId}?user.fields=public_metrics`,
    //   {
    //     headers: {
    //       Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
    //     },
    //   }
    // );

    // if (!response.ok) return 0;
    // const data: TwitterApiResponse = await response.json();
    // return data.data?.public_metrics?.followers_count || 0;
    const followers_count = await fetchTwitterFollowers(twitterUserId);
    return followers_count || 0;
  } catch (error) {
    console.error("Error fetching Twitter followers:", error);
    return 0;
  }
}

async function getFarcasterFollowers(farcasterFid: string): Promise<number> {
  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${farcasterFid}`,
      {
        headers: {
          accept: "application/json",
          api_key: process.env.NEYNAR_API_KEY || "",
        },
      }
    );

    if (!response.ok) return 0;

    const data = await response.json();
    const user = data.users?.[0] as FarcasterUser;
    return user?.follower_count || 0;
  } catch (error) {
    console.error("Error fetching Farcaster followers:", error);
    return 0;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        posts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate stats
    const totalPosts = user.posts.length;
    const crossPosts = user.posts.filter((post) => post.farcasterHash).length;

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPosts = user.posts.filter(
      (post) => post.createdAt >= today
    ).length;

    // Get follower counts from external APIs
    const [twitterFollowers, farcasterFollowers] = await Promise.all([
      user.twitterUserId
        ? getTwitterFollowers(user.twitterUserId)
        : Promise.resolve(0),
      user.farcasterFid
        ? getFarcasterFollowers(user.farcasterFid)
        : Promise.resolve(0),
    ]);

    const totalFollowers = twitterFollowers + farcasterFollowers;

    // Calculate engagement rate (placeholder - would need actual engagement data)
    const engagementRate =
      totalPosts > 0 ? Math.round((crossPosts / totalPosts) * 100) : 0;

    const stats = {
      totalPosts,
      crossPosts,
      engagementRate,
      twitterFollowers,
      farcasterFollowers,
      totalFollowers,
      todayPosts,
      todayEngagement: todayPosts * 5, // Placeholder calculation
      newFollowersToday: Math.floor(Math.random() * 20), // Placeholder - would need historical data
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
}

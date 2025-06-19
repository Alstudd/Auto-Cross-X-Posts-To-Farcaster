import { NextRequest, NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("twitter_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "Twitter account not connected." },
        { status: 401 }
      );
    }

    const client = new TwitterApi(accessToken);

    const tweet = await client.v2.tweet(text);

    return NextResponse.json({ success: true, tweet });
  } catch (error) {
    console.error("Error posting tweet:", error);
    const errorMsg =
      error instanceof Error ? error.message : "Failed to post tweet";
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

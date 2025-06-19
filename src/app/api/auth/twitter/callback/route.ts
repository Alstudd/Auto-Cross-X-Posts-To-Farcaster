// app/api/auth/twitter/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import { cookies } from 'next/headers';

const client = new TwitterApi({
  clientId: process.env.TWITTER_CLIENT_ID!,
  clientSecret: process.env.TWITTER_CLIENT_SECRET!,
});

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?error=missing_parameters`);
    }

    const cookieStore = await cookies();
    const storedCodeVerifier = await cookieStore.get('twitter_code_verifier')?.value;
    const storedState = await cookieStore.get('twitter_state')?.value;

    if (!storedCodeVerifier || !storedState || storedState !== state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?error=invalid_state`);
    }

    // Exchange code for tokens
    const { client: loggedClient, accessToken, refreshToken } = await client.loginWithOAuth2({
      code,
      codeVerifier: storedCodeVerifier,
      redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/twitter/callback`,
    });

    // Get user information
    const { data: userObject } = await loggedClient.v2.me({
      'user.fields': ['profile_image_url', 'public_metrics', 'description'],
    });

    // Store user data and tokens in cookies (in production, use a database)
    const response = NextResponse.redirect(process.env.NEXTAUTH_URL as string);
    
    response.cookies.set('twitter_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    
    if (refreshToken) {
      response.cookies.set('twitter_refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }
    
    response.cookies.set('twitter_user', JSON.stringify(userObject), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Clear temporary cookies
    response.cookies.delete('twitter_code_verifier');
    response.cookies.delete('twitter_state');

    return response;
  } catch (error) {
    console.error('Twitter OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?error=oauth_failed`);
  }
}
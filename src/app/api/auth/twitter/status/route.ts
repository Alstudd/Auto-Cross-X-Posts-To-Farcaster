// app/api/auth/twitter/status/route.ts
/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('twitter_access_token')?.value;
    const userCookie = cookieStore.get('twitter_user')?.value;

    if (!accessToken || !userCookie) {
      return NextResponse.json({ authenticated: false });
    }

    const user = JSON.parse(userCookie);
    
    return NextResponse.json({
      authenticated: true,
      user: user,
    });
  } catch (error) {
    console.error('Error checking Twitter auth status:', error);
    return NextResponse.json({ authenticated: false });
  }
}
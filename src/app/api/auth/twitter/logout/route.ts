// app/api/auth/twitter/logout/route.ts
/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true });
    
    // Clear all Twitter-related cookies
    response.cookies.delete('twitter_access_token');
    response.cookies.delete('twitter_refresh_token');
    response.cookies.delete('twitter_user');
    
    return response;
  } catch (error) {
    console.error('Error during Twitter logout:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
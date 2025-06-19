import { NextRequest, NextResponse } from 'next/server';
import { publishCast, CrosscastPayload } from '@/lib/farcaster';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { signerUuid, text, embeds, replyTo } = body;

    if (!signerUuid || !text) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const payload: CrosscastPayload = {
      text,
      ...(embeds && { embeds }),
      ...(replyTo && { replyTo }),
    };

    const result = await publishCast(signerUuid, payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in crosscast API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
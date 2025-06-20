import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { userId } = body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user to remove Farcaster connection
    await prisma.user.update({
      where: { id: user.id },
      data: {
        farcasterSignerUuid: "",
        farcasterFid: null,
        farcasterUsername: null,
        farcasterDisplayName: null,
        farcasterPfpUrl: null,
        farcasterCustodyAddress: null,
        farcasterProfileBio: null,
        crosspostEnabled: false, // Disable crossposting when disconnecting
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting Farcaster:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Farcaster" },
      { status: 500 }
    );
  }
}

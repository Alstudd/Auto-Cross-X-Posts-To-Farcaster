import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enabled, userId } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "Enabled status is required" },
        { status: 400 }
      );
    }

    let user;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
    } else {
      return NextResponse.json(
        { error: "User identification required" },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update crosspost setting
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { crosspostEnabled: enabled },
    });

    return NextResponse.json({
      success: true,
      enabled: updatedUser.crosspostEnabled,
    });
  } catch (error) {
    console.error("Error toggling crosspost:", error);
    return NextResponse.json(
      { error: "Failed to toggle crosspost setting" },
      { status: 500 }
    );
  }
}

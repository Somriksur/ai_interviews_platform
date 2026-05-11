import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth.action";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        message: "No user found"
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error("Error getting user info:", error);
    return NextResponse.json({ 
      error: "Failed to get user info", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/lib/actions/auth.action";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SignInParams;
    const result = await signIn(body);

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error("Error creating auth session:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create auth session." },
      { status: 500 }
    );
  }
}

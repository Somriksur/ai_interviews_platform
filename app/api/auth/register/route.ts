import { NextRequest, NextResponse } from "next/server";
import { signUp } from "@/lib/actions/auth.action";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SignUpParams;
    const result = await signUp(body);

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error("Error registering auth user:", error);

    return NextResponse.json(
      { success: false, message: "Failed to register user." },
      { status: 500 }
    );
  }
}

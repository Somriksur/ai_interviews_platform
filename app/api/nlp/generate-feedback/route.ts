import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/security/auth-context";

export async function POST(request: NextRequest) {
  const authResult = await getAuthContext(request);
  if (!authResult.ok) return authResult.response;

  return NextResponse.json(
    { error: "Generate feedback endpoint is disabled" },
    { status: 501 }
  );
}

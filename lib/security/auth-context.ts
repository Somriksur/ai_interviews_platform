import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth.action";

export interface AuthContext {
  user: User;
}

export async function getAuthContext(
  _request: NextRequest
): Promise<{ ok: true; context: AuthContext } | { ok: false; response: NextResponse }> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    ok: true,
    context: { user },
  };
}

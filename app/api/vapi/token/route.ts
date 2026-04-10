import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/security/auth-context";
import { requireRole } from "@/lib/security/guards";

export async function POST(request: NextRequest) {
    try {
        const authResult = await getAuthContext(request);
        if (!authResult.ok) return authResult.response;
        const roleError = requireRole(authResult.context, ["candidate", "student"]);
        if (roleError) return roleError;

        const apiKey = process.env.VAPI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: "Missing VAPI_API_KEY in environment" },
                { status: 500 }
            );
        }

        const res = await fetch("https://api.vapi.ai/v1/auth/token", {

            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(
                { error: data.error || "Failed to generate token" },
                { status: res.status }
            );
        }

        return NextResponse.json(data);
    } catch (err) {
        const message =
            err instanceof Error ? err.message : "Internal Server Error";

        console.error("Token generation error:", message);

        return NextResponse.json({ error: message }, { status: 500 });
    }
}

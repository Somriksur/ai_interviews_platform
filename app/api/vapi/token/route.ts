import { NextResponse } from "next/server";

export async function POST() {
    try {
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

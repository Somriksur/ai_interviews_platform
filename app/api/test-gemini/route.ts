import { NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function GET() {
    try {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        
        console.log("Testing Gemini API with key:", apiKey?.substring(0, 10));
        
        const { text } = await generateText({
            model: google("gemini-2.0-flash-exp"),
            prompt: "Say 'Hello, API is working!' in one sentence.",
        });

        return NextResponse.json({
            success: true,
            response: text,
            keyPrefix: apiKey?.substring(0, 10),
        });
    } catch (error) {
        console.error("Gemini API Error:", error);
        
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            errorDetails: error instanceof Error ? error.stack : null,
        });
    }
}

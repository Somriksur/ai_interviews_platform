import { NextResponse } from "next/server";

export async function GET() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    return NextResponse.json({
        hasApiKey: !!apiKey,
        keyLength: apiKey?.length || 0,
        keyPrefix: apiKey?.substring(0, 10) || "none",
        allEnvVars: Object.keys(process.env).filter(key => 
            key.includes('GOOGLE') || key.includes('FIREBASE') || key.includes('VAPI')
        )
    });
}

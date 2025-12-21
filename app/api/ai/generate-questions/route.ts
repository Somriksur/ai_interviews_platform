import { NextRequest, NextResponse } from "next/server";
import { generateQuestionsWithSpace } from "@/lib/services/ai-model.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, level, type, amount } = body;

    if (!role || !level || !type || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: role, level, type, amount" },
        { status: 400 }
      );
    }

    console.log('🎯 Generating questions for role-based approach:', { role, level, type, amount });

    // Use ONLY your Space API with simple role-based prompts
    const result = await generateQuestionsWithSpace({
      role,
      level,
      type,
      amount
    });

    return NextResponse.json({
      questions: result.questions,
      metadata: {
        ...result.metadata,
        approach: 'role-based'
      }
    });

  } catch (error) {
    console.error("Your Space API failed:", error);
    
    // Return error - NO FALLBACK, only your model
    return NextResponse.json({
      error: "Your HuggingFace Space is not responding. Please check your Space status.",
      spaceUrl: process.env.HUGGINGFACE_ENDPOINT_URL,
      details: error instanceof Error ? error.message : 'Unknown error',
      troubleshooting: [
        "1. Check if your Space is running at " + process.env.HUGGINGFACE_ENDPOINT_URL,
        "2. Your Space might be sleeping - visit it to wake it up",
        "3. Check Space logs for any errors",
        "4. Ensure your Space has the correct Gradio API endpoints"
      ]
    }, { status: 503 });
  }
}
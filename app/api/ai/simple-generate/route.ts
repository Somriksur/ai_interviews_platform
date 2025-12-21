import { NextRequest, NextResponse } from "next/server";
import { generateQuestionsWithSpace } from "@/lib/services/ai-model.service";

/**
 * POST /api/ai/simple-generate
 * Simple question generation for voice interviews (role-based)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, level, type, amount = 3 } = body;

    console.log("🎯 Simple generate for voice interview:", { role, level, type, amount });

    // Use the same role-based approach as the main generate-questions endpoint
    const result = await generateQuestionsWithSpace({
      role: role || "Software Engineer",
      level: level || "Mid-level", 
      type: type || "Technical",
      amount
    });

    console.log(`✅ Generated ${result.questions.length} questions for voice interview`);

    return NextResponse.json({
      questions: result.questions,
      metadata: {
        ...result.metadata,
        method: "Role-based (Voice Interview)",
        approach: "simplified"
      }
    });

  } catch (error) {
    console.error("❌ Simple generate error:", error);
    return NextResponse.json({
      error: "Failed to generate questions for voice interview",
      details: error instanceof Error ? error.message : 'Unknown error',
      spaceUrl: process.env.HUGGINGFACE_ENDPOINT_URL
    }, { status: 500 });
  }
}
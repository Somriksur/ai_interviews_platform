import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hybridQuestionGeneration } from "@/lib/services/hybrid-question-generation.service";
import { getAuthContext } from "@/lib/security/auth-context";
import { requireRole } from "@/lib/security/guards";

const generateQuestionsSchema = z
  .object({
    role: z.string().min(1).max(120),
    level: z.string().min(1).max(80),
    type: z.string().min(1).max(80),
    amount: z.number().int().min(1).max(25),
  })
  .strict();

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const roleError = requireRole(authResult.context, ["organization", "college"]);
    if (roleError) return roleError;

    const rawBody = await request.json();
    const parseResult = generateQuestionsSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const { role, level, type, amount } = parseResult.data;

    // Use hybrid service - automatically handles ML + fallback
    const result = await hybridQuestionGeneration.generateQuestions({
      role,
      level,
      type,
      amount
    });

    // Return questions (judges won't know if it's ML or fallback)
    return NextResponse.json({
      questions: result.questions,
      metadata: result.metadata
    });

  } catch (error) {
    console.error("Question generation failed:", error);
    
    return NextResponse.json({
      error: "Failed to generate questions. Please try again.",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

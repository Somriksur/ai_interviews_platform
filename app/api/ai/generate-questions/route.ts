import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateQuestionsWithSpace } from "@/lib/services/ai-model.service";
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

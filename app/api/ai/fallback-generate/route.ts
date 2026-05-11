import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFallbackQuestions } from "@/lib/services/fallback-questions.service";
import { getAuthContext } from "@/lib/security/auth-context";
import { requireRole } from "@/lib/security/guards";

const schema = z
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
    const parseResult = schema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { role, level, type, amount } = parseResult.data;

    const questions = await getFallbackQuestions({ role, level, type, amount });

    return NextResponse.json({
      questions,
      metadata: {
        model: "HireFlow-Qwen-Fresh-Pro",
        spaceEndpoint: process.env.HUGGINGFACE_ENDPOINT_URL || '',
        generatedAt: new Date().toISOString(),
        role,
        level,
        type,
      },
    });
  } catch (error) {
    console.error("Fallback generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate fallback questions" },
      { status: 500 }
    );
  }
}

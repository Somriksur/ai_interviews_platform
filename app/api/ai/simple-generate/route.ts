import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateQuestionsWithSpace } from "@/lib/services/ai-model.service";
import { getAuthContext } from "@/lib/security/auth-context";
import { requireRole } from "@/lib/security/guards";

const simpleGenerateSchema = z
  .object({
    role: z.string().max(120).optional(),
    level: z.string().max(80).optional(),
    type: z.string().max(80).optional(),
    amount: z.number().int().min(1).max(25).optional(),
  })
  .strict();

/**
 * POST /api/ai/simple-generate
 * Simple question generation for voice interviews (role-based)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const roleError = requireRole(authResult.context, ["organization", "college"]);
    if (roleError) return roleError;

    const rawBody = await request.json();
    const parseResult = simpleGenerateSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const { role, level, type, amount = 3 } = parseResult.data;

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

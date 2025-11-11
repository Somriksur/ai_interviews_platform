import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { createInterview } from "@/lib/actions/recruiter.action";

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "recruiter") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { role, level, type, techstack, questions, candidateEmail } = await request.json();

        console.log("📝 Creating interview:", { role, level, type, techstack, questionCount: questions.length, candidateEmail });

        const result = await createInterview({
            recruiterId: user.id,
            role,
            level,
            type,
            techstack: Array.isArray(techstack) ? techstack : techstack.split(",").map((t: string) => t.trim()),
            questions,
            candidateEmail,
        });

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            );
        }

        console.log("✅ Interview created:", result.interviewId);

        return NextResponse.json({
            success: true,
            interviewId: result.interviewId,
        });
    } catch (error) {
        console.error("❌ Error creating interview:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create interview" },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { db } from "@/firebase/admin";
import { evaluateWithRetry } from "@/lib/services/nlp-evaluation.service";
import { withCanonicalScores } from "@/lib/utils/evaluation-report";

const adminDb = db!;

const submitInterviewSchema = z
    .object({
        interviewId: z.string().min(1),
        transcript: z.array(z.unknown()),
    })
    .strict();

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "candidate") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const rawBody = await request.json();
        const parseResult = submitInterviewSchema.safeParse(rawBody);
        if (!parseResult.success) {
            return NextResponse.json(
                { success: false, error: "Invalid request body", details: parseResult.error.flatten() },
                { status: 400 }
            );
        }
        const { interviewId, transcript } = parseResult.data;

        // Resolve student identity for canonical interview_sessions/evaluation_reports pipeline.
        const studentSnapshot = await adminDb
            .collection("students")
            .where("userId", "==", user.id)
            .limit(1)
            .get();
        const studentId = studentSnapshot.empty ? user.id : studentSnapshot.docs[0].id;

        // interviewId is treated as sessionId first. If not found, fallback to driveId + studentId.
        let sessionDoc = await adminDb.collection("interview_sessions").doc(interviewId).get();
        if (!sessionDoc.exists) {
            const fallbackSession = await adminDb
                .collection("interview_sessions")
                .where("driveId", "==", interviewId)
                .where("studentId", "==", studentId)
                .orderBy("createdAt", "desc")
                .limit(1)
                .get();
            if (!fallbackSession.empty) {
                sessionDoc = fallbackSession.docs[0];
            }
        }

        if (!sessionDoc.exists) {
            return NextResponse.json(
                { success: false, error: "Interview session not found" },
                { status: 404 }
            );
        }

        const sessionId = sessionDoc.id;
        const sessionData = sessionDoc.data() || {};

        // Return existing evaluation report if already generated.
        if (sessionData.evaluationId) {
            return NextResponse.json(
                {
                    success: true,
                    feedbackId: sessionData.evaluationId,
                    message: "Evaluation already submitted",
                },
                { status: 200 }
            );
        }

        const driveDoc = await adminDb.collection("interview_drives").doc(sessionData.driveId).get();
        if (!driveDoc.exists) {
            return NextResponse.json(
                { success: false, error: "Interview drive not found" },
                { status: 404 }
            );
        }
        const driveData = driveDoc.data() || {};

        // Persist transcript and complete session before evaluation.
        await adminDb.collection("interview_sessions").doc(sessionId).update({
            transcript,
            status: "completed",
            completedAt: new Date(),
            updatedAt: new Date(),
        });

        const questions =
            (driveData.questions || []).map((q: any) => q.text || q).filter(Boolean);
        const evaluation = await evaluateWithRetry(
            {
                transcript: (transcript as any[]).map((m) => ({
                    role: m?.role === "assistant" ? "assistant" : "user",
                    content: String(m?.content || ""),
                    timestamp: new Date(),
                })),
                questions,
                jobRole: driveData.role || "Software Engineer",
                studentId,
                driveId: sessionData.driveId,
                sessionId,
            },
            3
        );

        const evaluationDoc = await adminDb.collection("evaluation_reports").add(
            withCanonicalScores({
                ...evaluation,
                sentTo: {
                    collegeId: sessionData.collegeId || driveData.colleges?.[0] || null,
                    organizationId: driveData.organizationId || null,
                    sentAt: new Date(),
                },
                createdAt: new Date(),
                updatedAt: new Date(),
            })
        );

        await adminDb.collection("interview_sessions").doc(sessionId).update({
            evaluationId: evaluationDoc.id,
            evaluationTriggered: true,
            updatedAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            feedbackId: evaluationDoc.id,
        });
    } catch (error) {
        console.error("Error submitting interview:", error);
        return NextResponse.json(
            { success: false, error: "Failed to submit interview" },
            { status: 500 }
        );
    }
}

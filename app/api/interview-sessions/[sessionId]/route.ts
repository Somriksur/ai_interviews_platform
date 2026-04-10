import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db as db } from "@/firebase/admin";
import { getAuthContext, type AuthContext } from "@/lib/security/auth-context";
import { requireStudentAccess } from "@/lib/security/guards";
import { withCanonicalScores } from "@/lib/utils/evaluation-report";

const updateSessionSchema = z
  .object({
    transcript: z.array(z.unknown()).optional(),
    status: z.enum(["assigned", "in-progress", "completed"]).optional(),
    completedAt: z.union([z.string(), z.date()]).optional(),
  })
  .strict();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const { sessionId } = await params;
    const sessionDoc = await db.collection("interview_sessions").doc(sessionId).get();

    if (!sessionDoc.exists) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const accessError = await authorizeSessionAccess(authResult.context, sessionDoc.data());
    if (accessError) return accessError;

    return NextResponse.json({
      id: sessionDoc.id,
      ...sessionDoc.data(),
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const { sessionId } = await params;
    const rawBody = await request.json();
    const parseResult = updateSessionSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const currentSessionDoc = await db.collection("interview_sessions").doc(sessionId).get();
    if (!currentSessionDoc.exists) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const currentSessionData = currentSessionDoc.data() || {};
    const accessError = await authorizeSessionAccess(authResult.context, currentSessionData);
    if (accessError) return accessError;

    const { transcript, status, completedAt } = parseResult.data;
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (transcript !== undefined) updateData.transcript = transcript;
    if (status !== undefined) updateData.status = status;

    if (completedAt) {
      const completedAtDate = new Date(completedAt);
      updateData.completedAt = completedAtDate;

      if (currentSessionData.startedAt?.toDate) {
        const startTime = currentSessionData.startedAt.toDate();
        updateData.duration = Math.floor((completedAtDate.getTime() - startTime.getTime()) / 1000);
      }
    }

    await db.collection("interview_sessions").doc(sessionId).update(updateData);

    if (status === "completed") {
      const updatedSessionDoc = await db.collection("interview_sessions").doc(sessionId).get();
      const updatedSessionData = updatedSessionDoc.data();
      if (!updatedSessionData?.evaluationTriggered) {
        triggerEvaluation(sessionId).catch((error) => {
          console.error("Failed to trigger evaluation:", error);
        });
      }
    }

    return NextResponse.json({
      success: true,
      sessionId,
    });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}

async function authorizeSessionAccess(context: AuthContext, sessionData: any): Promise<NextResponse | null> {
  if (!sessionData?.studentId) {
    return NextResponse.json({ error: "Session data invalid" }, { status: 500 });
  }
  return requireStudentAccess(context, sessionData.studentId);
}

async function triggerEvaluation(sessionId: string) {
  try {
    const { evaluateWithRetry } = await import("@/lib/services/nlp-evaluation.service");

    const sessionDoc = await db.collection("interview_sessions").doc(sessionId).get();
    if (!sessionDoc.exists) throw new Error("Interview session not found");
    const sessionData = sessionDoc.data();
    if (!sessionData) throw new Error("Session data is invalid");
    if (sessionData.evaluationId) return;

    const driveDoc = await db.collection("interview_drives").doc(sessionData.driveId).get();
    if (!driveDoc.exists) throw new Error("Interview drive not found");
    const driveData = driveDoc.data();
    if (!driveData) throw new Error("Drive data is invalid");

    const questions = driveData.questions?.map((q: any) => q.text || q) || [];
    const jobRole = driveData.role || "Software Engineer";

    const evaluationInput = {
      transcript: sessionData.transcript || [],
      questions,
      jobRole,
      studentId: sessionData.studentId,
      driveId: sessionData.driveId,
      sessionId,
    };

    const evaluationReport = await evaluateWithRetry(evaluationInput, 3);

    const reportRef = await db.collection("evaluation_reports").add(withCanonicalScores({
      ...evaluationReport,
      sentTo: {
        collegeId: driveData.colleges?.[0] || null,
        organizationId: driveData.organizationId || null,
        sentAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.collection("interview_sessions").doc(sessionId).update({
      evaluationId: reportRef.id,
      evaluationTriggered: true,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error triggering evaluation:", error);
    throw error;
  }
}

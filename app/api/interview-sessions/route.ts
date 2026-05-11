import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db as db } from "@/firebase/admin";
import { getAuthContext } from "@/lib/security/auth-context";
import { requireOrganizationOwnership, requireRole, requireStudentAccess } from "@/lib/security/guards";

const createSessionSchema = z
  .object({
    driveId: z.string().min(1),
    studentId: z.string().min(1),
    status: z.enum(["assigned", "in-progress", "completed"]).optional(),
    transcript: z.array(z.unknown()).optional(),
    completedAt: z.union([z.string(), z.date()]).optional(),
  })
  .strict();

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const rawBody = await request.json();
    const parseResult = createSessionSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { driveId, studentId, status, transcript, completedAt } = parseResult.data;

    // Verify the drive exists
    const driveDoc = await db.collection("interview_drives").doc(driveId).get();
    if (!driveDoc.exists) {
      return NextResponse.json({ error: "Interview drive not found" }, { status: 404 });
    }
    const driveData = driveDoc.data() || {};

    // Authorization: Allow organization, college, or the student themselves
    if (authResult.context.user.role === "organization") {
      const ownershipError = await requireOrganizationOwnership(
        authResult.context,
        driveData.organizationId
      );
      if (ownershipError) return ownershipError;
    } else if (authResult.context.user.role === "student") {
      // Students can only create sessions for themselves
      const studentAccessError = await requireStudentAccess(authResult.context, studentId);
      if (studentAccessError) return studentAccessError;
    } else if (authResult.context.user.role === "college") {
      // Colleges can create sessions for their students
      // Additional validation could be added here
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const now = new Date();
    const sessionData: any = {
      driveId,
      studentId,
      status: status || "in-progress",
      transcript: transcript || [],
      startedAt: now,
      completedAt: completedAt ? new Date(completedAt) : null,
      duration: null,
      evaluationTriggered: false,
      createdAt: now,
      updatedAt: now,
      createdBy: authResult.context.user.id,
    };

    // Calculate duration if completed
    if (completedAt && sessionData.completedAt) {
      sessionData.duration = Math.floor((sessionData.completedAt.getTime() - now.getTime()) / 1000);
    }

    const sessionRef = await db.collection("interview_sessions").add(sessionData);

    // Trigger evaluation if status is completed
    if (status === "completed") {
      triggerEvaluation(sessionRef.id, driveData).catch((error) => {
        console.error("Failed to trigger evaluation on session creation:", error);
      });

      // Check if drive should be auto-finalized (after a delay to allow evaluation to complete)
      setTimeout(() => {
        import("@/lib/services/auto-finalize.service")
          .then(({ checkAndAutoFinalize }) => {
            checkAndAutoFinalize(driveId).catch((err) => {
              console.error("Failed to check auto-finalize:", err);
            });
          })
          .catch((err) => {
            console.error("Failed to import auto-finalize service:", err);
          });
      }, 10000); // Wait 10 seconds for evaluation to complete
    }

    return NextResponse.json({
      sessionId: sessionRef.id,
      ...sessionData,
    });
  } catch (error) {
    console.error("Error creating interview session:", error);
    return NextResponse.json({ error: "Failed to create interview session" }, { status: 500 });
  }
}

async function triggerEvaluation(sessionId: string, driveData: any) {
  try {
    const { evaluateWithRetry } = await import("@/lib/services/nlp-evaluation.service");
    const { withCanonicalScores } = await import("@/lib/utils/evaluation-report");

    const sessionDoc = await db.collection("interview_sessions").doc(sessionId).get();
    if (!sessionDoc.exists) throw new Error("Interview session not found");
    const sessionData = sessionDoc.data();
    if (!sessionData) throw new Error("Session data is invalid");
    if (sessionData.evaluationId) return;

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

    console.log("🤖 Starting NLP evaluation for session:", sessionId);
    const evaluationReport = await evaluateWithRetry(evaluationInput, 3);
    console.log("✅ Evaluation completed, report keys:", Object.keys(evaluationReport));

    const cleanedReport = withCanonicalScores({
      ...evaluationReport,
      sentTo: {
        collegeId: driveData.colleges?.[0] || null,
        organizationId: driveData.organizationId || null,
        sentAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log("📝 Cleaned report keys:", Object.keys(cleanedReport));
    console.log("📝 Report studentId:", cleanedReport.studentId);
    console.log("📝 Report driveId:", cleanedReport.driveId);
    
    const reportRef = await db.collection("evaluation_reports").add(cleanedReport);
    console.log("✅ Report saved with ID:", reportRef.id);

    await db.collection("interview_sessions").doc(sessionId).update({
      evaluationId: reportRef.id,
      evaluationTriggered: true,
      updatedAt: new Date(),
    });

    console.log("✅ Evaluation completed and report created:", reportRef.id);
  } catch (error) {
    console.error("❌ Error triggering evaluation:", error);
    throw error;
  }
}

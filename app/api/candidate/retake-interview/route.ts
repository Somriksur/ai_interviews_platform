import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { db } from "@/firebase/admin";

const adminDb = db!;

const retakeSchema = z.object({
  driveId: z.string().min(1),
}).strict();

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "candidate" && user.role !== "student")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - must be a student or candidate" },
        { status: 401 }
      );
    }

    const rawBody = await request.json();
    const parseResult = retakeSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { driveId } = parseResult.data;

    // Get student ID
    const studentSnapshot = await adminDb
      .collection("students")
      .where("userId", "==", user.id)
      .limit(1)
      .get();
    const studentId = studentSnapshot.empty ? user.id : studentSnapshot.docs[0].id;

    // Check if drive exists and is accessible
    const driveDoc = await adminDb.collection("interview_drives").doc(driveId).get();
    if (!driveDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Interview drive not found" },
        { status: 404 }
      );
    }

    const driveData = driveDoc.data();
    
    // Check if student is eligible for this drive
    // This could include checking college assignments, etc.
    
    // Find existing session for this student and drive
    // Use simpler queries to avoid index requirements
    const existingSessionQuery = await adminDb
      .collection("interview_sessions")
      .where("driveId", "==", driveId)
      .where("studentId", "==", studentId)
      .get();

    // Sort by createdAt in memory to avoid index requirement
    const existingSessions = existingSessionQuery.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bTime.getTime() - aTime.getTime();
      });

    let sessionId;

    if (existingSessions.length > 0) {
      // Update existing session to allow retake
      const existingSession = existingSessions[0];
      sessionId = existingSession.id;
      
      await adminDb.collection("interview_sessions").doc(sessionId).update({
        status: "in-progress",
        transcript: [], // Clear old transcript
        completedAt: null,
        evaluationId: null,
        retakeCount: (existingSession.retakeCount || 0) + 1,
        retakeReason: "Empty transcript - technical issue",
        retakenAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`🔄 Reset existing session ${sessionId} for retake`);
    } else {
      // Create new session
      const newSessionData = {
        driveId,
        studentId,
        status: "in-progress",
        transcript: [],
        startedAt: new Date(),
        completedAt: null,
        duration: null,
        evaluationTriggered: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user.id,
        retakeCount: 0
      };

      const sessionRef = await adminDb.collection("interview_sessions").add(newSessionData);
      sessionId = sessionRef.id;

      console.log(`✅ Created new session ${sessionId} for retake`);
    }

    return NextResponse.json({
      success: true,
      sessionId: sessionId,
      driveId: driveId,
      message: "Interview session prepared for retake",
      interviewUrl: `/candidate/interview/${sessionId}`
    });

  } catch (error) {
    console.error("Error preparing retake interview:", error);
    return NextResponse.json(
      { success: false, error: "Failed to prepare retake interview" },
      { status: 500 }
    );
  }
}
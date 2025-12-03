import { NextRequest, NextResponse } from "next/server";
import { db as db } from "@/firebase/admin";

/**
 * POST /api/interview-sessions
 * Create a new interview session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { driveId, studentId, status } = body;

    if (!driveId || !studentId) {
      return NextResponse.json(
        { error: "Missing required fields: driveId, studentId" },
        { status: 400 }
      );
    }

    const sessionData = {
      driveId,
      studentId,
      status: status || "in-progress",
      transcript: [],
      startedAt: new Date(),
      completedAt: null,
      duration: null,
      evaluationTriggered: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const sessionRef = await db.collection("interview_sessions").add(sessionData);

    console.log(`✅ Created interview session: ${sessionRef.id}`);

    return NextResponse.json({
      sessionId: sessionRef.id,
      ...sessionData,
    });
  } catch (error) {
    console.error("❌ Error creating interview session:", error);
    return NextResponse.json(
      { error: "Failed to create interview session" },
      { status: 500 }
    );
  }
}

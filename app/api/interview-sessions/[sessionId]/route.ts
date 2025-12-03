import { NextRequest, NextResponse } from "next/server";
import { db as db } from "@/firebase/admin";

/**
 * GET /api/interview-sessions/[sessionId]
 * Get interview session details
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const sessionDoc = await db
      .collection("interview_sessions")
      .doc(sessionId)
      .get();

    if (!sessionDoc.exists) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: sessionDoc.id,
      ...sessionDoc.data(),
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/interview-sessions/[sessionId]
 * Update interview session (save transcript, mark as completed)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { transcript, status, completedAt } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (transcript) {
      updateData.transcript = transcript;
    }

    if (status) {
      updateData.status = status;
    }

    if (completedAt) {
      updateData.completedAt = new Date(completedAt);
      
      // Calculate duration if we have startedAt
      const sessionDoc = await db
        .collection("interview_sessions")
        .doc(sessionId)
        .get();
      
      if (sessionDoc.exists) {
        const sessionData = sessionDoc.data();
        if (sessionData?.startedAt) {
          const startTime = sessionData.startedAt.toDate();
          const endTime = new Date(completedAt);
          updateData.duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000); // in seconds
        }
      }
    }

    await db
      .collection("interview_sessions")
      .doc(sessionId)
      .update(updateData);

    console.log(`✅ Updated interview session: ${sessionId}`);

    // Automatically trigger NLP evaluation when interview is completed
    if (status === 'completed' && !updateData.evaluationTriggered) {
      console.log(`🤖 Triggering automatic NLP evaluation for session: ${sessionId}`);
      
      // Trigger evaluation asynchronously (don't wait for it)
      triggerEvaluation(sessionId).catch(error => {
        console.error('❌ Failed to trigger evaluation:', error);
      });
    }

    return NextResponse.json({
      success: true,
      sessionId,
    });
  } catch (error) {
    console.error("❌ Error updating session:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}

/**
 * Trigger NLP evaluation asynchronously
 * Calls evaluation logic directly instead of HTTP to avoid auth issues
 */
async function triggerEvaluation(sessionId: string) {
  try {
    // Import evaluation service dynamically to avoid circular dependencies
    const { evaluateWithRetry } = await import('@/lib/services/nlp-evaluation.service');
    
    // Fetch interview session
    const sessionDoc = await db
      .collection('interview_sessions')
      .doc(sessionId)
      .get();

    if (!sessionDoc.exists) {
      throw new Error('Interview session not found');
    }

    const sessionData = sessionDoc.data();

    if (!sessionData) {
      throw new Error('Session data is invalid');
    }

    // Check if evaluation already exists
    if (sessionData.evaluationId) {
      console.log(`✅ Evaluation already exists: ${sessionData.evaluationId}`);
      return;
    }

    // Fetch interview drive to get questions and job role
    const driveDoc = await db
      .collection('interview_drives')
      .doc(sessionData.driveId)
      .get();

    if (!driveDoc.exists) {
      throw new Error('Interview drive not found');
    }

    const driveData = driveDoc.data();

    if (!driveData) {
      throw new Error('Drive data is invalid');
    }

    const questions = driveData.questions?.map((q: any) => q.text || q) || [];
    const jobRole = driveData.role || 'Software Engineer';

    // Prepare evaluation input
    const evaluationInput = {
      transcript: sessionData.transcript || [],
      questions,
      jobRole,
      studentId: sessionData.studentId,
      driveId: sessionData.driveId,
      sessionId,
    };

    // Run evaluation with retry logic
    const evaluationReport = await evaluateWithRetry(evaluationInput, 3);

    // Store evaluation report in Firestore
    const reportData = {
      ...evaluationReport,
      sentTo: {
        collegeId: driveData.colleges?.[0] || null,
        organizationId: driveData.organizationId || null,
        sentAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const reportRef = await db
      .collection('evaluation_reports')
      .add(reportData);

    // Update session with evaluation ID
    await db
      .collection('interview_sessions')
      .doc(sessionId)
      .update({
        evaluationId: reportRef.id,
        evaluationTriggered: true,
        updatedAt: new Date(),
      });

    console.log(`✅ Evaluation triggered successfully: ${reportRef.id}`);
  } catch (error) {
    console.error('❌ Error triggering evaluation:', error);
    throw error;
  }
}

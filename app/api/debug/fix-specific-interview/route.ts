import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/firebase/admin";
import { evaluateWithRetry } from "@/lib/services/nlp-evaluation.service";
import { withCanonicalScores } from "@/lib/utils/evaluation-report";

const fixSchema = z.object({
  evaluationId: z.string().min(1),
  forceReEvaluate: z.boolean().optional().default(false)
}).strict();

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parseResult = fixSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { evaluationId, forceReEvaluate } = parseResult.data;

    console.log(`🔧 Starting fix for evaluation: ${evaluationId}`);

    // Get the evaluation report
    const evalDoc = await db.collection("evaluation_reports").doc(evaluationId).get();
    if (!evalDoc.exists) {
      return NextResponse.json({ error: "Evaluation report not found" }, { status: 404 });
    }

    const evalData = evalDoc.data();
    console.log("📊 Current evaluation data:", {
      studentId: evalData?.studentId,
      driveId: evalData?.driveId,
      sessionId: evalData?.sessionId,
      overallScore: evalData?.scores?.overall || evalData?.overallScore,
      hasTranscript: !!evalData?.transcript,
      questionResponsesCount: evalData?.transcript?.questionResponses?.length || 0
    });

    // Check if this evaluation has the "No response recorded" issue
    const hasNoResponseIssue = evalData?.transcript?.questionResponses?.some((qr: any) => 
      qr.response === "No response recorded..." || qr.response === "No response recorded"
    );

    if (!hasNoResponseIssue && !forceReEvaluate) {
      return NextResponse.json({
        message: "This evaluation doesn't appear to have the 'No response recorded' issue",
        currentScore: evalData?.scores?.overall || evalData?.overallScore,
        suggestion: "Use forceReEvaluate: true if you want to re-evaluate anyway"
      });
    }

    // Find the corresponding interview session
    const sessionId = evalData?.sessionId;
    if (!sessionId) {
      return NextResponse.json({ error: "No session ID found in evaluation report" }, { status: 400 });
    }

    const sessionDoc = await db.collection("interview_sessions").doc(sessionId).get();
    if (!sessionDoc.exists) {
      return NextResponse.json({ error: "Interview session not found" }, { status: 404 });
    }

    const sessionData = sessionDoc.data();
    const transcript = sessionData?.transcript || [];

    console.log("📝 Session transcript analysis:", {
      totalMessages: transcript.length,
      messageTypes: transcript.reduce((acc: any, msg: any) => {
        acc[msg.role] = (acc[msg.role] || 0) + 1;
        return acc;
      }, {}),
      sampleMessages: transcript.slice(0, 3).map((msg: any) => ({
        role: msg.role,
        contentLength: msg.content?.length || 0,
        contentPreview: msg.content?.substring(0, 50) + '...'
      }))
    });

    // Check if transcript has actual user responses
    const userResponses = transcript.filter((msg: any) => {
      // Enhanced filtering logic
      if (msg.role === 'user' || msg.role === 'candidate' || msg.role === 'student') {
        return msg.content && msg.content.trim().length > 3;
      }
      return false;
    });

    if (userResponses.length === 0) {
      return NextResponse.json({
        error: "No user responses found in transcript",
        transcript: transcript,
        suggestion: "The original interview may not have captured responses properly. Consider conducting a new interview."
      }, { status: 400 });
    }

    console.log("✅ Found user responses:", {
      count: userResponses.length,
      responses: userResponses.map((msg: any) => ({
        content: msg.content.substring(0, 100) + '...',
        length: msg.content.length
      }))
    });

    // Get drive data for questions
    const driveId = evalData?.driveId || sessionData?.driveId;
    const driveDoc = await db.collection("interview_drives").doc(driveId).get();
    if (!driveDoc.exists) {
      return NextResponse.json({ error: "Interview drive not found" }, { status: 404 });
    }

    const driveData = driveDoc.data();
    const questions = driveData?.questions?.map((q: any) => q.text || q) || [];
    const jobRole = driveData?.role || 'Software Engineer';

    console.log("📋 Interview setup:", {
      questionsCount: questions.length,
      jobRole: jobRole,
      questions: questions.map(q => q.substring(0, 50) + '...')
    });

    // Prepare evaluation input with enhanced transcript processing
    const evaluationInput = {
      transcript: transcript.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: String(msg.content || ''),
        timestamp: new Date(msg.timestamp || Date.now())
      })),
      questions,
      jobRole,
      studentId: evalData?.studentId || sessionData?.studentId,
      driveId: driveId,
      sessionId: sessionId
    };

    console.log("🧠 Starting re-evaluation with enhanced processing...");

    // Run the enhanced evaluation
    const evaluationReport = await evaluateWithRetry(evaluationInput, 3);

    console.log("✅ Re-evaluation completed:", {
      newOverallScore: evaluationReport.scores?.overall,
      newTechnicalScore: evaluationReport.scores?.technical,
      newCommunicationScore: evaluationReport.scores?.communication,
      processingTime: evaluationReport.aiMetadata?.processingTime
    });

    // Clean and prepare the new report
    const cleanedReport = withCanonicalScores({
      ...evaluationReport,
      sentTo: evalData?.sentTo || {
        collegeId: driveData.colleges?.[0] || null,
        organizationId: driveData.organizationId || null,
        sentTo: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      // Mark as re-evaluated
      reEvaluatedAt: new Date(),
      reEvaluationReason: 'Fixed missing responses issue - enhanced processing',
      originalEvaluationId: evaluationId
    });

    // Update the existing evaluation report instead of creating a new one
    await db.collection("evaluation_reports").doc(evaluationId).set(cleanedReport, { merge: false });

    console.log("💾 Updated evaluation report successfully");

    // Also update the session to mark it as fixed
    await db.collection("interview_sessions").doc(sessionId).update({
      updatedAt: new Date(),
      reEvaluatedAt: new Date(),
      reEvaluationReason: 'Fixed missing responses issue'
    });

    return NextResponse.json({
      success: true,
      message: "Interview evaluation has been fixed successfully!",
      evaluationId: evaluationId,
      improvements: {
        oldScore: evalData?.scores?.overall || evalData?.overallScore || 0,
        newScore: cleanedReport.scores?.overall || cleanedReport.overallScore,
        oldTechnical: evalData?.scores?.technical || 0,
        newTechnical: cleanedReport.scores?.technical,
        oldCommunication: evalData?.scores?.communication || 0,
        newCommunication: cleanedReport.scores?.communication
      },
      responsesSummary: {
        questionsCount: questions.length,
        responsesFound: userResponses.length,
        avgResponseLength: Math.round(userResponses.reduce((sum: number, msg: any) => sum + msg.content.length, 0) / userResponses.length)
      }
    });

  } catch (error) {
    console.error("❌ Error fixing interview:", error);
    return NextResponse.json({ 
      error: "Failed to fix interview evaluation", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
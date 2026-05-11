import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/firebase/admin";

const debugSchema = z.object({
  sessionId: z.string().optional(),
  evaluationId: z.string().optional(),
}).strict();

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parseResult = debugSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { sessionId, evaluationId } = parseResult.data;

    let sessionDoc;
    let sessionData;

    if (evaluationId) {
      // Get session from evaluation report
      const evalDoc = await db.collection("evaluation_reports").doc(evaluationId).get();
      if (!evalDoc.exists) {
        return NextResponse.json({ error: "Evaluation report not found" }, { status: 404 });
      }
      
      const evalData = evalDoc.data();
      const sessionIdFromEval = evalData?.sessionId;
      
      if (!sessionIdFromEval) {
        return NextResponse.json({ error: "No session ID found in evaluation report" }, { status: 400 });
      }
      
      sessionDoc = await db.collection("interview_sessions").doc(sessionIdFromEval).get();
      if (!sessionDoc.exists) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }
      sessionData = sessionDoc.data();
    } else if (sessionId) {
      // Get session directly
      sessionDoc = await db.collection("interview_sessions").doc(sessionId).get();
      if (!sessionDoc.exists) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }
      sessionData = sessionDoc.data();
    } else {
      return NextResponse.json({ error: "Either sessionId or evaluationId is required" }, { status: 400 });
    }
    const transcript = sessionData?.transcript || [];

    // Analyze transcript structure
    const analysis = {
      sessionId: sessionDoc?.id,
      evaluationId: evaluationId,
      sessionStatus: sessionData?.status,
      transcriptLength: transcript.length,
      messageTypes: transcript.map((msg: any) => ({
        role: msg.role,
        contentLength: msg.content?.length || 0,
        contentPreview: msg.content?.substring(0, 100) + (msg.content?.length > 100 ? '...' : ''),
        timestamp: msg.timestamp
      })),
      roleDistribution: transcript.reduce((acc: any, msg: any) => {
        acc[msg.role] = (acc[msg.role] || 0) + 1;
        return acc;
      }, {}),
      userResponses: transcript
        .filter((msg: any) => msg.role === 'user' || msg.role === 'candidate' || msg.role === 'student')
        .map((msg: any) => ({
          content: msg.content,
          length: msg.content?.length || 0,
          timestamp: msg.timestamp
        })),
      potentialIssues: []
    };

    // Detect potential issues
    if (transcript.length === 0) {
      analysis.potentialIssues.push("Empty transcript - no messages recorded");
    }

    if (analysis.userResponses.length === 0) {
      analysis.potentialIssues.push("No user responses found - check role filtering");
    }

    if (analysis.userResponses.some((r: any) => !r.content || r.content.trim().length < 3)) {
      analysis.potentialIssues.push("Some user responses are empty or too short");
    }

    if (analysis.roleDistribution.user === undefined && analysis.roleDistribution.candidate === undefined) {
      analysis.potentialIssues.push("No 'user' or 'candidate' role messages found - check Vapi configuration");
    }

    // Check for evaluation report
    let evaluationReport = null;
    if (sessionData?.evaluationId) {
      const reportDoc = await db.collection("evaluation_reports").doc(sessionData.evaluationId).get();
      if (reportDoc.exists) {
        const reportData = reportDoc.data();
        evaluationReport = {
          evaluationId: sessionData.evaluationId,
          scores: reportData?.scores,
          recommendation: reportData?.recommendation,
          processingTime: reportData?.aiMetadata?.processingTime,
          nlpVersion: reportData?.aiMetadata?.nlpVersion
        };
      }
    }

    return NextResponse.json({
      analysis,
      evaluationReport,
      recommendations: generateRecommendations(analysis)
    });

  } catch (error) {
    console.error("Error analyzing transcript:", error);
    return NextResponse.json({ error: "Failed to analyze transcript" }, { status: 500 });
  }
}

function generateRecommendations(analysis: any): string[] {
  const recommendations = [];

  if (analysis.transcriptLength === 0) {
    recommendations.push("Check Vapi integration - transcript is not being captured");
    recommendations.push("Verify that Vapi client is properly initialized and connected");
    recommendations.push("Check browser console for Vapi connection errors");
  }

  if (analysis.userResponses.length === 0) {
    recommendations.push("Check Vapi message handling - user responses not being captured with correct role");
    recommendations.push("Verify that Vapi is configured to use 'user' role for candidate responses");
    recommendations.push("Check if microphone permissions are granted");
  }

  if (analysis.userResponses.length > 0 && analysis.userResponses.some((r: any) => r.length < 10)) {
    recommendations.push("Some responses are very short - check speech-to-text accuracy");
    recommendations.push("Verify that candidates are speaking clearly and long enough");
    recommendations.push("Check Vapi transcription settings and language configuration");
  }

  if (analysis.roleDistribution.assistant && !analysis.roleDistribution.user) {
    recommendations.push("Only interviewer messages found - check if candidate responses are being captured");
    recommendations.push("Verify Vapi transcript event handling in frontend code");
  }

  return recommendations;
}
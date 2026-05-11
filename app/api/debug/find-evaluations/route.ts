import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/firebase/admin";

const findSchema = z.object({
  studentId: z.string().optional(),
  driveId: z.string().optional(),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional()
  }).optional()
}).strict();

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parseResult = findSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { studentId, driveId, dateRange } = parseResult.data;

    console.log("🔍 Searching for evaluations with criteria:", { studentId, driveId, dateRange });

    // Build query
    let query = db.collection("evaluation_reports");

    if (studentId) {
      query = query.where("studentId", "==", studentId);
    }

    if (driveId) {
      query = query.where("driveId", "==", driveId);
    }

    // Add date range if specified
    if (dateRange?.start) {
      query = query.where("createdAt", ">=", new Date(dateRange.start));
    }

    if (dateRange?.end) {
      query = query.where("createdAt", "<=", new Date(dateRange.end));
    }

    // Order by creation date (most recent first)
    query = query.orderBy("createdAt", "desc").limit(20);

    const snapshot = await query.get();

    const evaluations = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        evaluationId: doc.id,
        studentId: data.studentId,
        driveId: data.driveId,
        sessionId: data.sessionId,
        overallScore: data.scores?.overall || data.overallScore || 0,
        technicalScore: data.scores?.technical || 0,
        communicationScore: data.scores?.communication || 0,
        recommendation: data.recommendation,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        hasNoResponseIssue: data.transcript?.questionResponses?.some((qr: any) => 
          qr.response === "No response recorded..." || qr.response === "No response recorded"
        ) || false,
        processingTime: data.aiMetadata?.processingTime,
        nlpVersion: data.aiMetadata?.nlpVersion
      };
    });

    // Identify problematic evaluations
    const problematicEvaluations = evaluations.filter(evaluation => 
      evaluation.hasNoResponseIssue || evaluation.overallScore < 20
    );

    return NextResponse.json({
      success: true,
      totalFound: evaluations.length,
      problematicCount: problematicEvaluations.length,
      evaluations: evaluations,
      problematicEvaluations: problematicEvaluations,
      searchCriteria: { studentId, driveId, dateRange }
    });

  } catch (error) {
    console.error("❌ Error finding evaluations:", error);
    return NextResponse.json({ 
      error: "Failed to find evaluations", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint for simple queries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const driveId = searchParams.get('driveId');

    // Find recent evaluations with low scores (likely problematic)
    let query = db.collection("evaluation_reports")
      .orderBy("createdAt", "desc")
      .limit(10);

    if (studentId) {
      query = query.where("studentId", "==", studentId);
    }

    if (driveId) {
      query = query.where("driveId", "==", driveId);
    }

    const snapshot = await query.get();

    const recentEvaluations = snapshot.docs.map(doc => {
      const data = doc.data();
      const overallScore = data.scores?.overall || data.overallScore || 0;
      
      return {
        evaluationId: doc.id,
        studentId: data.studentId,
        driveId: data.driveId,
        overallScore: overallScore,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        hasIssue: overallScore < 20 || data.transcript?.questionResponses?.some((qr: any) => 
          qr.response === "No response recorded..." || qr.response === "No response recorded"
        ),
        company: data.sentTo?.organizationId || 'Unknown'
      };
    });

    return NextResponse.json({
      success: true,
      recentEvaluations: recentEvaluations,
      problematicEvaluations: recentEvaluations.filter(e => e.hasIssue)
    });

  } catch (error) {
    console.error("❌ Error in GET evaluations:", error);
    return NextResponse.json({ 
      error: "Failed to get evaluations", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
// NLP Evaluation API Endpoint
// Triggers evaluation of interview transcripts and generates reports

import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { evaluateWithRetry } from '@/lib/services/nlp-evaluation.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Fetch interview session
    const sessionDoc = await db
      .collection('interview_sessions')
      .doc(sessionId)
      .get();

    if (!sessionDoc.exists) {
      return NextResponse.json(
        { error: 'Interview session not found' },
        { status: 404 }
      );
    }

    const sessionData = sessionDoc.data();

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session data is invalid' },
        { status: 500 }
      );
    }

    // Validate session is completed
    if (sessionData.status !== 'completed') {
      return NextResponse.json(
        { error: 'Interview session is not completed yet' },
        { status: 400 }
      );
    }

    // Check if evaluation already exists
    if (sessionData.evaluationId) {
      return NextResponse.json(
        { 
          message: 'Evaluation already exists',
          evaluationId: sessionData.evaluationId 
        },
        { status: 200 }
      );
    }

    // Fetch interview drive to get questions and job role
    const driveDoc = await db
      .collection('interview_drives')
      .doc(sessionData.driveId)
      .get();

    if (!driveDoc.exists) {
      return NextResponse.json(
        { error: 'Interview drive not found' },
        { status: 404 }
      );
    }

    const driveData = driveDoc.data();

    if (!driveData) {
      return NextResponse.json(
        { error: 'Drive data is invalid' },
        { status: 500 }
      );
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

    return NextResponse.json({
      success: true,
      evaluationId: reportRef.id,
      report: {
        ...evaluationReport,
        id: reportRef.id,
      },
    });
  } catch (error) {
    console.error('Error in evaluation API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate evaluation report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve evaluation report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const reportId = searchParams.get('reportId');

    if (!sessionId && !reportId) {
      return NextResponse.json(
        { error: 'Either sessionId or reportId is required' },
        { status: 400 }
      );
    }

    if (reportId) {
      // Fetch by report ID
      const reportDoc = await db
        .collection('evaluation_reports')
        .doc(reportId)
        .get();

      if (!reportDoc.exists) {
        return NextResponse.json(
          { error: 'Evaluation report not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        id: reportDoc.id,
        ...reportDoc.data(),
      });
    }

    if (sessionId) {
      // Fetch session to get evaluation ID
      const sessionDoc = await db
        .collection('interview_sessions')
        .doc(sessionId)
        .get();

      if (!sessionDoc.exists) {
        return NextResponse.json(
          { error: 'Interview session not found' },
          { status: 404 }
        );
      }

      const sessionData = sessionDoc.data();
      
      if (!sessionData?.evaluationId) {
        return NextResponse.json(
          { error: 'No evaluation report found for this session' },
          { status: 404 }
        );
      }

      // Fetch the evaluation report
      const reportDoc = await db
        .collection('evaluation_reports')
        .doc(sessionData.evaluationId)
        .get();

      if (!reportDoc.exists) {
        return NextResponse.json(
          { error: 'Evaluation report not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        id: reportDoc.id,
        ...reportDoc.data(),
      });
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching evaluation report:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch evaluation report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { evaluateInterview } from '@/lib/services/nlp-evaluation.service';
import { getCurrentUser } from '@/lib/actions/auth.action';
import { withCanonicalScores } from '@/lib/utils/evaluation-report';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ driveId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'organization') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { driveId } = await params;
    console.log(`📊 Generating evaluation reports for drive: ${driveId}`);

    const driveDoc = await db.collection('interview_drives').doc(driveId).get();
    if (!driveDoc.exists) {
      return NextResponse.json(
        { error: 'Interview drive not found' },
        { status: 404 }
      );
    }

    const driveData = driveDoc.data();

    const sessionsSnapshot = await db
      .collection('interview_sessions')
      .where('driveId', '==', driveId)
      .where('status', '==', 'completed')
      .get();

    if (sessionsSnapshot.empty) {
      return NextResponse.json(
        { error: 'No completed interview sessions found' },
        { status: 400 }
      );
    }

    const reports: string[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const sessionDoc of sessionsSnapshot.docs) {
      try {
        const sessionData = sessionDoc.data();

        // Reuse existing evaluation if present
        if (sessionData.evaluationId) {
          reports.push(sessionData.evaluationId);
          successCount++;
          continue;
        }

        const questions =
          (driveData?.questions || []).map((q: any) => q.text || q).filter(Boolean);

        const evaluationInput = {
          transcript: sessionData.transcript || [],
          questions,
          jobRole: driveData?.role || 'Software Developer',
          studentId: sessionData.studentId,
          driveId,
          sessionId: sessionDoc.id,
          targetIndustry: driveData?.industry || 'Technology',
          experienceLevel: 'entry' as const,
        };

        const evaluation = await evaluateInterview(evaluationInput);

        const reportRef = await db.collection('evaluation_reports').add(
          withCanonicalScores({
            ...evaluation,
            sentTo: {
              collegeId: sessionData.collegeId || driveData?.colleges?.[0] || null,
              organizationId: driveData?.organizationId || null,
              sentAt: new Date(),
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );

        await db.collection('interview_sessions').doc(sessionDoc.id).update({
          evaluationId: reportRef.id,
          evaluationTriggered: true,
          updatedAt: new Date(),
        });

        reports.push(reportRef.id);
        successCount++;
      } catch (error) {
        console.error(`❌ Error generating report for session ${sessionDoc.id}:`, error);
        errorCount++;
      }
    }

    await db.collection('interview_drives').doc(driveId).update({
      status: 'completed',
      completedAt: new Date(),
      reportsGenerated: successCount,
      reportGenerationErrors: errorCount,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      reportsGenerated: successCount,
      errors: errorCount,
      reportIds: reports,
      message: `Generated ${successCount} evaluation reports from completed interview sessions.`,
    });
  } catch (error) {
    console.error('❌ Error generating reports:', error);
    return NextResponse.json(
      { error: 'Failed to generate reports' },
      { status: 500 }
    );
  }
}

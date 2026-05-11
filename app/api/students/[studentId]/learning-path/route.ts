import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { LearningPathService } from '@/lib/nlp/learning-path.service';

/**
 * GET /api/students/[studentId]/learning-path
 * Generate AI-powered learning path for student
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;

    // Fetch student profile
    const studentDoc = await db.collection('students').doc(studentId).get();
    
    if (!studentDoc.exists) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const studentData = studentDoc.data();

    // Fetch latest evaluation reports
    const reportsSnapshot = await db
      .collection('evaluation_reports')
      .where('studentId', '==', studentId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    let evaluationScores;
    let semanticGaps;

    if (!reportsSnapshot.empty) {
      const latestReport = reportsSnapshot.docs[0].data();
      evaluationScores = latestReport.scores;
      
      // Extract semantic gaps from feedback
      semanticGaps = {
        missingConcepts: latestReport.feedback?.questionResponses
          ?.flatMap((qr: any) => qr.semanticAnalysis?.missingConcepts || [])
          .slice(0, 10) || [],
        weakAreas: latestReport.feedback?.improvements?.slice(0, 5) || []
      };
    }

    // Count interview attempts
    const interviewsSnapshot = await db
      .collection('interview_sessions')
      .where('studentId', '==', studentId)
      .where('status', '==', 'completed')
      .get();

    const interviewCount = interviewsSnapshot.size;

    // Prepare student data for learning path generation
    const learningPathInput = {
      studentId,
      resumeSkills: studentData?.skills || studentData?.extractedSkills || [],
      domain: studentData?.domain || 'General',
      experienceLevel: studentData?.experienceLevel || 'fresher',
      evaluationScores,
      semanticGaps,
      interviewCount
    };

    // Generate learning path
    const learningPathService = new LearningPathService();
    const learningPath = learningPathService.generateLearningPath(learningPathInput);

    return NextResponse.json({
      success: true,
      data: learningPath,
      metadata: {
        studentId,
        generatedAt: new Date().toISOString(),
        basedOnInterviews: interviewCount,
        hasEvaluationData: !!evaluationScores
      }
    });

  } catch (error) {
    console.error('Error generating learning path:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate learning path',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

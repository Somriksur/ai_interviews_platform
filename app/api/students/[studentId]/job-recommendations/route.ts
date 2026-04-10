import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { matchStudentWithJobs } from '@/lib/services/categorization.service';
import { getAuthContext } from '@/lib/security/auth-context';
import { requireStudentAccess } from '@/lib/security/guards';
import { withCanonicalScores } from '@/lib/utils/evaluation-report';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const { studentId } = await params;
    const accessError = await requireStudentAccess(authResult.context, studentId);
    if (accessError) return accessError;

    const reportsSnapshot = await db
      .collection('evaluation_reports')
      .where('studentId', '==', studentId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (reportsSnapshot.empty) {
      return NextResponse.json(
        { error: 'No reports found for this student' },
        { status: 404 }
      );
    }

    const canonical = withCanonicalScores(reportsSnapshot.docs[0].data());
    const reportData = {
      technicalScore: canonical.technicalScore,
      communicationRating: canonical.communicationScore,
      overallScore: canonical.overallScore,
      skillInsights: {
        technical: [],
        communication: [],
        problemSolving: [],
        leadership: [],
      },
    } as StudentReport;

    const jobsSnapshot = await db
      .collection('jobPostings')
      .where('status', '==', 'active')
      .get();

    const availableJobs = jobsSnapshot.docs.map(doc => ({
      id: doc.id,
      role: doc.data().role,
      skills: doc.data().skills || [],
      salaryRange: doc.data().salaryRange || { min: 300000, max: 600000, category: 'mid' },
      minScore: doc.data().minScore || 50,
    }));

    const recommendations = matchStudentWithJobs(reportData, availableJobs);

    return NextResponse.json({
      studentId,
      recommendations,
      totalMatches: recommendations.length,
    });
  } catch (error) {
    console.error('Error getting job recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get job recommendations' },
      { status: 500 }
    );
  }
}

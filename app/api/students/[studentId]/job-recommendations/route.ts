import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { matchStudentWithJobs } from '@/lib/services/categorization.service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;

    // Get student's latest report
    const reportsSnapshot = await db
      .collection('placement_reports')
      .where('studentId', '==', studentId)
      .orderBy('generatedAt', 'desc')
      .limit(1)
      .get();

    if (reportsSnapshot.empty) {
      return NextResponse.json(
        { error: 'No reports found for this student' },
        { status: 404 }
      );
    }

    const reportData = reportsSnapshot.docs[0].data() as StudentReport;

    // Get available job postings
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

    // Match student with jobs
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

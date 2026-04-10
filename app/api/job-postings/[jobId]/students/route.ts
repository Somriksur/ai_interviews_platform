import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { getCurrentUser } from '@/lib/actions/auth.action';
import { withCanonicalScores } from '@/lib/utils/evaluation-report';

/**
 * GET /api/job-postings/[jobId]/students
 * Get all students tagged for this job posting across all colleges
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'organization') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await params;

    // Get job posting
    const jobDoc = await db.collection('jobPostings').doc(jobId).get();
    if (!jobDoc.exists) {
      return NextResponse.json({ error: 'Job posting not found' }, { status: 404 });
    }

    const jobData = jobDoc.data();
    const orgSnapshot = await db
      .collection('organizations')
      .where('adminId', '==', user.id)
      .limit(1)
      .get();

    if (orgSnapshot.empty || jobData?.organizationId !== orgSnapshot.docs[0].id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all notifications for this job that were confirmed
    const notificationsSnapshot = await db
      .collection('jobNotifications')
      .where('jobPostingId', '==', jobId)
      .where('status', '==', 'confirmed')
      .get();

    const confirmedCollegeIds = notificationsSnapshot.docs.map(
      (doc) => doc.data().collegeId
    );

    if (confirmedCollegeIds.length === 0) {
      return NextResponse.json({ students: [], colleges: [] });
    }

    // Get all students from confirmed colleges
    const studentsPromises = confirmedCollegeIds.map(async (collegeId) => {
      const studentsSnapshot = await db
        .collection('students')
        .where('collegeId', '==', collegeId)
        .get();

      const students = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { collegeId, students };
    });

    const collegeStudents = await Promise.all(studentsPromises);

    // Get college details
    const collegesPromises = confirmedCollegeIds.map(async (collegeId) => {
      const collegeDoc = await db.collection('colleges').doc(collegeId).get();
      return {
        id: collegeId,
        ...collegeDoc.data(),
      };
    });

    const colleges = await Promise.all(collegesPromises);

    // Flatten all students
    const allStudents = collegeStudents.flatMap((cs) => cs.students);

    // Get comprehensive evaluation reports for these students
    const studentIds = allStudents.map((s: any) => s.id);
    const reportsPromises = studentIds.map(async (studentId) => {
      const reportsSnapshot = await db
        .collection('evaluation_reports')
        .where('studentId', '==', studentId)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      if (reportsSnapshot.empty) return null;

      const reportData = withCanonicalScores(reportsSnapshot.docs[0].data());
      
      // Ensure all required fields are present with defaults
      return {
        studentId,
        id: reportsSnapshot.docs[0].id,
        // Technical Metrics
        technicalScore: reportData.technicalScore || 0,
        conceptualUnderstanding: reportData.scores?.conceptualUnderstanding || 0,
        codeQuality: reportData.scores?.technicalCorrectness || 0,
        logicAndReasoning: reportData.problemSolvingScore || 0,
        // Communication & Behavior
        communicationRating: reportData.communicationScore || 0,
        sentimentScore: reportData.emotionAnalysis?.overallWellbeing || 0,
        professionalismScore: reportData.emotionAnalysis?.communication?.professionalism || 0,
        confidenceLevel: reportData.confidenceAnalysis?.metrics?.overallConfidence || 0,
        // Emotional Analysis
        emotionalAnalysis: reportData.emotionAnalysis || {
          overall: 'neutral',
          nervousness: 0,
          confidence: 0,
          stress: 0,
          calmness: 0,
          motivation: 0,
          emotionalTone: 'Not available',
        },
        // Behavioral Analysis
        behavioralAnalysis: reportData.behavioralAnalysis || null,
        // Language Quality
        languageQuality: reportData.languageQuality || null,
        // Overall
        overallScore: reportData.overallScore || 0,
        skillInsights: reportData.skillInsights || {},
        strengths: reportData.feedback?.strengths || reportData.strengths || [],
        weaknesses: reportData.feedback?.improvements || reportData.weaknesses || [],
        evaluationSummary: reportData.feedback?.detailedAnalysis || reportData.evaluationSummary || '',
        // Metadata
        createdAt: reportData.createdAt || new Date(),
      };
    });

    const reports = (await Promise.all(reportsPromises)).filter(Boolean);

    // Get selection status for students
    const selectionsSnapshot = await db
      .collection('studentSelections')
      .where('jobPostingId', '==', jobId)
      .get();

    const selections = selectionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      jobPosting: { 
        id: jobId, 
        ...jobData,
        minimumScore: jobData?.minimumScore || null,
      },
      students: allStudents,
      colleges,
      reports,
      selections,
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

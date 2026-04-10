import { NextRequest, NextResponse } from 'next/server';
import { z } from "zod";
import { db as db } from '@/firebase/admin';
import { getCurrentUser } from '@/lib/actions/auth.action';
import { withCanonicalScores } from '@/lib/utils/evaluation-report';

const selectStudentsSchema = z
  .object({
    studentIds: z.array(z.string().min(1)).min(1),
    action: z.enum(["select", "reject", "shortlist"]),
  })
  .strict();

/**
 * POST /api/job-postings/[jobId]/select-students
 * Organization selects students for a job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'organization') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await params;
    const rawBody = await request.json();
    const parseResult = selectStudentsSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const { studentIds, action } = parseResult.data;

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

    // Create or update selections for each student
    const selectionPromises = studentIds.map(async (studentId: string) => {
      // Get student details
      const studentDoc = await db.collection('students').doc(studentId).get();
      if (!studentDoc.exists) return null;

      const studentData = studentDoc.data();

      // Get student's interview report for score tracking
      let overallScore = 0;
      const reportsSnapshot = await db
        .collection('evaluation_reports')
        .where('studentId', '==', studentId)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      if (!reportsSnapshot.empty) {
        const canonical = withCanonicalScores(reportsSnapshot.docs[0].data());
        overallScore = canonical.overallScore || 0;
      }

      // Calculate threshold tracking
      const minimumScore = jobData?.minimumScore;
      const meetsThreshold = minimumScore !== undefined
        ? overallScore >= minimumScore
        : true;
      
      const recommendationOverride = minimumScore !== undefined
        ? action === 'select' && !meetsThreshold
        : undefined;

      // Check if selection already exists
      const existingSelection = await db
        .collection('studentSelections')
        .where('jobPostingId', '==', jobId)
        .where('studentId', '==', studentId)
        .get();

      const selectionData = {
        jobPostingId: jobId,
        studentId,
        collegeId: studentData?.collegeId,
        organizationId: jobData?.organizationId,
        status: action, // 'select', 'reject', 'shortlist'
        jobTitle: jobData?.title,
        jobPackage: jobData?.package,
        selectedAt: new Date(),
        selectedBy: user.id,
        // New tracking fields
        scoreAtSelection: overallScore,
        meetsThreshold,
        recommendationOverride,
      };

      if (!existingSelection.empty) {
        // Update existing selection
        const selectionId = existingSelection.docs[0].id;
        await db
          .collection('studentSelections')
          .doc(selectionId)
          .update(selectionData);
        return { id: selectionId, ...selectionData };
      } else {
        // Create new selection
        const selectionRef = await db
          .collection('studentSelections')
          .add({
            ...selectionData,
            createdAt: new Date(),
          });
        return { id: selectionRef.id, ...selectionData };
      }
    });

    const selections = (await Promise.all(selectionPromises)).filter(Boolean);

    // Create notifications for colleges
    const collegeIds = [...new Set(selections.map((s: any) => s.collegeId))];
    
    const notificationPromises = collegeIds.map(async (collegeId) => {
      const selectedCount = selections.filter(
        (s: any) => s.collegeId === collegeId && s.status === 'select'
      ).length;

      if (selectedCount > 0) {
        await db.collection('notifications').add({
          type: 'student_selection',
          collegeId,
          jobPostingId: jobId,
          organizationId: jobData?.organizationId,
          message: `${selectedCount} student(s) selected for ${jobData?.title}`,
          status: 'unread',
          createdAt: new Date(),
        });
      }
    });

    await Promise.all(notificationPromises);

    return NextResponse.json({
      success: true,
      message: `${selections.length} student(s) ${action}ed successfully`,
      selections,
    });
  } catch (error) {
    console.error('Error selecting students:', error);
    return NextResponse.json(
      { error: 'Failed to select students' },
      { status: 500 }
    );
  }
}

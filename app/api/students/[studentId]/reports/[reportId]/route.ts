import { NextRequest, NextResponse } from "next/server";
import { db as db } from "@/firebase/admin";
import { getCurrentUser } from "@/lib/actions/auth.action";

/**
 * DELETE /api/students/[studentId]/reports/[reportId]
 * Delete a student's evaluation report
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ studentId: string; reportId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId, reportId } = await params;

    // Get the evaluation report
    const reportDoc = await db.collection('evaluation_reports').doc(reportId).get();
    
    if (!reportDoc.exists) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const reportData = reportDoc.data();

    // Verify the report belongs to the student
    if (reportData?.studentId !== studentId) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Check authorization based on user role
    if (user.role === 'student') {
      // Students can only delete their own reports
      const studentDoc = await db.collection('students').doc(studentId).get();
      if (!studentDoc.exists || studentDoc.data()?.userId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized - not your report' }, { status: 403 });
      }
    } else if (user.role === 'college') {
      // College admins can delete reports for their students
      const studentDoc = await db.collection('students').doc(studentId).get();
      if (!studentDoc.exists) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      const collegeDoc = await db.collection('colleges').doc(studentDoc.data()?.collegeId).get();
      if (!collegeDoc.exists || collegeDoc.data()?.adminId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized - not your student' }, { status: 403 });
      }
    } else if (user.role === 'organization') {
      // Organization admins can delete reports from their drives
      if (reportData?.sentTo?.organizationId) {
        const orgSnapshot = await db
          .collection('organizations')
          .where('adminId', '==', user.id)
          .get();

        if (orgSnapshot.empty || orgSnapshot.docs[0].id !== reportData.sentTo.organizationId) {
          return NextResponse.json({ error: 'Unauthorized - not your organization report' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the report
    await reportDoc.ref.delete();

    // Update the interview session to remove the evaluation reference
    if (reportData?.sessionId) {
      await db.collection('interview_sessions').doc(reportData.sessionId).update({
        evaluationId: null,
        evaluationTriggered: false,
        updatedAt: new Date(),
      });
    }

    console.log(`✅ Deleted evaluation report ${reportId} for student ${studentId}`);

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting report:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}
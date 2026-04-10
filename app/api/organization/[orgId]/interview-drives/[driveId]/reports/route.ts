import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { getAuthContext } from "@/lib/security/auth-context";
import { requireOrganizationOwnership } from "@/lib/security/guards";
import { withCanonicalScores } from "@/lib/utils/evaluation-report";

/**
 * GET /api/organization/[orgId]/interview-drives/[driveId]/reports
 * Get all reports for a specific interview drive
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string; driveId: string }> }
) {
  try {
    const authResult = await getAuthContext(_request);
    if (!authResult.ok) return authResult.response;

    const { orgId, driveId } = await params;
    const accessError = await requireOrganizationOwnership(authResult.context, orgId);
    if (accessError) return accessError;

    // Verify the drive belongs to this organization
    const driveDoc = await db
      .collection('interview_drives')
      .doc(driveId)
      .get();

    if (!driveDoc.exists) {
      return NextResponse.json(
        { error: 'Interview drive not found' },
        { status: 404 }
      );
    }

    const driveData = driveDoc.data();
    if (driveData?.organizationId !== orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get evaluation reports for this drive (single source of truth)
    const evalReportsSnapshot = await db
      .collection('evaluation_reports')
      .where('driveId', '==', driveId)
      .orderBy('createdAt', 'desc')
      .get();

    // Get all selection records for this drive
    const selectionsSnapshot = await db
      .collection('drive_student_selections')
      .where('driveId', '==', driveId)
      .get();

    const selectionsMap = new Map();
    selectionsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      selectionsMap.set(data.studentId, data.action); // 'selected' or 'rejected'
    });

    // Get reports with student details
    const reports = await Promise.all(
      evalReportsSnapshot.docs.map(async (doc) => {
        const reportData = withCanonicalScores(doc.data());

        // Get student details
        let studentData = null;
        if (reportData.studentId) {
          const studentDoc = await db
            .collection('students')
            .doc(reportData.studentId)
            .get();
          
          if (studentDoc.exists) {
            const student = studentDoc.data();
            studentData = {
              id: studentDoc.id,
              name: student?.name,
              email: student?.email,
              rollNumber: student?.rollNumber,
              branch: student?.branch,
              cgpa: student?.cgpa,
            };
          }
        }

        // Get college details
        let collegeData = null;
        const collegeId = reportData.sentTo?.collegeId;
        
        if (collegeId) {
          const collegeDoc = await db
            .collection('colleges')
            .doc(collegeId)
            .get();
          
          if (collegeDoc.exists) {
            collegeData = {
              id: collegeDoc.id,
              name: collegeDoc.data()?.name,
            };
          }
        }

        const generatedAt =
          reportData.createdAt?.toDate?.() || new Date(reportData.createdAt);

        // Get selection status for this student
        const selectionStatus = selectionsMap.get(reportData.studentId) || null;

        return {
          id: doc.id,
          ...reportData,
          reportType: 'evaluation',
          generatedAt: generatedAt.toISOString(),
          student: studentData,
          college: collegeData,
          selectionStatus, // Add selection status
        };
      })
    );

    // Sort by date (most recent first)
    reports.sort((a, b) => 
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );

    return NextResponse.json({
      reports,
      total: reports.length,
      drive: {
        id: driveDoc.id,
        name: driveData?.name,
        role: driveData?.role,
        status: driveData?.status,
      },
    });
  } catch (error) {
    console.error('Error fetching interview drive reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

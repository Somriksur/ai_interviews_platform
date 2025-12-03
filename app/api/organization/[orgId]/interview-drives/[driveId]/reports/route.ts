import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';

/**
 * GET /api/organization/[orgId]/interview-drives/[driveId]/reports
 * Get all reports for a specific interview drive
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string; driveId: string }> }
) {
  try {
    const { orgId, driveId } = await params;

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

    // Get evaluation reports for this drive
    const evalReportsSnapshot = await db
      .collection('evaluation_reports')
      .where('driveId', '==', driveId)
      .orderBy('createdAt', 'desc')
      .get();

    // Get placement reports for this drive
    const placementReportsSnapshot = await db
      .collection('placement_reports')
      .where('driveId', '==', driveId)
      .orderBy('generatedAt', 'desc')
      .get();

    // Combine both types of reports
    const allDocs = [...evalReportsSnapshot.docs, ...placementReportsSnapshot.docs];

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
      allDocs.map(async (doc) => {
        const reportData = doc.data();
        const isEvalReport = doc.ref.parent.id === 'evaluation_reports';

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
        const collegeId = isEvalReport 
          ? reportData.sentTo?.collegeId 
          : reportData.collegeId;
        
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

        const generatedAt = isEvalReport
          ? (reportData.createdAt?.toDate?.() || new Date(reportData.createdAt))
          : (reportData.generatedAt?.toDate?.() || new Date(reportData.generatedAt));

        // Get selection status for this student
        const selectionStatus = selectionsMap.get(reportData.studentId) || null;

        return {
          id: doc.id,
          ...reportData,
          reportType: isEvalReport ? 'evaluation' : 'placement',
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

import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const searchParams = request.nextUrl.searchParams;
    
    // Get filter parameters
    const studentId = searchParams.get('studentId');
    const driveId = searchParams.get('driveId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query - check both evaluation_reports and placement_reports
    // First, get evaluation reports
    let evalQuery = db
      .collection('evaluation_reports')
      .where('sentTo.organizationId', '==', orgId);
    
    // Also get placement reports
    let placementQuery = db
      .collection('placement_reports')
      .where('organizationId', '==', orgId);

    // Apply filters to both queries
    if (studentId) {
      evalQuery = evalQuery.where('studentId', '==', studentId);
      placementQuery = placementQuery.where('studentId', '==', studentId);
    }
    if (driveId) {
      evalQuery = evalQuery.where('driveId', '==', driveId);
      placementQuery = placementQuery.where('driveId', '==', driveId);
    }

    // Execute both queries
    const [evalSnapshot, placementSnapshot] = await Promise.all([
      evalQuery.orderBy('createdAt', 'desc').get(),
      placementQuery.orderBy('generatedAt', 'desc').get()
    ]);

    // Combine both types of reports
    const allDocs = [...evalSnapshot.docs, ...placementSnapshot.docs];

    // Get reports with additional data
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
            studentData = {
              id: studentDoc.id,
              name: studentDoc.data()?.name,
              email: studentDoc.data()?.email,
              rollNumber: studentDoc.data()?.rollNumber,
              branch: studentDoc.data()?.branch,
              cgpa: studentDoc.data()?.cgpa,
            };
          }
        }

        // Get college details
        let collegeData = null;
        if (reportData.collegeId) {
          const collegeDoc = await db
            .collection('colleges')
            .doc(reportData.collegeId)
            .get();
          if (collegeDoc.exists) {
            collegeData = {
              id: collegeDoc.id,
              name: collegeDoc.data()?.name,
              location: collegeDoc.data()?.location,
            };
          }
        }

        // Get interview drive details
        let driveData = null;
        if (reportData.driveId) {
          const driveDoc = await db
            .collection('interview_drives')
            .doc(reportData.driveId)
            .get();
          if (driveDoc.exists) {
            driveData = {
              id: driveDoc.id,
              name: driveDoc.data()?.name,
              role: driveDoc.data()?.role,
            };
          }
        }

        // Filter by date if provided
        const generatedAt = isEvalReport 
          ? (reportData.createdAt?.toDate?.() || new Date(reportData.createdAt))
          : (reportData.generatedAt?.toDate?.() || new Date(reportData.generatedAt));
        
        if (startDate && generatedAt < new Date(startDate)) {
          return null;
        }
        if (endDate && generatedAt > new Date(endDate)) {
          return null;
        }

        return {
          id: doc.id,
          ...reportData,
          generatedAt: generatedAt.toISOString(),
          reportType: isEvalReport ? 'evaluation' : 'placement',
          student: studentData,
          college: collegeData,
          drive: driveData,
        };
      })
    );

    // Filter out null values (from date filtering)
    const filteredReports = reports.filter(report => report !== null);

    return NextResponse.json({ 
      reports: filteredReports,
      total: filteredReports.length,
    });
  } catch (error) {
    console.error('Error fetching organization reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

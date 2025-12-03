import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportIds, format } = body;

    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return NextResponse.json(
        { error: 'Report IDs are required' },
        { status: 400 }
      );
    }

    if (!format || !['pdf', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be "pdf" or "csv"' },
        { status: 400 }
      );
    }

    // Fetch all reports
    const reports = await Promise.all(
      reportIds.map(async (reportId) => {
        const reportDoc = await db.collection('placement_reports').doc(reportId).get();
        if (reportDoc.exists) {
          const reportData = reportDoc.data();
          
          // Get student details
          let studentData = null;
          if (reportData?.studentId) {
            const studentDoc = await db.collection('students').doc(reportData.studentId).get();
            if (studentDoc.exists) {
              studentData = studentDoc.data();
            }
          }

          return {
            id: reportDoc.id,
            ...reportData,
            student: studentData,
          };
        }
        return null;
      })
    );

    const validReports = reports.filter(report => report !== null);

    if (format === 'csv') {
      // Generate CSV
      const csvData = generateCSV(validReports);
      
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="reports_${Date.now()}.csv"`,
        },
      });
    } else if (format === 'pdf') {
      // For PDF, return data that frontend can use to generate PDF
      // (PDF generation is typically done client-side with libraries like jsPDF)
      return NextResponse.json({
        success: true,
        reports: validReports,
        message: 'PDF data prepared. Generate PDF on client side.',
      });
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
  } catch (error) {
    console.error('Error exporting reports:', error);
    return NextResponse.json(
      { error: 'Failed to export reports' },
      { status: 500 }
    );
  }
}

function generateCSV(reports: any[]): string {
  if (reports.length === 0) {
    return 'No reports to export';
  }

  // CSV headers
  const headers = [
    'Report ID',
    'Student Name',
    'Student Email',
    'Roll Number',
    'Branch',
    'CGPA',
    'Technical Score',
    'Communication Rating',
    'Overall Score',
    'Salary Band',
    'Placement Category',
    'Strengths',
    'Weaknesses',
    'Generated At',
  ];

  // CSV rows
  const rows = reports.map(report => [
    report.id || '',
    report.student?.name || '',
    report.student?.email || '',
    report.student?.rollNumber || '',
    report.student?.branch || '',
    report.student?.cgpa || '',
    report.technicalScore || '',
    report.communicationRating || '',
    report.overallScore || '',
    report.salaryBand || '',
    report.placementCategory || '',
    (report.strengths || []).join('; '),
    (report.weaknesses || []).join('; '),
    report.generatedAt?.toDate?.()?.toISOString() || report.generatedAt || '',
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}

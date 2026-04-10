import { NextRequest, NextResponse } from 'next/server';
import { z } from "zod";
import { db as db } from '@/firebase/admin';
import { getAuthContext } from "@/lib/security/auth-context";
import { requireRole, requireStudentAccess } from "@/lib/security/guards";
import { withCanonicalScores } from "@/lib/utils/evaluation-report";

const exportReportsSchema = z
  .object({
    reportIds: z.array(z.string().min(1)).min(1),
    format: z.enum(["pdf", "csv"]),
  })
  .strict();

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const roleError = requireRole(authResult.context, ["student", "college", "organization"]);
    if (roleError) return roleError;

    const rawBody = await request.json();
    const parseResult = exportReportsSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const { reportIds, format } = parseResult.data;

    const reports = await Promise.all(
      reportIds.map(async (reportId) => {
        const reportDoc = await db.collection('evaluation_reports').doc(reportId).get();
        if (reportDoc.exists) {
          const reportData = withCanonicalScores(reportDoc.data());

          const accessError = await requireStudentAccess(authResult.context, reportData?.studentId);
          if (accessError) {
            throw Object.assign(new Error("FORBIDDEN_REPORT_ACCESS"), { status: 403 });
          }
          
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
    if (error instanceof Error && error.message === "FORBIDDEN_REPORT_ACCESS") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
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
    report.communicationScore || '',
    report.overallScore || '',
    report.salaryBand || '',
    report.placementCategory || report.recommendation || '',
    (report.strengths || []).join('; '),
    (report.weaknesses || report.improvements || []).join('; '),
    report.generatedAt?.toDate?.()?.toISOString() || report.generatedAt || '',
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}

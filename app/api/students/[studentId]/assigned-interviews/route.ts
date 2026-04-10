import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { normalizeCollegeName } from '@/lib/services/college-name.service';
import { getAuthContext } from '@/lib/security/auth-context';
import { requireStudentAccess } from '@/lib/security/guards';

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

    const studentDoc = await db.collection('students').doc(studentId).get();

    if (!studentDoc.exists) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const studentData = studentDoc.data();
    const normalizedCollegeName = studentData?.normalizedCollegeName ||
      (studentData?.collegeName ? normalizeCollegeName(studentData.collegeName) : null);

    if (!normalizedCollegeName) {
      return NextResponse.json(
        { error: 'Student does not have a valid college association' },
        { status: 400 }
      );
    }

    const drivesSnapshot = await db
      .collection('interview_drives')
      .where('taggedColleges', 'array-contains', normalizedCollegeName)
      .get();

    const assignedInterviews = [];

    for (const driveDoc of drivesSnapshot.docs) {
      const driveData = driveDoc.data();
      const taggedStudents = driveData.taggedStudents || [];

      const isStudentTagged = taggedStudents.some(
        (ts: any) => ts.studentId === studentId
      );

      if (isStudentTagged) {
        const studentTag = taggedStudents.find(
          (ts: any) => ts.studentId === studentId
        );

        assignedInterviews.push({
          id: driveDoc.id,
          name: driveData.name,
          description: driveData.description,
          role: driveData.role,
          organizationId: driveData.organizationId,
          organizationName: driveData.organizationName,
          jobPostingId: driveData.jobPostingId,
          status: driveData.status,
          taggedAt: studentTag?.taggedAt,
          taggedBy: studentTag?.taggedBy,
          createdAt: driveData.createdAt,
          completedAt: driveData.completedAt,
        });
      }
    }

    assignedInterviews.sort((a, b) => {
      const dateA = a.taggedAt?.toDate?.() || new Date(0);
      const dateB = b.taggedAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({
      interviews: assignedInterviews,
      collegeName: studentData?.collegeName,
      normalizedCollegeName,
      totalCount: assignedInterviews.length,
    });
  } catch (error: any) {
    console.error('Error fetching assigned interviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assigned interviews', details: error.message },
      { status: 500 }
    );
  }
}

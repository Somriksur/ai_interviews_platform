import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';

/**
 * GET /api/organization/[orgId]/interview-drives/[driveId]/students
 * Get all students who participated in or are assigned to this interview drive
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

    // Get all interview sessions for this drive
    const sessionsSnapshot = await db
      .collection('interview_sessions')
      .where('driveId', '==', driveId)
      .get();

    // Get unique student IDs
    const studentIds = new Set<string>();
    const sessionsByStudent = new Map<string, any>();

    sessionsSnapshot.docs.forEach((doc) => {
      const sessionData = doc.data();
      if (sessionData.studentId) {
        studentIds.add(sessionData.studentId);
        
        // Keep track of the most recent session for each student
        if (!sessionsByStudent.has(sessionData.studentId) ||
            sessionData.createdAt > sessionsByStudent.get(sessionData.studentId).createdAt) {
          sessionsByStudent.set(sessionData.studentId, {
            id: doc.id,
            ...sessionData,
          });
        }
      }
    });

    // Get student details
    const students = await Promise.all(
      Array.from(studentIds).map(async (studentId) => {
        const studentDoc = await db
          .collection('students')
          .doc(studentId)
          .get();

        if (!studentDoc.exists) {
          return null;
        }

        const studentData = studentDoc.data();
        const session = sessionsByStudent.get(studentId);

        // Get college details
        let collegeName = 'Unknown College';
        if (studentData?.collegeId) {
          const collegeDoc = await db
            .collection('colleges')
            .doc(studentData.collegeId)
            .get();
          
          if (collegeDoc.exists) {
            collegeName = collegeDoc.data()?.name || 'Unknown College';
          }
        }

        // Get score from evaluation report if exists
        let score = null;
        if (session?.evaluationId) {
          const reportDoc = await db
            .collection('evaluation_reports')
            .doc(session.evaluationId)
            .get();
          
          if (reportDoc.exists) {
            const reportData = reportDoc.data();
            score = reportData?.scores?.overall || null;
          }
        }

        return {
          id: studentDoc.id,
          name: studentData?.name,
          email: studentData?.email,
          rollNumber: studentData?.rollNumber,
          branch: studentData?.branch,
          year: studentData?.year,
          cgpa: studentData?.cgpa,
          collegeId: studentData?.collegeId,
          collegeName,
          session: {
            id: session?.id,
            status: session?.status || 'assigned',
            score,
            completedAt: session?.completedAt,
            createdAt: session?.createdAt,
          },
        };
      })
    );

    // Filter out null values
    const validStudents = students.filter(s => s !== null);

    // Sort by completion status and then by name
    validStudents.sort((a, b) => {
      // Completed first, then in-progress, then pending
      const statusOrder = { completed: 0, 'in-progress': 1, assigned: 2, pending: 3 };
      const aOrder = statusOrder[a.session.status as keyof typeof statusOrder] || 4;
      const bOrder = statusOrder[b.session.status as keyof typeof statusOrder] || 4;
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      
      return (a.name || '').localeCompare(b.name || '');
    });

    return NextResponse.json({
      students: validStudents,
      total: validStudents.length,
      drive: {
        id: driveDoc.id,
        name: driveData?.name,
        role: driveData?.role,
        status: driveData?.status,
      },
    });
  } catch (error) {
    console.error('Error fetching interview drive students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

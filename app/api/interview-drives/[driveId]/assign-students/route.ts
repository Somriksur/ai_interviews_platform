import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ driveId: string }> }
) {
  try {
    const { driveId } = await params;
    const { collegeId, studentIds } = await request.json();

    // Validate input
    if (!collegeId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: collegeId and studentIds array' },
        { status: 400 }
      );
    }

    // Verify interview drive exists
    const driveDoc = await db.collection('interview_drives').doc(driveId).get();
    if (!driveDoc.exists) {
      return NextResponse.json(
        { error: 'Interview drive not found' },
        { status: 404 }
      );
    }

    const driveData = driveDoc.data();

    // Create interview sessions for each student
    const batch = db.batch();
    const sessionIds: string[] = [];

    for (const studentId of studentIds) {
      // Check if student already has a session for this drive
      const existingSession = await db
        .collection('interview_sessions')
        .where('driveId', '==', driveId)
        .where('studentId', '==', studentId)
        .limit(1)
        .get();

      if (!existingSession.empty) {
        console.log(`Student ${studentId} already assigned to drive ${driveId}`);
        continue; // Skip if already assigned
      }

      // Create new interview session
      const sessionRef = db.collection('interview_sessions').doc();
      batch.set(sessionRef, {
        driveId,
        studentId,
        collegeId,
        organizationId: driveData?.organizationId,
        status: 'pending',
        createdAt: new Date(),
        startedAt: null,
        completedAt: null,
        questions: driveData?.questions || [],
        responses: [],
        scores: {
          technical: 0,
          communication: 0,
          behavioral: 0,
          overall: 0,
        },
      });
      sessionIds.push(sessionRef.id);
    }

    // Commit all session creations
    await batch.commit();

    // Update drive statistics
    const currentStats = driveData?.stats || {
      totalStudents: 0,
      completedInterviews: 0,
      averageScore: 0,
    };

    await db.collection('interview_drives').doc(driveId).update({
      stats: {
        ...currentStats,
        totalStudents: currentStats.totalStudents + sessionIds.length,
      },
    });

    console.log(`✅ Assigned ${sessionIds.length} students to drive ${driveId}`);

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${sessionIds.length} student(s)`,
      sessionIds,
    });
  } catch (error) {
    console.error('Error assigning students to drive:', error);
    return NextResponse.json(
      { error: 'Failed to assign students' },
      { status: 500 }
    );
  }
}

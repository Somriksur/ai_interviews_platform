import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { z } from "zod";
import { getAuthContext } from "@/lib/security/auth-context";
import { requireCollegeOwnership } from "@/lib/security/guards";

const assignStudentsSchema = z
  .object({
    collegeId: z.string().min(1),
    studentIds: z.array(z.string().min(1)).min(1).max(1000),
  })
  .strict();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ driveId: string }> }
) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const { driveId } = await params;
    const rawBody = await request.json();
    const parseResult = assignStudentsSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const { collegeId, studentIds } = parseResult.data;

    const accessError = await requireCollegeOwnership(authResult.context, collegeId);
    if (accessError) return accessError;

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
    if (!Array.isArray(driveData?.colleges) || !driveData.colleges.includes(collegeId)) {
      return NextResponse.json(
        { error: 'Forbidden: drive is not assigned to this college' },
        { status: 403 }
      );
    }

    // Create interview sessions for each student
    const batch = db.batch();
    const sessionIds: string[] = [];

    for (const studentId of studentIds) {
      const studentDoc = await db.collection('students').doc(studentId).get();
      if (!studentDoc.exists || studentDoc.data()?.collegeId !== collegeId) {
        continue;
      }

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

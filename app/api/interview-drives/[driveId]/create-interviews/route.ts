import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db as db } from '@/firebase/admin';
import { getAuthContext } from '@/lib/security/auth-context';
import { requireOrganizationOwnership, requireRole } from '@/lib/security/guards';

const createInterviewsSchema = z
  .object({
    questions: z.array(z.unknown()).optional(),
    techstack: z.array(z.string()).optional(),
    level: z.string().max(80).optional(),
    type: z.string().max(80).optional(),
  })
  .strict();

export async function POST(request: NextRequest, { params }: { params: Promise<{ driveId: string }> }) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const roleError = requireRole(authResult.context, ['organization']);
    if (roleError) return roleError;

    const { driveId } = await params;
    const rawBody = await request.json();
    const parseResult = createInterviewsSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const { questions, techstack, level, type } = parseResult.data;

    // Get drive details
    const driveDoc = await db.collection('interview_drives').doc(driveId).get();
    
    if (!driveDoc.exists) {
      return NextResponse.json(
        { error: 'Interview drive not found' },
        { status: 404 }
      );
    }

    const driveData = driveDoc.data();
    const ownershipError = await requireOrganizationOwnership(
      authResult.context,
      driveData?.organizationId
    );
    if (ownershipError) return ownershipError;
    const taggedStudents = driveData?.taggedStudents || [];
    const studentIds: string[] = taggedStudents
      .map((s: any) => (typeof s === 'string' ? s : s?.studentId))
      .filter(Boolean);

    if (studentIds.length === 0) {
      return NextResponse.json(
        { error: 'No students tagged for this drive' },
        { status: 400 }
      );
    }

    // Create interview sessions for all tagged students
    const batch = db.batch();
    const sessionIds: string[] = [];

    for (const studentId of studentIds) {
      // Get student details
      const studentDoc = await db.collection('students').doc(studentId).get();
      const studentData = studentDoc.data();

      if (studentData) {
        const existingSession = await db
          .collection('interview_sessions')
          .where('driveId', '==', driveId)
          .where('studentId', '==', studentId)
          .limit(1)
          .get();

        if (!existingSession.empty) {
          continue;
        }

        const sessionRef = db.collection('interview_sessions').doc();
        batch.set(sessionRef, {
          driveId,
          studentId,
          collegeId: studentData.collegeId || null,
          organizationId: driveData?.organizationId || null,
          role: driveData?.role || '',
          level: level || 'mid-level',
          type: type || 'technical',
          techstack: techstack || [],
          questions: questions || driveData?.questions || [],
          status: 'pending',
          transcript: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          startedAt: null,
          completedAt: null,
          duration: null,
          evaluationId: null,
          evaluationTriggered: false,
        });

        sessionIds.push(sessionRef.id);
      }
    }

    await batch.commit();

    // Update drive status
    await db.collection('interview_drives').doc(driveId).update({
      status: 'in-progress',
    });

    return NextResponse.json({
      success: true,
      sessionsCreated: sessionIds.length,
      sessionIds,
    });
  } catch (error) {
    console.error('Error creating bulk interviews:', error);
    return NextResponse.json(
      { error: 'Failed to create interviews' },
      { status: 500 }
    );
  }
}

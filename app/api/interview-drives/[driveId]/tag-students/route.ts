import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { z } from "zod";
import { getAuthContext } from "@/lib/security/auth-context";
import { requireRole } from "@/lib/security/guards";

const tagStudentsSchema = z
  .object({
    studentIds: z.array(z.string().min(1)).max(5000),
  })
  .strict();

export async function POST(request: NextRequest, { params }: { params: Promise<{ driveId: string }> }) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;
    const roleError = requireRole(authResult.context, ["organization"]);
    if (roleError) return roleError;

    const { driveId } = await params;
    const rawBody = await request.json();
    const parseResult = tagStudentsSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const { studentIds } = parseResult.data;

    if (!studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json(
        { error: 'Invalid student IDs' },
        { status: 400 }
      );
    }

    const driveDoc = await db.collection('interview_drives').doc(driveId).get();
    if (!driveDoc.exists) {
      return NextResponse.json({ error: 'Interview drive not found' }, { status: 404 });
    }

    const orgSnapshot = await db
      .collection('organizations')
      .where('adminId', '==', authResult.context.user.id)
      .limit(1)
      .get();

    if (orgSnapshot.empty || driveDoc.data()?.organizationId !== orgSnapshot.docs[0].id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.collection('interview_drives').doc(driveId).update({
      taggedStudents: studentIds,
      'stats.totalStudents': studentIds.length,
    });

    return NextResponse.json({
      success: true,
      taggedCount: studentIds.length,
    });
  } catch (error) {
    console.error('Error tagging students:', error);
    return NextResponse.json(
      { error: 'Failed to tag students' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { z } from "zod";
import { getAuthContext } from "@/lib/security/auth-context";
import { requireStudentAccess } from "@/lib/security/guards";

const studentUpdateSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    email: z.string().email().optional(),
    rollNumber: z.string().min(1).max(64).optional(),
    branch: z.string().max(120).optional(),
    year: z.number().int().min(1).max(8).optional(),
    cgpa: z.number().min(0).max(10).optional(),
    skills: z.array(z.string().min(1).max(64)).max(100).optional(),
    phone: z.string().max(32).optional(),
  })
  .strict();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const authResult = await getAuthContext(_request);
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

    return NextResponse.json({
      id: studentDoc.id,
      ...studentDoc.data(),
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const { studentId } = await params;
    const accessError = await requireStudentAccess(authResult.context, studentId);
    if (accessError) return accessError;
    const rawBody = await request.json();
    const parseResult = studentUpdateSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const updates = parseResult.data;

    await db.collection('students').doc(studentId).update({
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.email !== undefined ? { email: updates.email.toLowerCase() } : {}),
      ...(updates.rollNumber !== undefined ? { rollNumber: updates.rollNumber } : {}),
      ...(updates.branch !== undefined ? { branch: updates.branch } : {}),
      ...(updates.year !== undefined ? { year: updates.year } : {}),
      ...(updates.cgpa !== undefined ? { cgpa: updates.cgpa } : {}),
      ...(updates.skills !== undefined ? { skills: updates.skills } : {}),
      ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const authResult = await getAuthContext(_request);
    if (!authResult.ok) return authResult.response;

    const { studentId } = await params;
    const accessError = await requireStudentAccess(authResult.context, studentId);
    if (accessError) return accessError;
    
    // Get student data before deleting
    const studentDoc = await db.collection('students').doc(studentId).get();
    if (!studentDoc.exists) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const studentData = studentDoc.data();
    const collegeId = studentData?.collegeId;

    // Delete student
    await db.collection('students').doc(studentId).delete();

    // Update college stats
    if (collegeId) {
      const collegeDoc = await db.collection('colleges').doc(collegeId).get();
      if (collegeDoc.exists) {
        const currentStats = collegeDoc.data()?.stats || {};
        await db.collection('colleges').doc(collegeId).update({
          'stats.totalStudents': Math.max((currentStats.totalStudents || 1) - 1, 0),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    );
  }
}

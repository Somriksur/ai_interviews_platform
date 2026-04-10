import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { z } from "zod";
import { getAuthContext } from "@/lib/security/auth-context";
import { requireCollegeOwnership } from "@/lib/security/guards";

const createStudentSchema = z
  .object({
    name: z.string().min(1).max(120),
    email: z.string().email(),
    rollNumber: z.string().min(1).max(64),
    branch: z.string().max(120).optional(),
    year: z.number().int().min(1).max(8).optional(),
    cgpa: z.number().min(0).max(10).optional(),
    skills: z.array(z.string().min(1).max(64)).max(100).optional(),
  })
  .strict();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ collegeId: string }> }
) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const { collegeId } = await params;
    const accessError = await requireCollegeOwnership(authResult.context, collegeId);
    if (accessError) return accessError;
    const rawBody = await request.json();
    const parseResult = createStudentSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const { name, email, rollNumber, branch, year, cgpa, skills } = parseResult.data;

    if (!name || !email || !rollNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get organizationId from college
    const collegeDoc = await db.collection('colleges').doc(collegeId).get();
    const organizationId = collegeDoc.data()?.organizationId || '';

    const studentRef = await db.collection('students').add({
      collegeId,
      organizationId,
      name,
      email,
      rollNumber,
      branch: branch || '',
      year: year || 1,
      cgpa: cgpa || 0,
      skills: skills || [],
      createdAt: new Date(),
    });

    // Update college stats
    if (collegeDoc.exists) {
      const currentStats = collegeDoc.data()?.stats || {};
      await db.collection('colleges').doc(collegeId).update({
        'stats.totalStudents': (currentStats.totalStudents || 0) + 1,
      });
    }

    return NextResponse.json({
      success: true,
      studentId: studentRef.id,
    });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ collegeId: string }> }
) {
  try {
    const authResult = await getAuthContext(_request);
    if (!authResult.ok) return authResult.response;

    const { collegeId } = await params;
    const accessError = await requireCollegeOwnership(authResult.context, collegeId);
    if (accessError) return accessError;

    const snapshot = await db
      .collection('students')
      .where('collegeId', '==', collegeId)
      .orderBy('createdAt', 'desc')
      .get();

    const students = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db as db, auth as adminAuth } from '@/firebase/admin';
import { z } from "zod";
import { getAuthContext } from "@/lib/security/auth-context";
import { requireCollegeOwnership } from "@/lib/security/guards";

const uploadStudentRecordSchema = z
  .object({
    name: z.string().min(1).max(120),
    email: z.string().email(),
    rollNumber: z.string().min(1).max(64),
    branch: z.string().max(120).optional(),
    cgpa: z.union([z.number().min(0).max(10), z.string()]).optional(),
    phone: z.string().max(32).optional(),
  })
  .strict();

const uploadStudentsSchema = z
  .object({
    students: z.array(uploadStudentRecordSchema).min(1).max(5000),
    jobPostingId: z.string().min(1),
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
    const parseResult = uploadStudentsSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const { students, jobPostingId } = parseResult.data;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { error: 'Student data is required' },
        { status: 400 }
      );
    }

    if (!jobPostingId) {
      return NextResponse.json(
        { error: 'Job posting ID is required' },
        { status: 400 }
      );
    }

    const results = {
      created: [] as any[],
      failed: [] as any[],
    };

    // Process each student
    for (const studentData of students) {
      try {
        // Validate required fields
        if (!studentData.name || !studentData.email || !studentData.rollNumber) {
          results.failed.push({
            record: studentData,
            error: 'Missing required fields (name, email, rollNumber)',
          });
          continue;
        }

        // Generate password
        const password = `${studentData.rollNumber}@${Math.random().toString(36).substr(2, 6)}`;

        // Create Firebase auth user
        let userRecord;
        try {
          userRecord = await adminAuth.createUser({
            email: studentData.email,
            password,
            displayName: studentData.name,
          });
        } catch (authError: any) {
          if (authError.code === 'auth/email-already-exists') {
            // Get existing user
            userRecord = await adminAuth.getUserByEmail(studentData.email);
          } else {
            throw authError;
          }
        }

        // Create student document
        const studentDoc = await db.collection('students').add({
          name: studentData.name,
          email: studentData.email,
          rollNumber: studentData.rollNumber,
          branch: studentData.branch || '',
          cgpa: parseFloat(studentData.cgpa) || 0,
          phone: studentData.phone || '',
          collegeId,
          userId: userRecord.uid,
          assignedInterviews: [jobPostingId],
          completedInterviews: [],
          createdAt: new Date(),
        });

        // Create user document
        await db.collection('users').doc(userRecord.uid).set({
          name: studentData.name,
          email: studentData.email,
          role: 'student',
          collegeId,
          createdAt: new Date(),
        });

        results.created.push({
          id: studentDoc.id,
          name: studentData.name,
          email: studentData.email,
          password, // Include password for credential distribution
        });
      } catch (error: any) {
        results.failed.push({
          record: studentData,
          error: error.message || 'Failed to create student account',
        });
      }
    }

    return NextResponse.json({
      success: true,
      created: results.created.length,
      failed: results.failed.length,
      results,
    });
  } catch (error) {
    console.error('Error uploading students:', error);
    return NextResponse.json(
      { error: 'Failed to upload students' },
      { status: 500 }
    );
  }
}

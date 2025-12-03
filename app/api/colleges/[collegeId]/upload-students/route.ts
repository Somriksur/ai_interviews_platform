import { NextRequest, NextResponse } from 'next/server';
import { db as db, auth as adminAuth } from '@/firebase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ collegeId: string }> }
) {
  try {
    const { collegeId } = await params;
    const body = await request.json();
    
    const { students, jobPostingId } = body;

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

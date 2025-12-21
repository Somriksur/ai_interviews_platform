import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { getCurrentUser } from '@/lib/actions/auth.action';

/**
 * DEBUG endpoint to check student-user mapping
 * GET /api/debug/student-auth
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🔍 DEBUG: Current user - ID: ${user.id}, Role: ${user.role}, Email: ${user.email}`);

    // Find student record by userId
    const studentQuery = await db
      .collection('students')
      .where('userId', '==', user.id)
      .get();

    console.log(`📋 DEBUG: Found ${studentQuery.size} student records for user ${user.id}`);

    const studentRecords = studentQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Also check if there are any students with this user's email
    const emailQuery = await db
      .collection('students')
      .where('email', '==', user.email)
      .get();

    console.log(`📧 DEBUG: Found ${emailQuery.size} student records with email ${user.email}`);

    const emailStudentRecords = emailQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Check if the specific student ID exists
    const specificStudentId = '5glzkrUyTHJJjwWPCcbM';
    const specificStudentDoc = await db
      .collection('students')
      .doc(specificStudentId)
      .get();

    let specificStudentData = null;
    if (specificStudentDoc.exists) {
      specificStudentData = {
        id: specificStudentDoc.id,
        ...specificStudentDoc.data()
      };
      console.log(`👤 DEBUG: Specific student ${specificStudentId} - userId: ${specificStudentData.userId}, email: ${specificStudentData.email}`);
    } else {
      console.log(`❌ DEBUG: Specific student ${specificStudentId} does not exist`);
    }

    return NextResponse.json({
      currentUser: {
        id: user.id,
        role: user.role,
        email: user.email
      },
      studentsByUserId: studentRecords,
      studentsByEmail: emailStudentRecords,
      specificStudent: specificStudentData,
      debug: {
        userIdMatch: studentRecords.some(s => s.userId === user.id),
        emailMatch: emailStudentRecords.some(s => s.email === user.email),
        specificStudentExists: specificStudentDoc.exists,
        specificStudentUserIdMatch: specificStudentData?.userId === user.id
      }
    });

  } catch (error: any) {
    console.error('❌ DEBUG: Error in student auth debug:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error.message },
      { status: 500 }
    );
  }
}
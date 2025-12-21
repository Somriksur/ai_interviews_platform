import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { getCurrentUser } from '@/lib/actions/auth.action';

/**
 * GET /api/students/me
 * Get current user's student record
 */
export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'student') {
      return NextResponse.json({ error: 'Only students can access this endpoint' }, { status: 403 });
    }

    console.log(`🔍 Finding student record for user: ${user.id}`);

    // Find student record by userId
    const studentQuery = await db
      .collection('students')
      .where('userId', '==', user.id)
      .get();

    if (studentQuery.empty) {
      console.log(`❌ No student record found for user ${user.id}`);
      return NextResponse.json({ 
        error: 'Student record not found',
        message: 'No student record is associated with your account'
      }, { status: 404 });
    }

    const studentDoc = studentQuery.docs[0];
    const studentData = studentDoc.data();

    console.log(`✅ Found student record: ${studentDoc.id} for user ${user.id}`);

    return NextResponse.json({
      id: studentDoc.id,
      userId: studentData.userId,
      email: studentData.email,
      name: studentData.name,
      college: studentData.college,
      createdAt: studentData.createdAt?.toDate?.() || studentData.createdAt,
    });

  } catch (error: any) {
    console.error('❌ Error fetching student record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student record', details: error.message },
      { status: 500 }
    );
  }
}
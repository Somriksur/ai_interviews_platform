import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await params;
    const decodedEmail = decodeURIComponent(email);

    console.log('🔍 Looking up student by email:', decodedEmail);

    // Query students collection by email
    const studentsSnapshot = await db
      .collection('students')
      .where('email', '==', decodedEmail)
      .limit(1)
      .get();

    if (studentsSnapshot.empty) {
      console.log('❌ No student found with email:', decodedEmail);
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const studentDoc = studentsSnapshot.docs[0];
    const studentData = {
      id: studentDoc.id,
      ...studentDoc.data(),
    };

    console.log('✅ Found student:', studentData.id);

    return NextResponse.json(studentData);
  } catch (error) {
    console.error('Error fetching student by email:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student' },
      { status: 500 }
    );
  }
}

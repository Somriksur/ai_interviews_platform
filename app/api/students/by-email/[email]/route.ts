import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { getAuthContext } from '@/lib/security/auth-context';
import { requireEmailMatch } from '@/lib/security/guards';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const { email } = await params;
    const decodedEmail = decodeURIComponent(email).toLowerCase();

    const emailError = requireEmailMatch(authResult.context, decodedEmail);
    if (emailError) return emailError;

    const studentsSnapshot = await db
      .collection('students')
      .where('email', '==', decodedEmail)
      .limit(1)
      .get();

    if (studentsSnapshot.empty) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const studentDoc = studentsSnapshot.docs[0];
    return NextResponse.json({
      id: studentDoc.id,
      ...studentDoc.data(),
    });
  } catch (error) {
    console.error('Error fetching student by email:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student' },
      { status: 500 }
    );
  }
}

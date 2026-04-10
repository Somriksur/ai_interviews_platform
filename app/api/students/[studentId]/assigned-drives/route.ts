import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { getAuthContext } from '@/lib/security/auth-context';
import { requireStudentAccess } from '@/lib/security/guards';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const { studentId } = await params;
    const accessError = await requireStudentAccess(authResult.context, studentId);
    if (accessError) return accessError;

    const studentDoc = await db.collection('students').doc(studentId).get();
    if (!studentDoc.exists) {
      return NextResponse.json({ drives: [] });
    }

    const studentData = studentDoc.data();
    const collegeId = studentData?.collegeId;

    if (!collegeId) {
      return NextResponse.json({ drives: [] });
    }

    const drivesSnapshot = await db
      .collection('interview_drives')
      .where('colleges', 'array-contains', collegeId)
      .get();

    const drives = drivesSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

    return NextResponse.json({ drives });
  } catch (error: any) {
    console.error('Error fetching assigned drives:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assigned drives', details: error.message },
      { status: 500 }
    );
  }
}

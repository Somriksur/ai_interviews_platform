import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { getCurrentUser } from '@/lib/actions/auth.action';

/**
 * POST /api/students/[studentId]/fix-user-link
 * Fix missing userId link in student record
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'student') {
      return NextResponse.json({ error: 'Only students can fix their user link' }, { status: 403 });
    }

    const { studentId } = await params;

    console.log(`🔧 Attempting to fix user link for student ${studentId} and user ${user.id}`);

    // Get the student document
    const studentDoc = await db.collection('students').doc(studentId).get();
    
    if (!studentDoc.exists) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const studentData = studentDoc.data();
    console.log(`📋 Current student data - userId: ${studentData?.userId}, email: ${studentData?.email}`);

    // Check if this student record matches the user's email
    if (studentData?.email !== user.email) {
      return NextResponse.json({ 
        error: 'Email mismatch', 
        message: `Student email (${studentData?.email}) doesn't match user email (${user.email})`
      }, { status: 400 });
    }

    // Check if userId is missing or incorrect
    if (studentData?.userId && studentData.userId !== user.id) {
      return NextResponse.json({ 
        error: 'Student already linked to different user', 
        message: `Student is linked to user ${studentData.userId}, not ${user.id}`
      }, { status: 400 });
    }

    // Update the student record with the correct userId
    await studentDoc.ref.update({
      userId: user.id,
      updatedAt: new Date(),
      userLinkFixed: true,
      userLinkFixedAt: new Date()
    });

    console.log(`✅ Fixed user link for student ${studentId} - linked to user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'User link fixed successfully',
      studentId: studentId,
      userId: user.id,
      email: user.email
    });

  } catch (error: any) {
    console.error('❌ Error fixing user link:', error);
    return NextResponse.json(
      { error: 'Failed to fix user link', details: error.message },
      { status: 500 }
    );
  }
}
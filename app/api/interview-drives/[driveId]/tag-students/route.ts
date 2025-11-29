import { NextRequest, NextResponse } from 'next/server';
import { db as adminDb } from '@/firebase/admin';

export async function POST(request: NextRequest, { params }: { params: Promise<{ driveId: string }> }) {
  try {
    const { driveId } = await params;
    const { studentIds } = await request.json();

    if (!studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json(
        { error: 'Invalid student IDs' },
        { status: 400 }
      );
    }

    await adminDb.collection('interview_drives').doc(driveId).update({
      taggedStudents: studentIds,
      'stats.totalStudents': studentIds.length,
    });

    return NextResponse.json({
      success: true,
      taggedCount: studentIds.length,
    });
  } catch (error) {
    console.error('Error tagging students:', error);
    return NextResponse.json(
      { error: 'Failed to tag students' },
      { status: 500 }
    );
  }
}

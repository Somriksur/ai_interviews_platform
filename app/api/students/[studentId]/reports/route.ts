import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    
    // Fetch placement reports for this student
    const snapshot = await db
      .collection('combinedReports')
      .where('studentId', '==', studentId)
      .orderBy('createdAt', 'desc')
      .get();

    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error fetching student reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

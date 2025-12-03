import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';

/**
 * GET /api/students/[studentId]/assigned-drives
 * Get interview drives assigned to a student
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    
    // Get student details
    const studentDoc = await db.collection('students').doc(studentId).get();
    if (!studentDoc.exists) {
      return NextResponse.json({ drives: [] });
    }

    const studentData = studentDoc.data();
    const collegeId = studentData?.collegeId;

    if (!collegeId) {
      return NextResponse.json({ drives: [] });
    }

    // Fetch interview drives that include this student's college
    const drivesSnapshot = await db
      .collection('interview_drives')
      .where('colleges', 'array-contains', collegeId)
      .get();

    // Sort by createdAt in memory (since index might still be building)
    const drives = drivesSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime; // Descending order
      });

    console.log(`✅ Found ${drives.length} drives for college ${collegeId}`);

    return NextResponse.json({ drives });
  } catch (error: any) {
    console.error('❌ Error fetching assigned drives:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Failed to fetch assigned drives', details: error.message },
      { status: 500 }
    );
  }
}

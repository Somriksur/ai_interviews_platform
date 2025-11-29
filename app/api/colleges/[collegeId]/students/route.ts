import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { collegeId: string } }
) {
  try {
    const { name, email, rollNumber, branch, year, cgpa, skills, organizationId } = await request.json();

    if (!name || !email || !rollNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const studentRef = await adminDb.collection('students').add({
      collegeId: params.collegeId,
      organizationId,
      name,
      email,
      rollNumber,
      branch: branch || '',
      year: year || 1,
      cgpa: cgpa || 0,
      skills: skills || [],
      createdAt: new Date(),
    });

    // Update college stats
    const collegeDoc = await adminDb.collection('colleges').doc(params.collegeId).get();
    if (collegeDoc.exists) {
      const currentStats = collegeDoc.data()?.stats || {};
      await adminDb.collection('colleges').doc(params.collegeId).update({
        'stats.totalStudents': (currentStats.totalStudents || 0) + 1,
      });
    }

    return NextResponse.json({
      success: true,
      studentId: studentRef.id,
    });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { collegeId: string } }
) {
  try {
    const snapshot = await adminDb
      .collection('students')
      .where('collegeId', '==', params.collegeId)
      .orderBy('createdAt', 'desc')
      .get();

    const students = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

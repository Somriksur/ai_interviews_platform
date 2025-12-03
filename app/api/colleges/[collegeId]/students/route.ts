import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ collegeId: string }> }
) {
  try {
    const { collegeId } = await params;
    const { name, email, rollNumber, branch, year, cgpa, skills } = await request.json();

    if (!name || !email || !rollNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get organizationId from college
    const collegeDoc = await db.collection('colleges').doc(collegeId).get();
    const organizationId = collegeDoc.data()?.organizationId || '';

    const studentRef = await db.collection('students').add({
      collegeId,
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
    if (collegeDoc.exists) {
      const currentStats = collegeDoc.data()?.stats || {};
      await db.collection('colleges').doc(collegeId).update({
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
  _request: NextRequest,
  { params }: { params: Promise<{ collegeId: string }> }
) {
  try {
    const { collegeId } = await params;
    const snapshot = await db
      .collection('students')
      .where('collegeId', '==', collegeId)
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

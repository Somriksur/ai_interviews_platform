import { NextRequest, NextResponse } from 'next/server';
import { db as adminDb } from '@/firebase/admin';

export async function POST(request: NextRequest, { params }: { params: Promise<{ driveId: string }> }) {
  try {
    const { driveId } = await params;
    const { questions, techstack, level, type } = await request.json();

    // Get drive details
    const driveDoc = await adminDb.collection('interview_drives').doc(driveId).get();
    
    if (!driveDoc.exists) {
      return NextResponse.json(
        { error: 'Interview drive not found' },
        { status: 404 }
      );
    }

    const driveData = driveDoc.data();
    const studentIds = driveData?.taggedStudents || [];

    if (studentIds.length === 0) {
      return NextResponse.json(
        { error: 'No students tagged for this drive' },
        { status: 400 }
      );
    }

    // Create interviews for all tagged students
    const batch = adminDb.batch();
    const interviewIds: string[] = [];

    for (const studentId of studentIds) {
      // Get student details
      const studentDoc = await adminDb.collection('students').doc(studentId).get();
      const studentData = studentDoc.data();

      if (studentData) {
        const interviewRef = adminDb.collection('interviews').doc();
        batch.set(interviewRef, {
          role: driveData?.role || '',
          level: level || 'mid-level',
          type: type || 'technical',
          techstack: techstack || [],
          questions: questions || [],
          candidateEmail: studentData.email,
          recruiterId: driveData?.organizationId || '',
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          startedAt: null,
          answers: null,
          feedback: null,
          score: null,
          completedAt: null,
          // Campus recruitment specific fields
          driveId: driveId,
          studentId: studentId,
          collegeId: studentData.collegeId,
          organizationId: studentData.organizationId,
        });
        
        interviewIds.push(interviewRef.id);
      }
    }

    await batch.commit();

    // Update drive status
    await adminDb.collection('interview_drives').doc(driveId).update({
      status: 'in-progress',
    });

    return NextResponse.json({
      success: true,
      interviewsCreated: interviewIds.length,
      interviewIds,
    });
  } catch (error) {
    console.error('Error creating bulk interviews:', error);
    return NextResponse.json(
      { error: 'Failed to create interviews' },
      { status: 500 }
    );
  }
}

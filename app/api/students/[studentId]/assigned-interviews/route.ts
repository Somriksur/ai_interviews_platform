import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { normalizeCollegeName } from '@/lib/services/college-name.service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;

    console.log(`📋 Fetching assigned interviews for student ${studentId}`);

    // Get student document
    const studentDoc = await db.collection('students').doc(studentId).get();
    
    if (!studentDoc.exists) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const studentData = studentDoc.data();
    
    // Get student's normalized college name
    const normalizedCollegeName = studentData?.normalizedCollegeName || 
      (studentData?.collegeName ? normalizeCollegeName(studentData.collegeName) : null);

    if (!normalizedCollegeName) {
      return NextResponse.json(
        { error: 'Student does not have a valid college association' },
        { status: 400 }
      );
    }

    console.log(`🏫 Student belongs to college: ${normalizedCollegeName}`);

    // Query interview drives where the student's college is tagged
    const drivesSnapshot = await db
      .collection('interview_drives')
      .where('taggedColleges', 'array-contains', normalizedCollegeName)
      .get();

    console.log(`📊 Found ${drivesSnapshot.size} interview drives for this college`);

    // Filter drives where this specific student is tagged
    const assignedInterviews = [];
    
    for (const driveDoc of drivesSnapshot.docs) {
      const driveData = driveDoc.data();
      const taggedStudents = driveData.taggedStudents || [];
      
      // Check if this student is tagged in this drive
      const isStudentTagged = taggedStudents.some(
        (ts: any) => ts.studentId === studentId
      );

      if (isStudentTagged) {
        // Find the student's tag info
        const studentTag = taggedStudents.find(
          (ts: any) => ts.studentId === studentId
        );

        assignedInterviews.push({
          id: driveDoc.id,
          name: driveData.name,
          description: driveData.description,
          role: driveData.role,
          organizationId: driveData.organizationId,
          organizationName: driveData.organizationName,
          jobPostingId: driveData.jobPostingId,
          status: driveData.status,
          taggedAt: studentTag?.taggedAt,
          taggedBy: studentTag?.taggedBy,
          createdAt: driveData.createdAt,
          completedAt: driveData.completedAt,
        });
      }
    }

    console.log(`✅ Student is assigned to ${assignedInterviews.length} interviews`);

    // Sort by tagged date (most recent first)
    assignedInterviews.sort((a, b) => {
      const dateA = a.taggedAt?.toDate?.() || new Date(0);
      const dateB = b.taggedAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({ 
      interviews: assignedInterviews,
      collegeName: studentData?.collegeName,
      normalizedCollegeName,
      totalCount: assignedInterviews.length,
    });
  } catch (error: any) {
    console.error('❌ Error fetching assigned interviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assigned interviews', details: error.message },
      { status: 500 }
    );
  }
}

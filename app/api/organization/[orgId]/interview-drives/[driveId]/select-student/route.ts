import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';

/**
 * POST /api/organization/[orgId]/interview-drives/[driveId]/select-student
 * Select or reject a student and notify the college
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; driveId: string }> }
) {
  try {
    const { orgId, driveId } = await params;
    const body = await request.json();
    const { studentId, collegeId: providedCollegeId, action, score } = body;

    if (!studentId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: studentId and action are required' },
        { status: 400 }
      );
    }

    console.log('📝 Selection request:', { studentId, providedCollegeId, action, driveId });

    if (action !== 'selected' && action !== 'rejected') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "selected" or "rejected"' },
        { status: 400 }
      );
    }

    // Verify the drive belongs to this organization
    const driveDoc = await db
      .collection('interview_drives')
      .doc(driveId)
      .get();

    if (!driveDoc.exists) {
      return NextResponse.json(
        { error: 'Interview drive not found' },
        { status: 404 }
      );
    }

    const driveData = driveDoc.data();
    if (driveData?.organizationId !== orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get student details
    const studentDoc = await db
      .collection('students')
      .doc(studentId)
      .get();

    if (!studentDoc.exists) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const studentData = studentDoc.data();

    // Get collegeId - use provided one or fall back to student's collegeId
    const collegeId = providedCollegeId || studentData?.collegeId;
    
    if (!collegeId) {
      console.error('❌ No collegeId found for student:', studentId);
      return NextResponse.json(
        { error: 'College ID not found for this student' },
        { status: 400 }
      );
    }

    console.log('✅ Using collegeId:', collegeId);

    // Get organization details
    const orgDoc = await db
      .collection('organizations')
      .doc(orgId)
      .get();

    const orgData = orgDoc.exists ? orgDoc.data() : null;

    // Update student status in the students collection
    const studentStatus = action === 'selected' ? 'selected' : 'rejected';
    await db
      .collection('students')
      .doc(studentId)
      .update({
        [`driveStatus.${driveId}`]: studentStatus,
        updatedAt: new Date(),
      });

    // Create a selection record
    const selectionData = {
      studentId,
      collegeId,
      driveId,
      organizationId: orgId,
      action, // 'selected' or 'rejected'
      status: studentStatus,
      score: score || null,
      createdAt: new Date(),
      notified: false,
      collegeResponse: null, // Will be updated when college responds
      collegeRespondedAt: null,
    };

    const selectionRef = await db
      .collection('drive_student_selections')
      .add(selectionData);

    // Create notification for the college
    const notificationData = {
      type: 'drive_student_selection',
      collegeId,
      organizationId: orgId,
      driveId,
      studentId,
      selectionId: selectionRef.id,
      action,
      status: 'pending', // College needs to acknowledge
      message:
        action === 'selected'
          ? `${orgData?.name || 'Organization'} has selected ${studentData?.name || 'a student'} from interview drive "${driveData?.name || 'Interview Drive'}"`
          : `${orgData?.name || 'Organization'} has rejected ${studentData?.name || 'a student'} from interview drive "${driveData?.name || 'Interview Drive'}"`,
      driveName: driveData?.name || 'Interview Drive',
      studentName: studentData?.name || 'Student',
      organizationName: orgData?.name || 'Organization',
      createdAt: new Date(),
      read: false,
      respondedAt: null,
    };

    await db.collection('college_notifications').add(notificationData);

    // Update the selection record to mark as notified
    await selectionRef.update({ notified: true });

    console.log(
      `✅ Student ${action}: ${studentId} for drive ${driveId}. College ${collegeId} notified.`
    );

    return NextResponse.json({
      success: true,
      selectionId: selectionRef.id,
      action,
      message: `Student ${action} successfully. College has been notified.`,
    });
  } catch (error) {
    console.error('Error selecting/rejecting student:', error);
    return NextResponse.json(
      { error: 'Failed to process selection' },
      { status: 500 }
    );
  }
}

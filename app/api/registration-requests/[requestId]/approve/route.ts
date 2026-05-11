import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { getCurrentUser } from '@/lib/actions/auth.action';
import { notifyStudentOfApproval } from '@/lib/services/notification.service';

/**
 * POST /api/registration-requests/[requestId]/approve
 * Approve a student registration request
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'college') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = await params;

    // Get the registration request
    const requestDoc = await db.collection('registration_requests').doc(requestId).get();

    if (!requestDoc.exists) {
      return NextResponse.json(
        { error: 'Registration request not found' },
        { status: 404 }
      );
    }

    const requestData = requestDoc.data();

    // Verify the request is for the college admin's college
    const collegeSnapshot = await db
      .collection('colleges')
      .where('adminId', '==', user.id)
      .limit(1)
      .get();

    if (collegeSnapshot.empty) {
      return NextResponse.json(
        { error: 'College not found for this admin' },
        { status: 404 }
      );
    }

    const collegeDoc = collegeSnapshot.docs[0];
    const collegeData = collegeDoc.data();

    if (requestData?.collegeId !== collegeDoc.id) {
      return NextResponse.json(
        { error: 'This registration request is not for your college' },
        { status: 403 }
      );
    }

    // Check if already processed
    if (requestData?.status !== 'pending') {
      return NextResponse.json(
        { error: `Registration request has already been ${requestData?.status}` },
        { status: 400 }
      );
    }

    // Create student record
    const studentData = {
      name: requestData?.studentName,
      email: requestData?.email,
      collegeName: collegeData.name,
      normalizedCollegeName: requestData?.normalizedCollegeName,
      collegeId: collegeDoc.id,
      organizationId: collegeData.organizationId,
      rollNumber: requestData?.rollNumber || '',
      branch: requestData?.branch || '',
      year: requestData?.year || 1,
      cgpa: 0,
      skills: requestData?.extractedSkills || [],
      // Transfer resume data from registration request
      ...(requestData?.resumeUrl && {
        resumeUrl: requestData.resumeUrl,
        extractedSkills: requestData.extractedSkills || [],
        education: requestData.education || [],
        projects: requestData.projects || [],
        experienceLevel: requestData.experienceLevel || 'fresher',
        resumeScore: requestData.resumeScore || 0,
        resumeParsedAt: requestData.resumeParsedAt,
      }),
      registrationStatus: 'approved',
      createdAt: new Date(),
    };

    const studentRef = await db.collection('students').add(studentData);
    console.log(`✅ Student created: ${studentRef.id}`);

    // Update registration request status
    await db.collection('registration_requests').doc(requestId).update({
      status: 'approved',
      reviewedAt: new Date(),
      reviewedBy: user.id,
    });

    // Send approval notification to student
    try {
      await notifyStudentOfApproval({
        studentId: studentRef.id,
        collegeName: collegeData.name,
        requestId,
      });
      console.log(`✅ Approval notification sent to student ${studentRef.id}`);
    } catch (notificationError) {
      console.error('⚠️ Failed to send approval notification:', notificationError);
      // Don't fail the approval if notification fails
    }

    // Update college stats
    try {
      await db.collection('colleges').doc(collegeDoc.id).update({
        'stats.totalStudents': (collegeData.stats?.totalStudents || 0) + 1,
        'stats.pendingRegistrations': Math.max((collegeData.stats?.pendingRegistrations || 1) - 1, 0),
      });
    } catch (statsError) {
      console.error('⚠️ Failed to update college stats:', statsError);
    }

    return NextResponse.json({
      success: true,
      studentId: studentRef.id,
      message: 'Registration request approved successfully',
    });
  } catch (error) {
    console.error('Error approving registration request:', error);
    return NextResponse.json(
      { error: 'Failed to approve registration request' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { getCurrentUser } from '@/lib/actions/auth.action';
import { notifyStudentOfRejection } from '@/lib/services/notification.service';

/**
 * POST /api/registration-requests/[requestId]/reject
 * Reject a student registration request
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'college') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = await params;
    const body = await request.json();
    const { rejectionReason } = body;

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

    // Update registration request status
    await db.collection('registration_requests').doc(requestId).update({
      status: 'rejected',
      reviewedAt: new Date(),
      reviewedBy: user.id,
      rejectionReason: rejectionReason || 'No reason provided',
    });

    // Send rejection notification to student
    try {
      await notifyStudentOfRejection({
        email: requestData?.email,
        collegeName: collegeData.name,
        requestId,
        rejectionReason,
      });
      console.log(`✅ Rejection notification sent for request ${requestId}`);
    } catch (notificationError) {
      console.error('⚠️ Failed to send rejection notification:', notificationError);
      // Don't fail the rejection if notification fails
    }

    // Update college stats
    try {
      await db.collection('colleges').doc(collegeDoc.id).update({
        'stats.pendingRegistrations': Math.max((collegeData.stats?.pendingRegistrations || 1) - 1, 0),
      });
    } catch (statsError) {
      console.error('⚠️ Failed to update college stats:', statsError);
    }

    return NextResponse.json({
      success: true,
      message: 'Registration request rejected successfully',
    });
  } catch (error) {
    console.error('Error rejecting registration request:', error);
    return NextResponse.json(
      { error: 'Failed to reject registration request' },
      { status: 500 }
    );
  }
}

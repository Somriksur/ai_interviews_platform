import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const { notificationId } = await params;
    const { action, notes } = await request.json();

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Get notification
    const notificationDoc = await db
      .collection('jobNotifications')
      .doc(notificationId)
      .get();

    if (!notificationDoc.exists) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    const notificationData = notificationDoc.data();
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Update notification status
    await db
      .collection('jobNotifications')
      .doc(notificationId)
      .update({
        status: newStatus,
        respondedAt: new Date(),
        notes: notes || null,
      });

    // Update job posting collegeApprovals map
    const jobDoc = await db
      .collection('jobPostings')
      .doc(notificationData?.jobPostingId)
      .get();

    if (jobDoc.exists) {
      const jobData = jobDoc.data();
      const collegeApprovals = jobData?.collegeApprovals || {};
      const normalizedCollegeName = notificationData?.normalizedCollegeName;

      if (normalizedCollegeName) {
        // Update the approval status for this college
        collegeApprovals[normalizedCollegeName] = {
          status: newStatus,
          respondedAt: new Date(),
          notes: notes || null,
        };

        await db
          .collection('jobPostings')
          .doc(notificationData?.jobPostingId)
          .update({
            collegeApprovals,
            updatedAt: new Date(),
          });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Job ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      status: newStatus,
    });
  } catch (error) {
    console.error('Error responding to notification:', error);
    return NextResponse.json(
      { error: 'Failed to respond to notification' },
      { status: 500 }
    );
  }
}

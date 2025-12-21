import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { isValidNotificationAction, actionToStatus } from '@/types/drive-notification';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const { notificationId } = await params;
    const { action } = await request.json();

    // Validate action parameter
    if (!action || !isValidNotificationAction(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "confirm" or "decline"' },
        { status: 400 }
      );
    }

    // Get notification document
    const notificationDoc = await db
      .collection('driveNotifications')
      .doc(notificationId)
      .get();

    if (!notificationDoc.exists) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    const notificationData = notificationDoc.data();
    const newStatus = actionToStatus(action);

    // Update notification status
    await db
      .collection('driveNotifications')
      .doc(notificationId)
      .update({
        status: newStatus,
        respondedAt: new Date(),
      });

    // Update the interview drive status when college responds
    if (notificationData?.driveId) {
      try {
        // Get all notifications for this drive to check overall status
        const allNotificationsForDrive = await db
          .collection('driveNotifications')
          .where('driveId', '==', notificationData.driveId)
          .get();

        const notifications = allNotificationsForDrive.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Update current notification status in memory
          status: doc.id === notificationId ? newStatus : doc.data().status
        }));

        const confirmedCount = notifications.filter(n => n.status === 'confirmed').length;
        const declinedCount = notifications.filter(n => n.status === 'declined').length;
        const totalNotifications = notifications.length;

        let driveStatus = 'pending';
        let updateData: any = {};

        if (confirmedCount >= 1) {
          // At least one college confirmed - drive is active
          driveStatus = 'active';
          updateData = {
            status: 'active',
            activatedAt: new Date(),
          };
        } else if (declinedCount === totalNotifications && totalNotifications > 0) {
          // All colleges declined - drive is cancelled
          driveStatus = 'cancelled';
          updateData = {
            status: 'cancelled',
            cancelledAt: new Date(),
          };
        }

        // Update drive status if it changed
        if (driveStatus !== 'pending') {
          await db
            .collection('interview_drives')
            .doc(notificationData.driveId)
            .update(updateData);
          
          console.log(`✅ Interview drive ${notificationData.driveId} marked as ${driveStatus}`);
        }
      } catch (error) {
        console.error('❌ Error updating drive status:', error);
        // Don't fail the notification response if drive update fails
      }
    }

    console.log(`✅ Drive notification ${notificationId} ${newStatus}`);

    return NextResponse.json({
      success: true,
      message: `Interview drive ${action === 'confirm' ? 'confirmed' : 'declined'} successfully`,
      status: newStatus,
    });
  } catch (error) {
    console.error('Error responding to drive notification:', error);
    return NextResponse.json(
      { error: 'Failed to respond to notification' },
      { status: 500 }
    );
  }
}

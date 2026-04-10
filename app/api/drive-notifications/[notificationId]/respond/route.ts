import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db as db } from '@/firebase/admin';
import { isValidNotificationAction, actionToStatus } from '@/types/drive-notification';
import { getAuthContext } from '@/lib/security/auth-context';
import { requireRole } from '@/lib/security/guards';

const respondSchema = z
  .object({
    action: z.string().min(1),
  })
  .strict();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const roleError = requireRole(authResult.context, ['college']);
    if (roleError) return roleError;

    const { notificationId } = await params;
    const rawBody = await request.json();
    const parseResult = respondSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const { action } = parseResult.data;

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

    const ownedCollegeSnapshot = await db
      .collection('colleges')
      .where('adminId', '==', authResult.context.user.id)
      .limit(1)
      .get();

    if (ownedCollegeSnapshot.empty) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const ownedCollegeId = ownedCollegeSnapshot.docs[0].id;
    if (notificationData?.collegeId !== ownedCollegeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

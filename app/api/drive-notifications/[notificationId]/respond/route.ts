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

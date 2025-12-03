import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { getCurrentUser } from '@/lib/actions/auth.action';

/**
 * PATCH /api/colleges/[collegeId]/notifications/[notificationId]
 * Mark a notification as read
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ collegeId: string; notificationId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'college') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collegeId, notificationId } = await params;

    // Verify notification belongs to this college
    const notificationDoc = await db
      .collection('college_notifications')
      .doc(notificationId)
      .get();

    if (!notificationDoc.exists) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    const notificationData = notificationDoc.data();
    if (notificationData?.collegeId !== collegeId) {
      return NextResponse.json(
        { error: 'Notification does not belong to this college' },
        { status: 403 }
      );
    }

    // Mark as read
    await db.collection('college_notifications').doc(notificationId).update({
      read: true,
      readAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/colleges/[collegeId]/notifications/[notificationId]
 * Delete a notification
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ collegeId: string; notificationId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'college') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collegeId, notificationId } = await params;

    // Verify notification belongs to this college
    const notificationDoc = await db
      .collection('college_notifications')
      .doc(notificationId)
      .get();

    if (!notificationDoc.exists) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    const notificationData = notificationDoc.data();
    if (notificationData?.collegeId !== collegeId) {
      return NextResponse.json(
        { error: 'Notification does not belong to this college' },
        { status: 403 }
      );
    }

    // Delete notification
    await db.collection('college_notifications').doc(notificationId).delete();

    return NextResponse.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}

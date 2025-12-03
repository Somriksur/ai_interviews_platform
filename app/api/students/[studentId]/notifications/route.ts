import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';

/**
 * GET /api/students/[studentId]/notifications
 * Get all notifications for a student
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;

    console.log('🔍 Fetching notifications for student:', studentId);

    // Get all notifications for this student
    const notificationsSnapshot = await db
      .collection('student_notifications')
      .where('studentId', '==', studentId)
      .orderBy('createdAt', 'desc')
      .get();

    console.log('📊 Found notifications:', notificationsSnapshot.size);

    const notifications = [];
    const driveIds = new Set<string>();
    const orgIds = new Set<string>();

    for (const doc of notificationsSnapshot.docs) {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
      });

      if (data.driveId) driveIds.add(data.driveId);
      if (data.organizationId) orgIds.add(data.organizationId);
    }

    // Fetch drive details
    const drives: any[] = [];
    if (driveIds.size > 0) {
      const drivePromises = Array.from(driveIds).map((id) =>
        db.collection('interview_drives').doc(id).get()
      );
      const driveDocs = await Promise.all(drivePromises);
      driveDocs.forEach((doc) => {
        if (doc.exists) {
          drives.push({ id: doc.id, ...doc.data() });
        }
      });
    }

    // Fetch organization details
    const organizations: any[] = [];
    if (orgIds.size > 0) {
      const orgPromises = Array.from(orgIds).map((id) =>
        db.collection('organizations').doc(id).get()
      );
      const orgDocs = await Promise.all(orgPromises);
      orgDocs.forEach((doc) => {
        if (doc.exists) {
          organizations.push({ id: doc.id, ...doc.data() });
        }
      });
    }

    // Calculate summary
    const summary = {
      total: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
      selected: notifications.filter((n) => n.action === 'selected').length,
      rejected: notifications.filter((n) => n.action === 'rejected').length,
    };

    console.log('✅ Returning data:', {
      notificationsCount: notifications.length,
      drivesCount: drives.length,
      summary,
    });

    return NextResponse.json({
      notifications,
      drives,
      organizations,
      summary,
    });
  } catch (error) {
    console.error('❌ Error fetching student notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/students/[studentId]/notifications
 * Mark notification(s) as read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const body = await request.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      // Mark all notifications as read
      const notificationsSnapshot = await db
        .collection('student_notifications')
        .where('studentId', '==', studentId)
        .where('read', '==', false)
        .get();

      const batch = db.batch();
      notificationsSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true, status: 'read' });
      });

      await batch.commit();

      console.log(`✅ Marked ${notificationsSnapshot.size} notifications as read for student ${studentId}`);

      return NextResponse.json({
        success: true,
        count: notificationsSnapshot.size,
        message: 'All notifications marked as read',
      });
    } else if (notificationId) {
      // Mark specific notification as read
      const notificationDoc = await db
        .collection('student_notifications')
        .doc(notificationId)
        .get();

      if (!notificationDoc.exists) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }

      const notificationData = notificationDoc.data();
      if (notificationData?.studentId !== studentId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      await notificationDoc.ref.update({
        read: true,
        status: 'read',
      });

      console.log(`✅ Marked notification ${notificationId} as read`);

      return NextResponse.json({
        success: true,
        message: 'Notification marked as read',
      });
    } else {
      return NextResponse.json(
        { error: 'Either notificationId or markAllRead must be provided' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('❌ Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

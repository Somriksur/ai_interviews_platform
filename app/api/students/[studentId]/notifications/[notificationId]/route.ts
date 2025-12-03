import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { getCurrentUser } from '@/lib/actions/auth.action';

// DELETE /api/students/[studentId]/notifications/[notificationId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ studentId: string; notificationId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId, notificationId } = await params;
    
    // Verify user can access this student's notifications
    if (user.role === 'student') {
      // For students, verify they own this student record
      const studentDoc = await db.collection('students').doc(studentId).get();
      if (!studentDoc.exists || studentDoc.data()?.userId !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    console.log(`🗑️ Deleting notification ${notificationId} for student ${studentId}`);

    // Get the notification to verify ownership
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
    
    // Verify the notification belongs to this student
    if (notificationData?.studentId !== studentId) {
      return NextResponse.json(
        { error: 'Notification does not belong to this student' },
        { status: 403 }
      );
    }

    // Delete the notification
    await notificationDoc.ref.delete();

    console.log(`✅ Deleted notification ${notificationId}`);

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully',
    });

  } catch (error: any) {
    console.error('❌ Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/students/[studentId]/notifications/[notificationId]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ studentId: string; notificationId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId, notificationId } = await params;
    
    // Verify user can access this student's notifications
    if (user.role === 'student') {
      // For students, verify they own this student record
      const studentDoc = await db.collection('students').doc(studentId).get();
      if (!studentDoc.exists || studentDoc.data()?.userId !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    console.log(`📖 Fetching notification ${notificationId} for student ${studentId}`);

    // Get the notification
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
    
    // Verify the notification belongs to this student
    if (notificationData?.studentId !== studentId) {
      return NextResponse.json(
        { error: 'Notification does not belong to this student' },
        { status: 403 }
      );
    }

    // If this is a message notification, get the full message content
    let messageContent = null;
    if (notificationData.type === 'message' && notificationData.messageId) {
      try {
        const messageDoc = await db
          .collection('college_messages')
          .doc(notificationData.messageId)
          .get();
        
        if (messageDoc.exists) {
          messageContent = messageDoc.data();
        }
      } catch (error) {
        console.warn('Failed to fetch message content:', error);
      }
    }

    const notification: any = {
      id: notificationDoc.id,
      ...notificationData,
      messageContent,
    };

    // Mark as read if it wasn't already
    if (!notificationData.read) {
      try {
        await notificationDoc.ref.update({
          read: true,
          readAt: new Date(),
        });
        notification.read = true;
        notification.readAt = new Date();

        // Update message read count if applicable
        if (notificationData.type === 'message' && notificationData.messageId) {
          const messageRef = db.collection('college_messages').doc(notificationData.messageId);
          await db.runTransaction(async (transaction) => {
            const messageDoc = await transaction.get(messageRef);
            if (messageDoc.exists) {
              const messageData = messageDoc.data();
              const currentReadBy = messageData?.readBy || [];
              
              if (!currentReadBy.includes(studentId)) {
                transaction.update(messageRef, {
                  readCount: (messageData?.readCount || 0) + 1,
                  readBy: [...currentReadBy, studentId],
                });
              }
            }
          });
        }
      } catch (error) {
        console.warn('Failed to mark notification as read:', error);
      }
    }

    console.log(`✅ Returned notification ${notificationId}`);

    return NextResponse.json({ notification });

  } catch (error: any) {
    console.error('❌ Error fetching notification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification', details: error.message },
      { status: 500 }
    );
  }
}

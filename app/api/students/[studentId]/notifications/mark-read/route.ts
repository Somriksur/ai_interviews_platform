import { NextRequest, NextResponse } from 'next/server';
import { z } from "zod";
import { db } from '@/firebase/admin';
import { getCurrentUser } from '@/lib/actions/auth.action';

const markReadSchema = z
  .object({
    notificationIds: z.array(z.string().min(1)).max(10).optional(),
    markAll: z.boolean().optional(),
  })
  .strict();

// PATCH /api/students/[studentId]/notifications/mark-read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;
    
    // Verify user can access this student's notifications
    if (user.role === 'student') {
      // For students, verify they own this student record
      const studentDoc = await db.collection('students').doc(studentId).get();
      if (!studentDoc.exists || studentDoc.data()?.userId !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const rawBody = await request.json();
    const parseResult = markReadSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const { notificationIds, markAll = false } = parseResult.data;

    console.log(`📖 Marking notifications as read for student ${studentId}:`, {
      markAll,
      specificIds: notificationIds?.length || 0,
    });

    let query = db
      .collection('student_notifications')
      .where('studentId', '==', studentId)
      .where('read', '==', false);

    // If specific notification IDs provided, filter by them
    if (!markAll && notificationIds && notificationIds.length > 0) {
      query = db
        .collection('student_notifications')
        .where('studentId', '==', studentId)
        .where('__name__', 'in', notificationIds)
        .where('read', '==', false);
    }

    const notificationsSnapshot = await query.get();
    
    if (notificationsSnapshot.empty) {
      return NextResponse.json({
        updated: 0,
        message: 'No unread notifications found',
      });
    }

    // Update notifications to mark as read
    const updatePromises = notificationsSnapshot.docs.map(doc => 
      doc.ref.update({
        read: true,
        readAt: new Date(),
      })
    );

    const updateResults = await Promise.allSettled(updatePromises);
    const successfulUpdates = updateResults.filter(result => result.status === 'fulfilled').length;
    const failedUpdates = updateResults.filter(result => result.status === 'rejected').length;

    // If any notifications were messages, update the message read count
    const messageNotifications = notificationsSnapshot.docs
      .filter(doc => doc.data().type === 'message' && doc.data().messageId)
      .map(doc => doc.data().messageId);

    if (messageNotifications.length > 0) {
      const uniqueMessageIds = [...new Set(messageNotifications)];
      
      for (const messageId of uniqueMessageIds) {
        try {
          const messageRef = db.collection('college_messages').doc(messageId);
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
        } catch (error) {
          console.warn(`Failed to update read count for message ${messageId}:`, error);
        }
      }
    }

    console.log(`✅ Marked ${successfulUpdates} notifications as read, ${failedUpdates} failed`);

    return NextResponse.json({
      updated: successfulUpdates,
      failed: failedUpdates,
      total: notificationsSnapshot.size,
    });

  } catch (error: any) {
    console.error('❌ Error marking notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read', details: error.message },
      { status: 500 }
    );
  }
}

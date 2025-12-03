import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { getCurrentUser } from '@/lib/actions/auth.action';

// DELETE /api/colleges/[collegeId]/messages/[messageId] - Delete a message
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ collegeId: string; messageId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'college') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collegeId, messageId } = await params;

    console.log(`🗑️ Deleting message ${messageId} from college ${collegeId}`);

    // Verify the message belongs to this college
    const messageDoc = await db.collection('college_messages').doc(messageId).get();
    
    if (!messageDoc.exists) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const messageData = messageDoc.data();
    if (messageData?.collegeId !== collegeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the message
    await db.collection('college_messages').doc(messageId).delete();
    console.log(`✅ Message ${messageId} deleted`);

    // Delete associated notifications
    const notificationsSnapshot = await db
      .collection('student_notifications')
      .where('messageId', '==', messageId)
      .get();

    if (!notificationsSnapshot.empty) {
      const deletePromises = notificationsSnapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(deletePromises);
      console.log(`✅ Deleted ${notificationsSnapshot.size} associated notifications`);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Message and associated notifications deleted successfully'
    });

  } catch (error: any) {
    console.error('❌ Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message', details: error.message },
      { status: 500 }
    );
  }
}

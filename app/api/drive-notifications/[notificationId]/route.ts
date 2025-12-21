import { NextRequest, NextResponse } from "next/server";
import { db as db } from "@/firebase/admin";
import { getCurrentUser } from "@/lib/actions/auth.action";

/**
 * DELETE /api/drive-notifications/[notificationId]
 * Delete a drive notification
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'college') {
      return NextResponse.json({ error: 'Unauthorized - must be college user' }, { status: 401 });
    }

    const { notificationId } = await params;

    // Get the notification
    const notificationDoc = await db.collection('driveNotifications').doc(notificationId).get();
    
    if (!notificationDoc.exists) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    const notificationData = notificationDoc.data();

    // Verify user has access to this notification (through college)
    const collegeSnapshot = await db
      .collection('colleges')
      .where('adminId', '==', user.id)
      .get();

    if (collegeSnapshot.empty) {
      return NextResponse.json({ error: 'College not found for this user' }, { status: 404 });
    }

    const userCollegeId = collegeSnapshot.docs[0].id;

    if (notificationData?.collegeId !== userCollegeId) {
      return NextResponse.json({ error: 'Unauthorized - notification belongs to different college' }, { status: 403 });
    }

    // Delete the notification
    await notificationDoc.ref.delete();

    console.log(`✅ Deleted drive notification ${notificationId}`);

    return NextResponse.json({
      success: true,
      message: 'Drive notification deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting drive notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete drive notification' },
      { status: 500 }
    );
  }
}
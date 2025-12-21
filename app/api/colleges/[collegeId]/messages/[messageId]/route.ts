import { NextRequest, NextResponse } from "next/server";
import { db as db } from "@/firebase/admin";
import { getCurrentUser } from "@/lib/actions/auth.action";

/**
 * GET /api/colleges/[collegeId]/messages/[messageId]
 * Get a specific college message
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ collegeId: string; messageId: string }> }
) {
  try {
    const { collegeId, messageId } = await params;

    const messageDoc = await db
      .collection("college_messages")
      .doc(messageId)
      .get();

    if (!messageDoc.exists) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    const messageData = messageDoc.data();

    // Verify the message belongs to the college
    if (messageData?.collegeId !== collegeId) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: messageDoc.id,
      ...messageData,
    });
  } catch (error) {
    console.error("Error fetching message:", error);
    return NextResponse.json(
      { error: "Failed to fetch message" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/colleges/[collegeId]/messages/[messageId]
 * Delete a college message
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ collegeId: string; messageId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'college') {
      return NextResponse.json({ error: 'Unauthorized - must be college user' }, { status: 401 });
    }

    const { collegeId, messageId } = await params;

    // Verify user has access to this college
    const collegeDoc = await db.collection('colleges').doc(collegeId).get();
    
    if (!collegeDoc.exists) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 });
    }

    const collegeData = collegeDoc.data();
    if (collegeData?.adminId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized - not your college' }, { status: 403 });
    }

    // Get the message
    const messageDoc = await db.collection('college_messages').doc(messageId).get();
    
    if (!messageDoc.exists) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const messageData = messageDoc.data();

    // Verify the message belongs to the college
    if (messageData?.collegeId !== collegeId) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Delete the message
    await messageDoc.ref.delete();

    console.log(`✅ Deleted message ${messageId} from college ${collegeId}`);

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
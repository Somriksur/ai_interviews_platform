import { NextRequest, NextResponse } from "next/server";
import { db as db } from "@/firebase/admin";
import { getAuthContext } from "@/lib/security/auth-context";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const { id: notificationId } = await params;

    const notificationRef = db.collection("notifications").doc(notificationId);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    const ownerId = notificationDoc.data()?.userId;
    if (ownerId !== authResult.context.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await notificationRef.update({
      read: true,
      readAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}

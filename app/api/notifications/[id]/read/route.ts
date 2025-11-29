import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const notificationId = params.id;

        await adminDb.collection("notifications").doc(notificationId).update({
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

import { NextRequest, NextResponse } from "next/server";
import { db as db } from "@/firebase/admin";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
    const { id } = await params;
        const notificationId = id;

        await db.collection("notifications").doc(notificationId).update({
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

import { NextRequest, NextResponse } from "next/server";
import { db as adminDb } from "@/firebase/admin";

export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        // Get all unread notifications for user
        const notificationsRef = adminDb
            .collection("notifications")
            .where("userId", "==", userId)
            .where("read", "==", false);

        const snapshot = await notificationsRef.get();

        // Batch update
        const batch = adminDb.batch();
        snapshot.docs.forEach((doc) => {
            batch.update(doc.ref, {
                read: true,
                readAt: new Date(),
            });
        });

        await batch.commit();

        return NextResponse.json({
            success: true,
            updated: snapshot.size,
        });
    } catch (error) {
        console.error("Error marking all as read:", error);
        return NextResponse.json(
            { error: "Failed to mark all as read" },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";
import { db as db } from "@/firebase/admin";

export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        // Fetch notifications from Firestore
        const notificationsRef = db
            .collection("notifications")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .limit(50);

        const snapshot = await notificationsRef.get();
        const notifications = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
        }));

        const unreadCount = notifications.filter((n: any) => !n.read).length;

        return NextResponse.json({
            notifications,
            unreadCount,
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json(
            { error: "Failed to fetch notifications" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, type, title, message, link, metadata } = body;

        if (!userId || !type || !title || !message) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Create notification in Firestore
        const notificationRef = await db.collection("notifications").add({
            userId,
            type,
            title,
            message,
            link: link || null,
            metadata: metadata || {},
            read: false,
            createdAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            notificationId: notificationRef.id,
        });
    } catch (error) {
        console.error("Error creating notification:", error);
        return NextResponse.json(
            { error: "Failed to create notification" },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db as db } from "@/firebase/admin";
import { getAuthContext } from "@/lib/security/auth-context";
import { requireRole, requireUserMatch } from "@/lib/security/guards";

const createNotificationSchema = z
  .object({
    userId: z.string().min(1),
    type: z.string().min(1).max(64),
    title: z.string().min(1).max(180),
    message: z.string().min(1).max(2000),
    link: z.string().max(500).nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const ownershipError = requireUserMatch(authResult.context, userId);
    if (ownershipError) return ownershipError;

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
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const roleError = requireRole(authResult.context, ["organization", "college"]);
    if (roleError) return roleError;

    const rawBody = await request.json();
    const parseResult = createNotificationSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, type, title, message, link, metadata } = parseResult.data;

    const notificationRef = await db.collection("notifications").add({
      userId,
      type,
      title,
      message,
      link: link || null,
      metadata: metadata || {},
      read: false,
      createdAt: new Date(),
      createdBy: authResult.context.user.id,
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

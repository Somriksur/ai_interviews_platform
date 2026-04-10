import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db as db } from "@/firebase/admin";
import { getAuthContext } from "@/lib/security/auth-context";
import { requireUserMatch } from "@/lib/security/guards";

const markAllSchema = z.object({ userId: z.string().min(1) }).strict();

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const rawBody = await request.json();
    const parseResult = markAllSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { userId } = parseResult.data;
    const ownershipError = requireUserMatch(authResult.context, userId);
    if (ownershipError) return ownershipError;

    const notificationsRef = db
      .collection("notifications")
      .where("userId", "==", userId)
      .where("read", "==", false);

    const snapshot = await notificationsRef.get();

    const batch = db.batch();
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

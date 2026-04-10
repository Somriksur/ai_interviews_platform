import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db as db } from "@/firebase/admin";
import { getAuthContext } from "@/lib/security/auth-context";
import { requireRole } from "@/lib/security/guards";

const securityEventSchema = z
  .object({
    type: z.string().min(1).max(80),
    severity: z.enum(["low", "medium", "high"]),
    interviewId: z.string().min(1),
    timestamp: z.union([z.string(), z.date()]),
    details: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export async function POST(request: NextRequest) {
    try {
        const authResult = await getAuthContext(request);
        if (!authResult.ok) return authResult.response;

        const roleError = requireRole(authResult.context, ["candidate", "student", "organization", "college"]);
        if (roleError) return roleError;

        const rawEvent = await request.json();
        const parseResult = securityEventSchema.safeParse(rawEvent);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: "Invalid request body", details: parseResult.error.flatten() },
                { status: 400 }
            );
        }
        const event = parseResult.data;

        await db.collection("security_events").add({
            type: event.type,
            severity: event.severity,
            interviewId: event.interviewId,
            details: event.details || {},
            timestamp: new Date(event.timestamp),
            createdAt: new Date(),
            userId: authResult.context.user.id,
        });

        // Check if we need to alert recruiter
        if (event.severity === "high") {
            // Create notification for recruiter
            const sessionDoc = await db
                .collection("interview_sessions")
                .doc(event.interviewId)
                .get();

            if (sessionDoc.exists) {
                const session = sessionDoc.data();
                const driveDoc = session?.driveId
                    ? await db.collection("interview_drives").doc(session.driveId).get()
                    : null;
                const driveData = driveDoc?.data() || {};
                await db.collection("notifications").add({
                    userId: driveData?.organizationId || null,
                    type: "security_alert",
                    title: "Security Alert",
                    message: `Suspicious activity detected in interview session ${event.interviewId}`,
                    link: `/organization/${driveData?.organizationId || ""}/interview-drives/${session?.driveId || ""}`,
                    read: false,
                    createdAt: new Date(),
                    metadata: { eventType: event.type, severity: event.severity },
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error logging security event:", error);
        return NextResponse.json(
            { error: "Failed to log security event" },
            { status: 500 }
        );
    }
}

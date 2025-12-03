import { NextRequest, NextResponse } from "next/server";
import { db as db } from "@/firebase/admin";

export async function POST(request: NextRequest) {
    try {
        const event = await request.json();

        // Store security event in Firestore
        await db.collection("security_events").add({
            ...event,
            timestamp: new Date(event.timestamp),
            createdAt: new Date(),
        });

        // Check if we need to alert recruiter
        if (event.severity === "high") {
            // Create notification for recruiter
            const interviewDoc = await db
                .collection("interviews")
                .doc(event.interviewId)
                .get();

            if (interviewDoc.exists) {
                const interview = interviewDoc.data();
                await db.collection("notifications").add({
                    userId: interview?.recruiterId,
                    type: "security_alert",
                    title: "Security Alert",
                    message: `Suspicious activity detected in interview for ${interview?.candidateEmail}`,
                    link: `/recruiter/interviews/${event.interviewId}`,
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

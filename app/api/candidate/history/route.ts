import { NextRequest, NextResponse } from "next/server";
import { db as adminDb } from "@/firebase/admin";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
    try {
        // Get user from session
        const cookieStore = cookies();
        const session = cookieStore.get("session");

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // In production, decode session to get userId
        // For now, get from query params
        const userId = request.nextUrl.searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        // Fetch completed interviews for candidate
        const interviewsRef = adminDb
            .collection("interviews")
            .where("candidateId", "==", userId)
            .where("status", "==", "completed")
            .orderBy("completedAt", "desc");

        const snapshot = await interviewsRef.get();

        const history = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                role: data.role,
                score: data.score || 0,
                completedAt: data.completedAt?.toDate() || new Date(),
                status: data.status,
                level: data.level,
                type: data.type,
            };
        });

        return NextResponse.json({ history });
    } catch (error) {
        console.error("Error fetching interview history:", error);
        return NextResponse.json(
            { error: "Failed to fetch history" },
            { status: 500 }
        );
    }
}

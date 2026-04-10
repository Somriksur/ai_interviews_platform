import { NextRequest, NextResponse } from "next/server";
import { db as db } from "@/firebase/admin";
import { getAuthContext } from "@/lib/security/auth-context";

/**
 * GET /api/students/by-user/[userId]
 * Get student record by Firebase user ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const { userId } = await params;
    if (authResult.context.user.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Query students collection for matching userId
    const studentsSnapshot = await db
      .collection("students")
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (studentsSnapshot.empty) {
      return NextResponse.json(
        { error: "Student record not found" },
        { status: 404 }
      );
    }

    const studentDoc = studentsSnapshot.docs[0];
    const studentData = {
      id: studentDoc.id,
      ...studentDoc.data(),
    };

    return NextResponse.json(studentData);
  } catch (error) {
    console.error("Error fetching student by user ID:", error);
    return NextResponse.json(
      { error: "Failed to fetch student" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db as db } from "@/firebase/admin";
import { getAuthContext } from "@/lib/security/auth-context";
import { requireOrganizationOwnership, requireRole, requireStudentAccess } from "@/lib/security/guards";

const createSessionSchema = z
  .object({
    driveId: z.string().min(1),
    studentId: z.string().min(1),
    status: z.enum(["assigned", "in-progress", "completed"]).optional(),
  })
  .strict();

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const roleError = requireRole(authResult.context, ["college", "organization"]);
    if (roleError) return roleError;

    const rawBody = await request.json();
    const parseResult = createSessionSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { driveId, studentId, status } = parseResult.data;

    const driveDoc = await db.collection("interview_drives").doc(driveId).get();
    if (!driveDoc.exists) {
      return NextResponse.json({ error: "Interview drive not found" }, { status: 404 });
    }
    const driveData = driveDoc.data() || {};

    if (authResult.context.user.role === "organization") {
      const ownershipError = await requireOrganizationOwnership(
        authResult.context,
        driveData.organizationId
      );
      if (ownershipError) return ownershipError;
    }

    const studentAccessError = await requireStudentAccess(authResult.context, studentId);
    if (studentAccessError) return studentAccessError;

    const sessionData = {
      driveId,
      studentId,
      status: status || "in-progress",
      transcript: [],
      startedAt: new Date(),
      completedAt: null,
      duration: null,
      evaluationTriggered: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: authResult.context.user.id,
    };

    const sessionRef = await db.collection("interview_sessions").add(sessionData);

    return NextResponse.json({
      sessionId: sessionRef.id,
      ...sessionData,
    });
  } catch (error) {
    console.error("Error creating interview session:", error);
    return NextResponse.json({ error: "Failed to create interview session" }, { status: 500 });
  }
}

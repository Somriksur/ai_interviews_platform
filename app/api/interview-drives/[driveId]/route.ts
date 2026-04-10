import { NextRequest, NextResponse } from "next/server";
import { db as db } from "@/firebase/admin";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getAuthContext } from "@/lib/security/auth-context";

/**
 * GET /api/interview-drives/[driveId]
 * Get interview drive details
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ driveId: string }> }
) {
  try {
    const authResult = await getAuthContext(_request);
    if (!authResult.ok) return authResult.response;

    const { driveId } = await params;

    const driveDoc = await db
      .collection("interview_drives")
      .doc(driveId)
      .get();

    if (!driveDoc.exists) {
      return NextResponse.json(
        { error: "Interview drive not found" },
        { status: 404 }
      );
    }

    const driveData = driveDoc.data();
    const user = authResult.context.user;
    let allowed = false;

    if (user.role === "organization") {
      const orgSnapshot = await db
        .collection("organizations")
        .where("adminId", "==", user.id)
        .limit(1)
        .get();
      allowed = !orgSnapshot.empty && driveData?.organizationId === orgSnapshot.docs[0].id;
    } else if (user.role === "college") {
      const collegeSnapshot = await db
        .collection("colleges")
        .where("adminId", "==", user.id)
        .limit(1)
        .get();
      allowed =
        !collegeSnapshot.empty &&
        Array.isArray(driveData?.colleges) &&
        driveData.colleges.includes(collegeSnapshot.docs[0].id);
    } else if (user.role === "student") {
      const studentSnapshot = await db
        .collection("students")
        .where("userId", "==", user.id)
        .limit(1)
        .get();

      if (!studentSnapshot.empty) {
        const studentId = studentSnapshot.docs[0].id;
        const sessionSnapshot = await db
          .collection("interview_sessions")
          .where("driveId", "==", driveId)
          .where("studentId", "==", studentId)
          .limit(1)
          .get();
        allowed = !sessionSnapshot.empty;
      }
    }

    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      id: driveDoc.id,
      ...driveData,
    });
  } catch (error) {
    console.error("Error fetching interview drive:", error);
    return NextResponse.json(
      { error: "Failed to fetch interview drive" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/interview-drives/[driveId]
 * Delete an interview drive and all related data
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ driveId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'organization') {
      return NextResponse.json({ error: 'Unauthorized - must be organization user' }, { status: 401 });
    }

    const { driveId } = await params;

    // Get the interview drive
    const driveDoc = await db.collection('interview_drives').doc(driveId).get();
    
    if (!driveDoc.exists) {
      return NextResponse.json({ error: 'Interview drive not found' }, { status: 404 });
    }

    const driveData = driveDoc.data();

    // Verify ownership
    const orgSnapshot = await db
      .collection('organizations')
      .where('adminId', '==', user.id)
      .get();

    if (orgSnapshot.empty) {
      return NextResponse.json({ error: 'Organization not found for this user' }, { status: 404 });
    }

    const userOrgId = orgSnapshot.docs[0].id;

    if (driveData?.organizationId !== userOrgId) {
      return NextResponse.json({ error: 'Unauthorized - drive belongs to different organization' }, { status: 403 });
    }

    // Delete related data
    const batch = db.batch();

    // Delete interview sessions
    const sessionsSnapshot = await db
      .collection('interview_sessions')
      .where('driveId', '==', driveId)
      .get();

    const evaluationIds: string[] = [];
    sessionsSnapshot.docs.forEach((doc) => {
      const sessionData = doc.data();
      if (sessionData.evaluationId) {
        evaluationIds.push(sessionData.evaluationId);
      }
      batch.delete(doc.ref);
    });

    // Delete evaluation reports
    for (const evaluationId of evaluationIds) {
      const reportRef = db.collection('evaluation_reports').doc(evaluationId);
      batch.delete(reportRef);
    }

    // Delete drive notifications
    const driveNotificationsSnapshot = await db
      .collection('driveNotifications')
      .where('driveId', '==', driveId)
      .get();

    driveNotificationsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete drive student tags
    const tagsSnapshot = await db
      .collection('drive_student_tags')
      .where('driveId', '==', driveId)
      .get();

    tagsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete the interview drive itself
    batch.delete(driveDoc.ref);

    // Execute all deletes
    await batch.commit();

    console.log(`✅ Deleted interview drive ${driveId} and all related data`, {
      driveId,
      sessionsDeleted: sessionsSnapshot.size,
      evaluationReportsDeleted: evaluationIds.length,
      notificationsDeleted: driveNotificationsSnapshot.size,
      tagsDeleted: tagsSnapshot.size,
    });

    return NextResponse.json({
      success: true,
      message: 'Interview drive deleted successfully',
      deleted: {
        sessions: sessionsSnapshot.size,
        evaluationReports: evaluationIds.length,
        notifications: driveNotificationsSnapshot.size,
        tags: tagsSnapshot.size,
      }
    });
  } catch (error) {
    console.error('❌ Error deleting interview drive:', error);
    return NextResponse.json(
      { error: 'Failed to delete interview drive' },
      { status: 500 }
    );
  }
}

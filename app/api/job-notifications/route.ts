import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/firebase/admin";
import { normalizeCollegeName } from "@/lib/services/college-name.service";
import { getAuthContext } from "@/lib/security/auth-context";
import { requireOrganizationOwnership, requireRole } from "@/lib/security/guards";

const createJobNotificationSchema = z
  .object({
    jobPostingId: z.string().min(1),
    collegeName: z.string().min(1).max(200),
    organizationId: z.string().min(1),
  })
  .strict();

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const roleError = requireRole(authResult.context, ["college"]);
    if (roleError) return roleError;

    const statusFilter = request.nextUrl.searchParams.get("status");

    const ownedCollegeSnapshot = await db
      .collection("colleges")
      .where("adminId", "==", authResult.context.user.id)
      .limit(1)
      .get();

    if (ownedCollegeSnapshot.empty) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ownedCollege = ownedCollegeSnapshot.docs[0].data();
    const normalizedCollegeName = normalizeCollegeName(
      ownedCollege.normalizedName || ownedCollege.name || ""
    );

    let query = db
      .collection("jobNotifications")
      .where("normalizedCollegeName", "==", normalizedCollegeName);

    if (statusFilter && ["pending", "approved", "rejected"].includes(statusFilter)) {
      query = query.where("status", "==", statusFilter);
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();

    const notifications = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();

        let jobPosting = null;
        if (data.jobPostingId) {
          const jobDoc = await db.collection("jobPostings").doc(data.jobPostingId).get();
          if (jobDoc.exists) {
            const jobData = jobDoc.data();
            jobPosting = {
              id: jobDoc.id,
              title: jobData?.title || "Untitled Position",
              description: jobData?.description || "",
              requirements: jobData?.requirements || [],
              skills: jobData?.skills || [],
              location: jobData?.location || "",
              salary: jobData?.salary || null,
            };
          }
        }

        let organization = null;
        if (data.organizationId) {
          const orgDoc = await db.collection("organizations").doc(data.organizationId).get();
          if (orgDoc.exists) {
            const orgData = orgDoc.data();
            organization = {
              id: orgDoc.id,
              name: orgData?.name || "Unknown Organization",
              email: orgData?.email || "",
              phone: orgData?.phone || "",
            };
          }
        }

        return {
          id: doc.id,
          jobPostingId: data.jobPostingId,
          normalizedCollegeName: data.normalizedCollegeName,
          organizationId: data.organizationId,
          status: data.status,
          type: "job_posting",
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          respondedAt: data.respondedAt?.toDate?.() || data.respondedAt || null,
          notes: data.notes || null,
          jobPosting,
          organization,
        };
      })
    );

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error("Error fetching job notifications:", error);
    return NextResponse.json({ error: "Failed to fetch job notifications" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const roleError = requireRole(authResult.context, ["organization"]);
    if (roleError) return roleError;

    const rawBody = await request.json();
    const parseResult = createJobNotificationSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { jobPostingId, collegeName, organizationId } = parseResult.data;

    const orgOwnershipError = await requireOrganizationOwnership(authResult.context, organizationId);
    if (orgOwnershipError) return orgOwnershipError;

    const jobDoc = await db.collection("jobPostings").doc(jobPostingId).get();
    if (!jobDoc.exists) {
      return NextResponse.json({ error: "Job posting not found" }, { status: 404 });
    }

    const jobData = jobDoc.data();
    if (jobData?.organizationId !== organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const normalizedCollegeName = normalizeCollegeName(collegeName);
    if (!normalizedCollegeName) {
      return NextResponse.json({ error: "Invalid college name" }, { status: 400 });
    }

    const collegeSnapshot = await db
      .collection("colleges")
      .where("normalizedName", "==", normalizedCollegeName)
      .limit(1)
      .get();

    if (collegeSnapshot.empty) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }

    const collegeId = collegeSnapshot.docs[0].id;

    const existingNotification = await db
      .collection("jobNotifications")
      .where("jobPostingId", "==", jobPostingId)
      .where("normalizedCollegeName", "==", normalizedCollegeName)
      .limit(1)
      .get();

    if (!existingNotification.empty) {
      return NextResponse.json(
        { error: "Notification already exists for this job and college" },
        { status: 409 }
      );
    }

    const notificationRef = await db.collection("jobNotifications").add({
      jobPostingId,
      collegeId,
      normalizedCollegeName,
      organizationId,
      status: "pending",
      type: "job_posting",
      createdAt: new Date(),
      respondedAt: null,
      createdBy: authResult.context.user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Job notification created successfully",
      notificationId: notificationRef.id,
    });
  } catch (error) {
    console.error("Error creating job notification:", error);
    return NextResponse.json({ error: "Failed to create job notification" }, { status: 500 });
  }
}

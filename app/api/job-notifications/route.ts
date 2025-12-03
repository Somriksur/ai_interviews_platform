import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { normalizeCollegeName } from '@/lib/services/college-name.service';

/**
 * GET /api/job-notifications
 * 
 * Fetches job notifications for a college using normalized college name
 * Query params:
 * - collegeName: The college name (will be normalized)
 * - status: Optional filter by status (pending, approved, rejected)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const collegeName = searchParams.get('collegeName');
    const statusFilter = searchParams.get('status');

    if (!collegeName) {
      return NextResponse.json(
        { error: 'College name is required' },
        { status: 400 }
      );
    }

    // Normalize the college name
    const normalizedCollegeName = normalizeCollegeName(collegeName);

    if (!normalizedCollegeName) {
      return NextResponse.json(
        { error: 'Invalid college name' },
        { status: 400 }
      );
    }

    // Build query
    let query = db
      .collection('jobNotifications')
      .where('normalizedCollegeName', '==', normalizedCollegeName);

    // Add status filter if provided
    if (statusFilter && ['pending', 'approved', 'rejected'].includes(statusFilter)) {
      query = query.where('status', '==', statusFilter);
    }

    // Execute query and order by creation date
    const snapshot = await query.orderBy('createdAt', 'desc').get();

    // Map notifications with job posting and organization details
    const notifications = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();

        // Fetch job posting details
        let jobPosting = null;
        if (data.jobPostingId) {
          const jobDoc = await db
            .collection('jobPostings')
            .doc(data.jobPostingId)
            .get();

          if (jobDoc.exists) {
            const jobData = jobDoc.data();
            jobPosting = {
              id: jobDoc.id,
              title: jobData?.title || 'Untitled Position',
              description: jobData?.description || '',
              requirements: jobData?.requirements || [],
              skills: jobData?.skills || [],
              location: jobData?.location || '',
              salary: jobData?.salary || null,
            };
          }
        }

        // Fetch organization details
        let organization = null;
        if (data.organizationId) {
          const orgDoc = await db
            .collection('organizations')
            .doc(data.organizationId)
            .get();

          if (orgDoc.exists) {
            const orgData = orgDoc.data();
            organization = {
              id: orgDoc.id,
              name: orgData?.name || 'Unknown Organization',
              email: orgData?.email || '',
              phone: orgData?.phone || '',
            };
          }
        }

        return {
          id: doc.id,
          jobPostingId: data.jobPostingId,
          normalizedCollegeName: data.normalizedCollegeName,
          organizationId: data.organizationId,
          status: data.status,
          type: 'job_posting',
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
    console.error('Error fetching job notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job notifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/job-notifications
 * 
 * Creates a new job notification for a college
 * Body:
 * - jobPostingId: The job posting ID
 * - collegeName: The college name (will be normalized)
 * - organizationId: The organization ID
 */
export async function POST(request: NextRequest) {
  try {
    const { jobPostingId, collegeName, organizationId } = await request.json();

    if (!jobPostingId || !collegeName || !organizationId) {
      return NextResponse.json(
        { error: 'Job posting ID, college name, and organization ID are required' },
        { status: 400 }
      );
    }

    // Normalize the college name
    const normalizedCollegeName = normalizeCollegeName(collegeName);

    if (!normalizedCollegeName) {
      return NextResponse.json(
        { error: 'Invalid college name' },
        { status: 400 }
      );
    }

    // Verify college exists
    const collegeSnapshot = await db
      .collection('colleges')
      .where('normalizedName', '==', normalizedCollegeName)
      .limit(1)
      .get();

    if (collegeSnapshot.empty) {
      return NextResponse.json(
        { error: 'College not found' },
        { status: 404 }
      );
    }

    const collegeId = collegeSnapshot.docs[0].id;

    // Check if notification already exists
    const existingNotification = await db
      .collection('jobNotifications')
      .where('jobPostingId', '==', jobPostingId)
      .where('normalizedCollegeName', '==', normalizedCollegeName)
      .limit(1)
      .get();

    if (!existingNotification.empty) {
      return NextResponse.json(
        { error: 'Notification already exists for this job and college' },
        { status: 409 }
      );
    }

    // Create notification
    const notificationRef = await db.collection('jobNotifications').add({
      jobPostingId,
      collegeId, // Keep for backward compatibility
      normalizedCollegeName,
      organizationId,
      status: 'pending',
      type: 'job_posting',
      createdAt: new Date(),
      respondedAt: null,
    });

    return NextResponse.json({
      success: true,
      message: 'Job notification created successfully',
      notificationId: notificationRef.id,
    });
  } catch (error) {
    console.error('Error creating job notification:', error);
    return NextResponse.json(
      { error: 'Failed to create job notification' },
      { status: 500 }
    );
  }
}

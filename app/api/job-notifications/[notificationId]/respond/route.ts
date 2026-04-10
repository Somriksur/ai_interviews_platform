import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db as db } from '@/firebase/admin';
import { getAuthContext } from '@/lib/security/auth-context';
import { requireRole } from '@/lib/security/guards';

const respondSchema = z
  .object({
    action: z.enum(['approve', 'reject']),
    notes: z.string().max(1000).optional(),
  })
  .strict();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const roleError = requireRole(authResult.context, ['college']);
    if (roleError) return roleError;

    const { notificationId } = await params;
    const rawBody = await request.json();
    const parseResult = respondSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const { action, notes } = parseResult.data;

    // Get notification
    const notificationDoc = await db
      .collection('jobNotifications')
      .doc(notificationId)
      .get();

    if (!notificationDoc.exists) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    const notificationData = notificationDoc.data();
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const ownedCollegeSnapshot = await db
      .collection('colleges')
      .where('adminId', '==', authResult.context.user.id)
      .limit(1)
      .get();

    if (ownedCollegeSnapshot.empty) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const ownedCollege = ownedCollegeSnapshot.docs[0].data();
    const ownedNormalizedCollegeName = (ownedCollege?.normalizedName || '').toLowerCase();
    const notificationCollege = (notificationData?.normalizedCollegeName || '').toLowerCase();

    if (!notificationCollege || notificationCollege !== ownedNormalizedCollegeName) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update notification status
    await db
      .collection('jobNotifications')
      .doc(notificationId)
      .update({
        status: newStatus,
        respondedAt: new Date(),
        notes: notes || null,
      });

    // Update job posting collegeApprovals map
    const jobDoc = await db
      .collection('jobPostings')
      .doc(notificationData?.jobPostingId)
      .get();

    if (jobDoc.exists) {
      const jobData = jobDoc.data();
      const collegeApprovals = jobData?.collegeApprovals || {};
      const normalizedCollegeName = notificationData?.normalizedCollegeName;

      if (normalizedCollegeName) {
        // Update the approval status for this college
        collegeApprovals[normalizedCollegeName] = {
          status: newStatus,
          respondedAt: new Date(),
          notes: notes || null,
        };

        await db
          .collection('jobPostings')
          .doc(notificationData?.jobPostingId)
          .update({
            collegeApprovals,
            updatedAt: new Date(),
          });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Job ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      status: newStatus,
    });
  } catch (error) {
    console.error('Error responding to notification:', error);
    return NextResponse.json(
      { error: 'Failed to respond to notification' },
      { status: 500 }
    );
  }
}

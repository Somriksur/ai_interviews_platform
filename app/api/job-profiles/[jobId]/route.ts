import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { getCurrentUser } from '@/lib/actions/auth.action';

/**
 * DELETE /api/job-profiles/[jobId]
 * Delete a job profile
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'organization') {
      console.error('DELETE job-profile: User not authorized or not organization role', { user });
      return NextResponse.json({ error: 'Unauthorized - must be organization user' }, { status: 401 });
    }

    const { jobId } = await params;

    // Get user's organization ID
    const orgSnapshot = await db
      .collection('organizations')
      .where('adminId', '==', user.id)
      .limit(1)
      .get();

    if (orgSnapshot.empty) {
      console.error('DELETE job-profile: No organization found for user', { userId: user.id });
      return NextResponse.json({ 
        error: 'Organization not found for this user' 
      }, { status: 404 });
    }

    const userOrgId = orgSnapshot.docs[0].id;

    // Get job posting to verify ownership
    const jobDoc = await db.collection('jobPostings').doc(jobId).get();
    
    if (!jobDoc.exists) {
      console.error('DELETE job-profile: Job not found', { jobId });
      return NextResponse.json({ error: 'Job posting not found' }, { status: 404 });
    }

    const jobData = jobDoc.data();
    
    console.log('DELETE job-profile: Checking ownership', {
      jobId,
      jobOrgId: jobData?.organizationId,
      userOrgId,
      userId: user.id,
    });
    
    // Verify the job belongs to the user's organization
    if (!jobData?.organizationId) {
      console.error('DELETE job-profile: Job has no organizationId', { jobId, jobData });
      return NextResponse.json({ error: 'Job data is invalid' }, { status: 500 });
    }
    
    if (jobData.organizationId !== userOrgId) {
      console.error('DELETE job-profile: Organization mismatch', {
        jobOrgId: jobData.organizationId,
        userOrgId,
      });
      return NextResponse.json({ 
        error: 'Forbidden - this job belongs to a different organization' 
      }, { status: 403 });
    }

    // Delete the job posting
    await db.collection('jobPostings').doc(jobId).delete();

    // Also delete related data (notifications, selections)
    // Delete job notifications
    const notificationsSnapshot = await db
      .collection('jobNotifications')
      .where('jobPostingId', '==', jobId)
      .get();

    const notificationDeletes = notificationsSnapshot.docs.map((doc) =>
      db.collection('jobNotifications').doc(doc.id).delete()
    );

    // Delete student selections
    const selectionsSnapshot = await db
      .collection('studentSelections')
      .where('jobPostingId', '==', jobId)
      .get();

    const selectionDeletes = selectionsSnapshot.docs.map((doc) =>
      db.collection('studentSelections').doc(doc.id).delete()
    );

    // Execute all deletes
    await Promise.all([...notificationDeletes, ...selectionDeletes]);

    console.log('✅ DELETE job-profile: Successfully deleted', {
      jobId,
      notificationsDeleted: notificationDeletes.length,
      selectionsDeleted: selectionDeletes.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Job profile deleted successfully',
    });
  } catch (error) {
    console.error('❌ DELETE job-profile: Error', error);
    return NextResponse.json(
      { error: 'Failed to delete job profile' },
      { status: 500 }
    );
  }
}

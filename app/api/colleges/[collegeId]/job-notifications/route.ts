import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { getAuthContext } from '@/lib/security/auth-context';
import { requireCollegeOwnership } from '@/lib/security/guards';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collegeId: string }> }
) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const { collegeId } = await params;
    const ownershipError = await requireCollegeOwnership(authResult.context, collegeId);
    if (ownershipError) return ownershipError;
    
    console.log(`📬 Fetching notifications for college: ${collegeId}`);

    // Fetch job posting notifications
    const jobNotificationsSnapshot = await db
      .collection('jobNotifications')
      .where('collegeId', '==', collegeId)
      .orderBy('createdAt', 'desc')
      .get();
    
    console.log(`📬 Found ${jobNotificationsSnapshot.size} job notifications`);

    // Fetch interview drive notifications
    const driveNotificationsSnapshot = await db
      .collection('driveNotifications')
      .where('collegeId', '==', collegeId)
      .orderBy('createdAt', 'desc')
      .get();
    
    console.log(`📬 Found ${driveNotificationsSnapshot.size} drive notifications`);

    // Process job notifications
    const jobNotifications = await Promise.all(
      jobNotificationsSnapshot.docs.map(async (doc) => {
        const notificationData = doc.data();
        
        // Get job posting details
        const jobDoc = await db
          .collection('jobPostings')
          .doc(notificationData.jobPostingId)
          .get();
        
        const jobData = jobDoc.exists ? jobDoc.data() : null;
        
        // Get organization details
        let orgData = null;
        if (notificationData.organizationId) {
          const orgDoc = await db
            .collection('organizations')
            .doc(notificationData.organizationId)
            .get();
          orgData = orgDoc.exists ? orgDoc.data() : null;
        }

        return {
          id: doc.id,
          type: 'job_posting' as const,
          status: notificationData.status,
          createdAt: notificationData.createdAt,
          respondedAt: notificationData.respondedAt,
          jobPosting: jobData ? {
            id: jobDoc.id,
            role: jobData.role || jobData.title || 'Job Opportunity',
            skills: jobData.skills || [],
            vacancies: jobData.vacancies || 0,
            salaryRange: jobData.salaryRange || { min: 0, max: 0, category: 'Not specified' },
            description: jobData.description || '',
          } : null,
          organization: orgData ? {
            id: notificationData.organizationId,
            name: orgData.name || 'Unknown Organization',
            email: orgData.email || '',
            phone: orgData.phone || '',
          } : {
            id: notificationData.organizationId || '',
            name: 'Unknown Organization',
            email: '',
            phone: '',
          },
        };
      })
    );

    // Process drive notifications
    const driveNotifications = await Promise.all(
      driveNotificationsSnapshot.docs.map(async (doc) => {
        const notificationData = doc.data();
        
        // Get interview drive details
        const driveDoc = await db
          .collection('interview_drives')
          .doc(notificationData.driveId)
          .get();
        
        const driveData = driveDoc.exists ? driveDoc.data() : null;
        
        // Get organization details
        let orgData = null;
        if (notificationData.organizationId) {
          const orgDoc = await db
            .collection('organizations')
            .doc(notificationData.organizationId)
            .get();
          orgData = orgDoc.exists ? orgDoc.data() : null;
        }

        return {
          id: doc.id,
          type: 'interview_drive' as const,
          status: notificationData.status,
          createdAt: notificationData.createdAt,
          respondedAt: notificationData.respondedAt,
          interviewDrive: driveData ? {
            id: driveDoc.id,
            name: driveData.name || 'Interview Drive',
            role: driveData.role || 'Position',
            description: driveData.description || '',
            interviewConfig: driveData.interviewConfig,
            questions: driveData.questions,
          } : {
            id: notificationData.driveId,
            name: 'Drive Unavailable',
            role: 'Position',
            description: 'This interview drive is no longer available',
          },
          organization: orgData ? {
            id: notificationData.organizationId,
            name: orgData.name || 'Unknown Organization',
            email: orgData.email || '',
            phone: orgData.phone || '',
          } : {
            id: notificationData.organizationId || '',
            name: 'Unknown Organization',
            email: '',
            phone: '',
          },
        };
      })
    );

    // Merge and sort all notifications by createdAt (newest first)
    const allNotifications = [
      ...jobNotifications,
      ...driveNotifications,
    ].sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate();
      const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate();
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({ notifications: allNotifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

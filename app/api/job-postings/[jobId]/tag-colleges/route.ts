import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { normalizeCollegeName } from '@/lib/services/college-name.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const body = await request.json();
    const { collegeNames, collegeIds } = body;

    // Support both collegeNames (new format) and collegeIds (legacy format)
    if ((!collegeNames || !Array.isArray(collegeNames) || collegeNames.length === 0) && 
        (!collegeIds || !Array.isArray(collegeIds) || collegeIds.length === 0)) {
      return NextResponse.json(
        { error: 'College names or IDs are required' },
        { status: 400 }
      );
    }

    // Get job posting
    const jobDoc = await db.collection('jobPostings').doc(jobId).get();
    
    if (!jobDoc.exists) {
      return NextResponse.json(
        { error: 'Job posting not found' },
        { status: 404 }
      );
    }

    const jobData = jobDoc.data();
    
    let normalizedCollegeNames: string[] = [];
    let collegeValidationPromises: Promise<{
      normalizedName: string;
      exists: boolean;
      collegeId: string | null;
    }>[] = [];

    // Handle collegeIds (legacy format)
    if (collegeIds && collegeIds.length > 0) {
      collegeValidationPromises = collegeIds.map(async (collegeId: string) => {
        const collegeDoc = await db.collection('colleges').doc(collegeId).get();
        
        if (!collegeDoc.exists) {
          return {
            normalizedName: '',
            exists: false,
            collegeId: null,
          };
        }

        const collegeData = collegeDoc.data();
        let normalizedName = collegeData?.normalizedName;

        // If normalizedName doesn't exist, create it from the college name
        if (!normalizedName && collegeData?.name) {
          normalizedName = normalizeCollegeName(collegeData.name);
          
          // Update the college document with the normalized name
          await collegeDoc.ref.update({
            normalizedName: normalizedName
          });
        }

        return {
          normalizedName: normalizedName || '',
          exists: !!normalizedName,
          collegeId: collegeId,
        };
      });
    } 
    // Handle collegeNames (new format)
    else if (collegeNames && collegeNames.length > 0) {
      // Normalize college names
      normalizedCollegeNames = collegeNames.map((name: string) => 
        normalizeCollegeName(name)
      );

      // Validate that colleges exist
      collegeValidationPromises = normalizedCollegeNames.map(async (normalizedName: string) => {
        const collegeSnapshot = await db
          .collection('colleges')
          .where('normalizedName', '==', normalizedName)
          .limit(1)
          .get();
        
        return {
          normalizedName,
          exists: !collegeSnapshot.empty,
          collegeId: collegeSnapshot.empty ? null : collegeSnapshot.docs[0].id,
        };
      });
    }

    const validationResults = await Promise.all(collegeValidationPromises);
    const invalidColleges = validationResults.filter(result => !result.exists);

    if (invalidColleges.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some colleges do not exist',
          invalidColleges: invalidColleges.map(c => c.normalizedName),
        },
        { status: 400 }
      );
    }

    // Extract normalized names from validation results
    normalizedCollegeNames = validationResults.map(r => r.normalizedName);

    // Get existing tagged colleges and approvals
    const existingTaggedColleges = jobData?.taggedColleges || [];
    const existingApprovals = jobData?.collegeApprovals || {};
    
    // Merge with existing tagged colleges (avoid duplicates)
    const updatedTaggedColleges = Array.from(new Set([...existingTaggedColleges, ...normalizedCollegeNames]));
    
    // Initialize approval status for new colleges
    const updatedApprovals = { ...existingApprovals };
    normalizedCollegeNames.forEach((normalizedName: string) => {
      if (!updatedApprovals[normalizedName]) {
        updatedApprovals[normalizedName] = {
          status: 'pending',
        };
      }
    });

    // Update job posting with tagged colleges and approvals
    await db.collection('jobPostings').doc(jobId).update({
      taggedColleges: updatedTaggedColleges,
      collegeApprovals: updatedApprovals,
      updatedAt: new Date(),
    });

    // Create notifications for each college
    const notificationPromises = validationResults.map(async (result) => {
      if (!result.exists || !result.collegeId) return;

      // Check if notification already exists
      const existingNotification = await db
        .collection('jobNotifications')
        .where('jobPostingId', '==', jobId)
        .where('normalizedCollegeName', '==', result.normalizedName)
        .limit(1)
        .get();

      if (existingNotification.empty) {
        return db.collection('jobNotifications').add({
          jobPostingId: jobId,
          collegeId: result.collegeId, // Keep for backward compatibility
          normalizedCollegeName: result.normalizedName,
          organizationId: jobData?.organizationId,
          status: 'pending',
          createdAt: new Date(),
        });
      }
    });

    await Promise.all(notificationPromises);

    return NextResponse.json({
      success: true,
      message: `Tagged ${normalizedCollegeNames.length} college(s) successfully`,
      taggedColleges: updatedTaggedColleges,
    });
  } catch (error) {
    console.error('Error tagging colleges:', error);
    return NextResponse.json(
      { error: 'Failed to tag colleges' },
      { status: 500 }
    );
  }
}

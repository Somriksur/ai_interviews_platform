import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { getCurrentUser } from '@/lib/actions/auth.action';

/**
 * GET /api/job-profiles
 * Get all job profiles for an organization
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'organization') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const snapshot = await db
      .collection('jobPostings')
      .where('organizationId', '==', organizationId)
      .orderBy('createdAt', 'desc')
      .get();

    const jobs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error fetching job profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job profiles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/job-profiles
 * Create a new job profile
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'organization') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      organizationId,
      title,
      company,
      description,
      requiredSkills,
      minimumScore,
      communicationRequirement,
      experienceLevel,
      salaryBand,
    } = body;

    // Validate required fields
    if (!organizationId || !title || !company) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create job posting
    const jobRef = await db.collection('jobPostings').add({
      organizationId,
      title,
      company,
      description: description || '',
      requiredSkills: requiredSkills || [],
      minimumScore: minimumScore || 60,
      communicationRequirement: communicationRequirement || 60,
      experienceLevel: experienceLevel || '0-2 years',
      salaryBand: salaryBand || {
        min: 300000,
        max: 500000,
        category: 'low',
      },
      status: 'active',
      taggedColleges: [],
      confirmedColleges: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      id: jobRef.id,
      jobId: jobRef.id,
      jobPostingId: jobRef.id,
    });
  } catch (error) {
    console.error('Error creating job profile:', error);
    return NextResponse.json(
      { error: 'Failed to create job profile' },
      { status: 500 }
    );
  }
}

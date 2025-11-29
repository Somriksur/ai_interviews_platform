import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const {
      organizationId,
      title,
      company,
      description,
      requiredSkills,
      experienceLevel,
      minimumScore,
      communicationRequirement,
      salaryBand,
    } = await request.json();

    if (!organizationId || !title || !company) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const jobRef = await adminDb.collection('job_profiles').add({
      organizationId,
      title,
      company,
      description: description || '',
      requiredSkills: requiredSkills || [],
      experienceLevel: experienceLevel || '0-2 years',
      minimumScore: minimumScore || 60,
      communicationRequirement: communicationRequirement || 60,
      salaryBand: salaryBand || { min: 300000, max: 500000, category: 'low' },
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      jobId: jobRef.id,
    });
  } catch (error) {
    console.error('Error creating job profile:', error);
    return NextResponse.json(
      { error: 'Failed to create job profile' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('organizationId');

    let query = adminDb.collection('job_profiles');
    
    if (orgId) {
      query = query.where('organizationId', '==', orgId) as any;
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();

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

import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const body = await request.json();
    
    const {
      role,
      skills,
      vacancies,
      salaryRange,
      description,
      taggedColleges,
    } = body;

    // Validate required fields
    if (!role || !skills || !vacancies || !salaryRange || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create job posting
    const jobPostingRef = await db.collection('jobPostings').add({
      organizationId: orgId,
      role,
      skills: Array.isArray(skills) ? skills : [skills],
      vacancies: Number(vacancies),
      salaryRange: {
        min: Number(salaryRange.min),
        max: Number(salaryRange.max),
        category: salaryRange.category || 'mid',
      },
      description,
      status: 'pending',
      taggedColleges: Array.isArray(taggedColleges) ? taggedColleges : [],
      confirmedColleges: [],
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      id: jobPostingRef.id,
      jobPostingId: jobPostingRef.id,
    });
  } catch (error) {
    console.error('Error creating job posting:', error);
    return NextResponse.json(
      { error: 'Failed to create job posting' },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;

    const snapshot = await db
      .collection('jobPostings')
      .where('organizationId', '==', orgId)
      .orderBy('createdAt', 'desc')
      .get();

    const jobPostings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ jobPostings });
  } catch (error) {
    console.error('Error fetching job postings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job postings' },
      { status: 500 }
    );
  }
}

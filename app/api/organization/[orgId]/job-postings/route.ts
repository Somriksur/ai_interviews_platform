import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { z } from "zod";
import { getAuthContext } from "@/lib/security/auth-context";
import { requireOrganizationOwnership } from "@/lib/security/guards";

const jobPostingCreateSchema = z
  .object({
    role: z.string().min(1).max(150),
    skills: z.union([z.string().min(1), z.array(z.string().min(1).max(64)).min(1).max(100)]),
    vacancies: z.coerce.number().int().min(1).max(100000),
    salaryRange: z
      .object({
        min: z.coerce.number().min(0),
        max: z.coerce.number().min(0),
        category: z.enum(["high", "mid", "low"]).optional(),
      })
      .strict(),
    description: z.string().min(1).max(5000),
    taggedColleges: z.array(z.string().min(1)).max(500).optional(),
  })
  .strict();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const { orgId } = await params;
    const accessError = await requireOrganizationOwnership(authResult.context, orgId);
    if (accessError) return accessError;
    const rawBody = await request.json();
    const parseResult = jobPostingCreateSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const body = parseResult.data;
    
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
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const { orgId } = await params;
    const accessError = await requireOrganizationOwnership(authResult.context, orgId);
    if (accessError) return accessError;

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

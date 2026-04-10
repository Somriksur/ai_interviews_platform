import { NextRequest, NextResponse } from 'next/server';
import { z } from "zod";
import { db as db } from '@/firebase/admin';
import { getAuthContext } from "@/lib/security/auth-context";
import { requireRole } from "@/lib/security/guards";

const createJobProfileSchema = z
  .object({
    organizationId: z.string().min(1),
    title: z.string().min(1).max(200),
    company: z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    requiredSkills: z.array(z.string()).optional(),
    minimumScore: z.number().min(0).max(100).optional(),
    communicationRequirement: z.number().min(0).max(100).optional(),
    experienceLevel: z.string().max(80).optional(),
    salaryBand: z
      .object({
        min: z.number(),
        max: z.number(),
        category: z.string(),
      })
      .optional(),
  })
  .strict();

/**
 * GET /api/job-profiles
 * Get all job profiles for an organization
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;
    const roleError = requireRole(authResult.context, ["organization"]);
    if (roleError) return roleError;

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const orgSnapshot = await db
      .collection("organizations")
      .where("adminId", "==", authResult.context.user.id)
      .limit(1)
      .get();
    if (orgSnapshot.empty || orgSnapshot.docs[0].id !== organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;
    const roleError = requireRole(authResult.context, ["organization"]);
    if (roleError) return roleError;

    const rawBody = await request.json();
    const parseResult = createJobProfileSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

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
    } = parseResult.data;

    const orgSnapshot = await db
      .collection("organizations")
      .where("adminId", "==", authResult.context.user.id)
      .limit(1)
      .get();
    if (orgSnapshot.empty || orgSnapshot.docs[0].id !== organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

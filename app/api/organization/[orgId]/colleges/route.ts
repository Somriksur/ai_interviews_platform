import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { normalizeCollegeName } from '@/lib/services/college-name.service';
import { z } from "zod";
import { getAuthContext } from "@/lib/security/auth-context";
import { requireOrganizationOwnership } from "@/lib/security/guards";

const createCollegeSchema = z
  .object({
    name: z.string().min(3).max(200),
    location: z.string().max(255).optional(),
    contactEmail: z.string().email(),
    contactPhone: z.string().max(32).optional(),
    adminId: z.string().min(1).optional(),
  })
  .strict();

export async function POST(request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const { orgId } = await params;
    const accessError = await requireOrganizationOwnership(authResult.context, orgId);
    if (accessError) return accessError;
    const rawBody = await request.json();
    const parseResult = createCollegeSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const { name, location, contactEmail, contactPhone, adminId } = parseResult.data;

    if (!name || !contactEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Trim and normalize the college name
    const trimmedName = name.trim();
    const normalizedName = normalizeCollegeName(trimmedName);

    // Check if college with this normalized name already exists
    const existingCollege = await db
      .collection('colleges')
      .where('normalizedName', '==', normalizedName)
      .limit(1)
      .get();

    if (!existingCollege.empty) {
      return NextResponse.json(
        { error: `College with name "${trimmedName}" already exists` },
        { status: 409 }
      );
    }

    const collegeRef = await db.collection('colleges').add({
      organizationId: orgId,
      name: trimmedName, // Store trimmed name with original casing
      normalizedName, // Store normalized name for queries
      location: location?.trim() || '',
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone?.trim() || '',
      adminId: adminId || '',
      createdAt: new Date(),
      stats: {
        totalStudents: 0,
        interviewsCompleted: 0,
        averagePlacementScore: 0,
      },
    });

    return NextResponse.json({
      success: true,
      id: collegeRef.id,
      collegeId: collegeRef.id,
    });
  } catch (error) {
    console.error('Error creating college:', error);
    return NextResponse.json(
      { error: 'Failed to create college' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const authResult = await getAuthContext(_request);
    if (!authResult.ok) return authResult.response;

    const { orgId } = await params;
    const accessError = await requireOrganizationOwnership(authResult.context, orgId);
    if (accessError) return accessError;

    console.log(`🔍 Fetching colleges for organization: ${orgId}`);
    
    const snapshot = await db
      .collection('colleges')
      .where('organizationId', '==', orgId)
      .orderBy('createdAt', 'desc')
      .get();

    const colleges = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`✅ Found ${colleges.length} colleges:`, colleges.map(c => ({ id: c.id, name: c.name })));

    return NextResponse.json({ colleges });
  } catch (error) {
    console.error('❌ Error fetching colleges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch colleges' },
      { status: 500 }
    );
  }
}

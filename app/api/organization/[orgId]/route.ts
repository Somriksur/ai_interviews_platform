import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { z } from "zod";
import { getAuthContext } from "@/lib/security/auth-context";
import { requireOrganizationOwnership } from "@/lib/security/guards";

const orgUpdateSchema = z
  .object({
    name: z.string().min(1).max(150).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(32).optional(),
    address: z.string().max(300).optional(),
    settings: z
      .object({
        allowBulkInterviews: z.boolean().optional(),
        maxColleges: z.number().int().min(1).max(500).optional(),
        maxStudentsPerDrive: z.number().int().min(1).max(10000).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export async function GET(_request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const authResult = await getAuthContext(_request);
    if (!authResult.ok) return authResult.response;

    const { orgId } = await params;
    const accessError = await requireOrganizationOwnership(authResult.context, orgId);
    if (accessError) return accessError;

    const orgDoc = await db.collection('organizations').doc(orgId).get();

    if (!orgDoc.exists) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: orgDoc.id,
      ...orgDoc.data(),
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const { orgId } = await params;
    const accessError = await requireOrganizationOwnership(authResult.context, orgId);
    if (accessError) return accessError;

    const rawBody = await request.json();
    const parseResult = orgUpdateSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const updates = parseResult.data;

    await db.collection('organizations').doc(orgId).update({
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.email !== undefined ? { email: updates.email.toLowerCase() } : {}),
      ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
      ...(updates.address !== undefined ? { address: updates.address } : {}),
      ...(updates.settings !== undefined ? { settings: updates.settings } : {}),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}

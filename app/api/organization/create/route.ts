import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { z } from "zod";
import { getAuthContext } from "@/lib/security/auth-context";
import { requireRole } from "@/lib/security/guards";

const createOrganizationSchema = z
  .object({
    name: z.string().min(1).max(200),
    email: z.string().email(),
    phone: z.string().max(32).optional(),
    address: z.string().max(300).optional(),
    adminId: z.string().min(1),
  })
  .strict();

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;
    const roleError = requireRole(authResult.context, ["organization", "college"]);
    if (roleError) return roleError;
    const rawBody = await request.json();
    const parseResult = createOrganizationSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, phone, address, adminId } = parseResult.data;
    if (adminId !== authResult.context.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!name || !email || !adminId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const orgRef = await db.collection('organizations').add({
      name,
      email,
      phone: phone || '',
      address: address || '',
      adminId,
      createdAt: new Date(),
      settings: {
        allowBulkInterviews: true,
        maxColleges: 50,
        maxStudentsPerDrive: 1000,
      },
    });

    return NextResponse.json({
      success: true,
      id: orgRef.id,
      organizationId: orgRef.id,
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}

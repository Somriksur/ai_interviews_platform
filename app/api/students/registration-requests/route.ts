import { NextRequest, NextResponse } from 'next/server';
import { z } from "zod";
import { db } from '@/firebase/admin';
import { normalizeCollegeName } from '@/lib/services/college-name.service';
import { validateRegistrationRequest } from '@/types/registration-request';
import { notifyCollegeOfRegistrationRequest } from '@/lib/services/notification.service';
import { getAuthContext } from "@/lib/security/auth-context";
import { requireRole } from "@/lib/security/guards";

const createRegistrationRequestSchema = z
  .object({
    studentName: z.string().min(1).max(120),
    email: z.string().email(),
    collegeName: z.string().min(1).max(200),
    rollNumber: z.string().max(64).optional(),
    branch: z.string().max(120).optional(),
    year: z.number().int().min(1).max(8).optional(),
  })
  .strict();

/**
 * POST /api/students/registration-requests
 * Create a new student registration request
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;
    const roleError = requireRole(authResult.context, ["student", "candidate"]);
    if (roleError) return roleError;

    const rawBody = await request.json();
    const parseResult = createRegistrationRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const { studentName, email, collegeName, rollNumber, branch, year } = parseResult.data;
    if (authResult.context.user.email.toLowerCase() !== String(email || "").toLowerCase()) {
      return NextResponse.json({ error: "Forbidden: email must match authenticated user" }, { status: 403 });
    }

    // Validate input
    const validation = validateRegistrationRequest({
      studentName,
      email,
      collegeName,
      rollNumber,
      branch,
      year,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Normalize college name
    const normalizedCollegeName = normalizeCollegeName(collegeName);

    // Check if college exists
    const collegeSnapshot = await db
      .collection('colleges')
      .where('normalizedName', '==', normalizedCollegeName)
      .limit(1)
      .get();

    if (collegeSnapshot.empty) {
      return NextResponse.json(
        { error: `College with name '${collegeName}' not found` },
        { status: 404 }
      );
    }

    const collegeDoc = collegeSnapshot.docs[0];
    const collegeData = collegeDoc.data();

    // Check for duplicate registration request
    const duplicateSnapshot = await db
      .collection('registration_requests')
      .where('email', '==', email.toLowerCase())
      .where('normalizedCollegeName', '==', normalizedCollegeName)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!duplicateSnapshot.empty) {
      return NextResponse.json(
        { error: 'A pending registration request already exists for this email and college' },
        { status: 409 }
      );
    }

    // Check if student already exists
    const studentSnapshot = await db
      .collection('students')
      .where('email', '==', email.toLowerCase())
      .where('normalizedCollegeName', '==', normalizedCollegeName)
      .limit(1)
      .get();

    if (!studentSnapshot.empty) {
      return NextResponse.json(
        { error: 'A student with this email already exists at this college' },
        { status: 409 }
      );
    }

    // Create registration request
    const registrationRequest = {
      studentName: studentName.trim(),
      email: email.toLowerCase(),
      collegeName: collegeData.name, // Use original casing from college
      normalizedCollegeName,
      collegeId: collegeDoc.id,
      organizationId: collegeData.organizationId,
      rollNumber: rollNumber?.trim(),
      branch: branch?.trim(),
      year,
      status: 'pending',
      submittedAt: new Date(),
    };

    const docRef = await db.collection('registration_requests').add(registrationRequest);

    // Create notification for college admin
    try {
      await notifyCollegeOfRegistrationRequest({
        collegeId: collegeDoc.id,
        requestId: docRef.id,
        studentName: studentName.trim(),
        studentEmail: email.toLowerCase(),
        collegeName: collegeData.name,
      });
      console.log(`✅ Notification sent to college ${collegeDoc.id} for registration request ${docRef.id}`);
    } catch (notificationError) {
      console.error('⚠️ Failed to send notification to college:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json(
      {
        success: true,
        requestId: docRef.id,
        message: 'Registration request submitted successfully. Awaiting college approval.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating registration request:', error);
    return NextResponse.json(
      { error: 'Failed to create registration request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/students/registration-requests?email=...
 * Get registration requests by email
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    if (!email || authResult.context.user.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const snapshot = await db
      .collection('registration_requests')
      .where('email', '==', email.toLowerCase())
      .get();

    const requests = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt?.toDate?.() || data.submittedAt,
        reviewedAt: data.reviewedAt?.toDate?.() || data.reviewedAt,
      };
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching registration requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registration requests' },
      { status: 500 }
    );
  }
}

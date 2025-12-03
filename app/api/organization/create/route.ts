import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, address, adminId } = await request.json();

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

import { NextRequest, NextResponse } from 'next/server';
import { db as adminDb } from '@/firebase/admin';

export async function POST(request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    const { name, location, contactEmail, contactPhone, adminId } = await request.json();

    if (!name || !contactEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const collegeRef = await adminDb.collection('colleges').add({
      organizationId: orgId,
      name,
      location: location || '',
      contactEmail,
      contactPhone: contactPhone || '',
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
    const { orgId } = await params;
    const snapshot = await adminDb
      .collection('colleges')
      .where('organizationId', '==', orgId)
      .orderBy('createdAt', 'desc')
      .get();

    const colleges = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ colleges });
  } catch (error) {
    console.error('Error fetching colleges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch colleges' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db as adminDb } from '@/firebase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const { name, description, role, colleges } = await request.json();

    if (!name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const driveRef = await adminDb.collection('interview_drives').add({
      organizationId: params.orgId,
      name,
      description: description || '',
      role,
      colleges: colleges || [],
      taggedStudents: [],
      status: 'pending',
      createdAt: new Date(),
      completedAt: null,
      stats: {
        totalStudents: 0,
        completedInterviews: 0,
        averageScore: 0,
      },
    });

    return NextResponse.json({
      success: true,
      driveId: driveRef.id,
    });
  } catch (error) {
    console.error('Error creating interview drive:', error);
    return NextResponse.json(
      { error: 'Failed to create interview drive' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const snapshot = await adminDb
      .collection('interview_drives')
      .where('organizationId', '==', params.orgId)
      .orderBy('createdAt', 'desc')
      .get();

    const drives = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ drives });
  } catch (error) {
    console.error('Error fetching interview drives:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview drives' },
      { status: 500 }
    );
  }
}

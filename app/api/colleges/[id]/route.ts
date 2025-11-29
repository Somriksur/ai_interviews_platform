import { NextRequest, NextResponse } from 'next/server';
import { db as adminDb } from '@/firebase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const collegeDoc = await adminDb.collection('colleges').doc(params.id).get();

    if (!collegeDoc.exists) {
      return NextResponse.json(
        { error: 'College not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: collegeDoc.id,
      ...collegeDoc.data(),
    });
  } catch (error) {
    console.error('Error fetching college:', error);
    return NextResponse.json(
      { error: 'Failed to fetch college' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();

    await adminDb.collection('colleges').doc(params.id).update({
      ...updates,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating college:', error);
    return NextResponse.json(
      { error: 'Failed to update college' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await adminDb.collection('colleges').doc(params.id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting college:', error);
    return NextResponse.json(
      { error: 'Failed to delete college' },
      { status: 500 }
    );
  }
}

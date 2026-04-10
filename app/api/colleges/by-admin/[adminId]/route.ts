import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { getAuthContext } from "@/lib/security/auth-context";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const { adminId } = await params;
    if (adminId !== authResult.context.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    // Find college by adminId
    const snapshot = await db
      .collection('colleges')
      .where('adminId', '==', adminId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'College not found' },
        { status: 404 }
      );
    }

    const doc = snapshot.docs[0];
    const college = {
      id: doc.id,
      ...doc.data(),
    };

    return NextResponse.json(college);
  } catch (error) {
    console.error('Error fetching college:', error);
    return NextResponse.json(
      { error: 'Failed to fetch college' },
      { status: 500 }
    );
  }
}

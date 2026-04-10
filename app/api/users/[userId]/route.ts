import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { getAuthContext } from "@/lib/security/auth-context";

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const { userId } = await params;
    if (authResult.context.user.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: userDoc.id,
      ...userDoc.data(),
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

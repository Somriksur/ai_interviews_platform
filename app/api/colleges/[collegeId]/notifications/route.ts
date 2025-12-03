import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { getCurrentUser } from '@/lib/actions/auth.action';

/**
 * GET /api/colleges/[collegeId]/notifications
 * Get all notifications for a college
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collegeId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'college') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collegeId } = await params;
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type');

    // Build query
    let query = db.collection('college_notifications').where('collegeId', '==', collegeId);

    if (unreadOnly) {
      query = query.where('read', '==', false);
    }

    if (type) {
      query = query.where('type', '==', type);
    }

    const snapshot = await query.get();

    const notifications = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          readAt: data.readAt?.toDate?.() || data.readAt,
        };
      })
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.getTime?.() || 0;
        const bTime = b.createdAt?.getTime?.() || 0;
        return bTime - aTime; // Most recent first
      });

    const unreadCount = notifications.filter((n: any) => !n.read).length;

    return NextResponse.json({
      notifications,
      total: notifications.length,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching college notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

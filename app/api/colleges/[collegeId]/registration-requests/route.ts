import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { getCurrentUser } from '@/lib/actions/auth.action';

/**
 * GET /api/colleges/[collegeId]/registration-requests
 * Get registration requests for a college
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
    const status = searchParams.get('status') || 'pending';

    // Verify user has access to this college
    const collegeDoc = await db.collection('colleges').doc(collegeId).get();

    if (!collegeDoc.exists) {
      return NextResponse.json(
        { error: 'College not found' },
        { status: 404 }
      );
    }

    const collegeData = collegeDoc.data();

    if (collegeData?.adminId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have access to this college' },
        { status: 403 }
      );
    }

    // Get registration requests
    let query = db
      .collection('registration_requests')
      .where('collegeId', '==', collegeId);

    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();

    const requests = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate?.() || data.submittedAt,
          reviewedAt: data.reviewedAt?.toDate?.() || data.reviewedAt,
        };
      })
      .sort((a: any, b: any) => {
        const aTime = a.submittedAt?.getTime?.() || 0;
        const bTime = b.submittedAt?.getTime?.() || 0;
        return bTime - aTime; // Most recent first
      });

    const stats = {
      total: requests.length,
      pending: requests.filter((r: any) => r.status === 'pending').length,
      approved: requests.filter((r: any) => r.status === 'approved').length,
      rejected: requests.filter((r: any) => r.status === 'rejected').length,
    };

    return NextResponse.json({
      requests,
      stats,
    });
  } catch (error) {
    console.error('Error fetching registration requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registration requests' },
      { status: 500 }
    );
  }
}

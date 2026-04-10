import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import {
  normalizeCollegeName,
  matchesSearchQuery,
  sortByRelevance,
  type College,
} from '@/lib/services/college-name.service';
import { getAuthContext } from '@/lib/security/auth-context';
import { requireRole } from '@/lib/security/guards';

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;
    const roleError = requireRole(authResult.context, ["organization"]);
    if (roleError) return roleError;

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Get all colleges
    const snapshot = await db.collection('colleges').get();

    // Map to College type
    const allColleges: College[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        normalizedName: data.normalizedName || normalizeCollegeName(data.name || ''),
        organizationId: data.organizationId || '',
        location: data.location || '',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        adminId: data.adminId || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        stats: data.stats || {
          totalStudents: 0,
          pendingRegistrations: 0,
          interviewsCompleted: 0,
          averagePlacementScore: 0,
        },
      };
    });

    // Filter colleges using case-insensitive matching
    const matchingColleges = allColleges.filter((college) =>
      matchesSearchQuery(college.name, query)
    );

    // Sort by relevance (exact matches first, then partial matches)
    const sortedColleges = sortByRelevance(matchingColleges, query);

    // Limit to top 10 results
    const results = sortedColleges.slice(0, 10);

    return NextResponse.json({ colleges: results });
  } catch (error) {
    console.error('Error searching colleges:', error);
    return NextResponse.json(
      { error: 'Failed to search colleges' },
      { status: 500 }
    );
  }
}

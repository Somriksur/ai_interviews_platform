import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { getAuthContext } from "@/lib/security/auth-context";
import { requireOrganizationOwnership } from "@/lib/security/guards";

/**
 * GET /api/organization/[orgId]/students
 * Get all students from colleges associated with this organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const { orgId } = await params;
    const accessError = await requireOrganizationOwnership(authResult.context, orgId);
    if (accessError) return accessError;

    const searchParams = request.nextUrl.searchParams;
    
    // Get filter parameters
    const collegeId = searchParams.get('collegeId');
    const search = searchParams.get('search');

    // First, get all colleges associated with this organization
    const collegesSnapshot = await db
      .collection('colleges')
      .where('organizationId', '==', orgId)
      .get();

    if (collegesSnapshot.empty) {
      return NextResponse.json({ students: [], total: 0 });
    }

    const collegeIds = collegesSnapshot.docs.map(doc => doc.id);

    // Build query for students
    let studentsQuery = db.collection('students');

    // If specific college filter is provided
    if (collegeId && collegeIds.includes(collegeId)) {
      studentsQuery = studentsQuery.where('collegeId', '==', collegeId) as any;
    } else {
      // Get students from all colleges
      studentsQuery = studentsQuery.where('collegeId', 'in', collegeIds.slice(0, 10)) as any;
    }

    const studentsSnapshot = await studentsQuery.get();

    // Get students with college details
    const students = await Promise.all(
      studentsSnapshot.docs.map(async (doc) => {
        const studentData = doc.data();
        
        // Get college details
        let collegeName = 'Unknown College';
        if (studentData.collegeId) {
          const collegeDoc = await db
            .collection('colleges')
            .doc(studentData.collegeId)
            .get();
          
          if (collegeDoc.exists) {
            collegeName = collegeDoc.data()?.name || 'Unknown College';
          }
        }

        // Apply search filter if provided
        if (search) {
          const searchLower = search.toLowerCase();
          const matchesSearch = 
            studentData.name?.toLowerCase().includes(searchLower) ||
            studentData.email?.toLowerCase().includes(searchLower) ||
            studentData.rollNumber?.toLowerCase().includes(searchLower) ||
            collegeName.toLowerCase().includes(searchLower);
          
          if (!matchesSearch) {
            return null;
          }
        }

        return {
          id: doc.id,
          ...studentData,
          collegeName,
        };
      })
    );

    // Filter out null values (from search filtering)
    const filteredStudents = students.filter(student => student !== null);

    return NextResponse.json({
      students: filteredStudents,
      total: filteredStudents.length,
    });
  } catch (error) {
    console.error('Error fetching organization students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

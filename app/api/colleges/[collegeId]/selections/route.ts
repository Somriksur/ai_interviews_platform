import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { getCurrentUser } from '@/lib/actions/auth.action';

/**
 * GET /api/colleges/[collegeId]/selections
 * Get all student selections for a college
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ collegeId: string }> }
) {
  try {
    const user = await getCurrentUser();
    console.log('🔍 User:', user?.email, 'Role:', user?.role);
    
    if (!user || user.role !== 'college') {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collegeId } = await params;
    console.log('📋 Fetching job selections for college:', collegeId);

    // Get all selections for this college
    const selectionsSnapshot = await db
      .collection('studentSelections')
      .where('collegeId', '==', collegeId)
      .get();

    console.log('📊 Found selections:', selectionsSnapshot.size);

    // Sort by selectedAt in memory
    const selections = selectionsSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a: any, b: any) => {
        const aTime = a.selectedAt?.toMillis?.() || 0;
        const bTime = b.selectedAt?.toMillis?.() || 0;
        return bTime - aTime; // Descending order
      });

    // Get student details
    const studentIds = [...new Set(selections.map((s: any) => s.studentId))];
    console.log('👥 Fetching', studentIds.length, 'students');
    
    const studentsPromises = studentIds.map(async (studentId) => {
      const studentDoc = await db.collection('students').doc(studentId).get();
      if (!studentDoc.exists) {
        console.warn('⚠️ Student not found:', studentId);
      }
      return {
        id: studentId,
        ...studentDoc.data(),
      };
    });

    const students = await Promise.all(studentsPromises);

    // Get job posting details
    const jobIds = [...new Set(selections.map((s: any) => s.jobPostingId))];
    console.log('💼 Fetching', jobIds.length, 'job postings');
    
    const jobsPromises = jobIds.map(async (jobId) => {
      const jobDoc = await db.collection('jobPostings').doc(jobId).get();
      if (!jobDoc.exists) {
        console.warn('⚠️ Job posting not found:', jobId);
      }
      return {
        id: jobId,
        ...jobDoc.data(),
      };
    });

    const jobs = await Promise.all(jobsPromises);

    // Group selections by status
    const selectedStudents = selections.filter((s: any) => s.status === 'select');
    const shortlistedStudents = selections.filter((s: any) => s.status === 'shortlist');
    const rejectedStudents = selections.filter((s: any) => s.status === 'reject');

    const summary = {
      total: selections.length,
      selected: selectedStudents.length,
      shortlisted: shortlistedStudents.length,
      rejected: rejectedStudents.length,
    };

    console.log('✅ Returning data:', summary);

    return NextResponse.json({
      selections,
      students,
      jobs,
      summary,
      selectedStudents,
      shortlistedStudents,
      rejectedStudents,
    });
  } catch (error: any) {
    console.error('❌ Error fetching selections:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Failed to fetch selections', details: error.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db as adminDb } from '@/firebase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { driveId: string } }
) {
  try {
    // Get drive details
    const driveDoc = await adminDb.collection('interview_drives').doc(params.driveId).get();
    
    if (!driveDoc.exists) {
      return NextResponse.json(
        { error: 'Interview drive not found' },
        { status: 404 }
      );
    }

    const driveData = driveDoc.data();

    // Get all placement reports for this drive
    const reportsSnapshot = await adminDb
      .collection('placement_reports')
      .where('driveId', '==', params.driveId)
      .get();

    if (reportsSnapshot.empty) {
      return NextResponse.json(
        { error: 'No reports found. Generate reports first.' },
        { status: 400 }
      );
    }

    // Get all job profiles for this organization
    const jobsSnapshot = await adminDb
      .collection('job_profiles')
      .where('organizationId', '==', driveData?.organizationId)
      .get();

    const jobs = jobsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const matchResults: string[] = [];

    // Match each student with jobs
    for (const reportDoc of reportsSnapshot.docs) {
      const reportData = reportDoc.data();
      
      // Get student details
      const studentDoc = await adminDb.collection('students').doc(reportData.studentId).get();
      const studentData = studentDoc.data();

      if (!studentData) continue;

      const matches = matchStudentToJobs(
        {
          skills: studentData.skills || [],
          overallScore: reportData.overallScore || 0,
          communicationRating: reportData.communicationRating || 0,
        },
        jobs
      );

      // Save matches
      const matchRef = await adminDb.collection('student_job_matches').add({
        studentId: reportData.studentId,
        driveId: params.driveId,
        matches: matches.slice(0, 5), // Top 5 matches
        recommendedCategory: reportData.salaryBand,
        generatedAt: new Date(),
      });

      // Update report with recommended jobs
      await adminDb.collection('placement_reports').doc(reportDoc.id).update({
        recommendedJobs: matches.slice(0, 5).map((m: any) => m.jobId),
      });

      matchResults.push(matchRef.id);
    }

    return NextResponse.json({
      success: true,
      matchesGenerated: matchResults.length,
      matchIds: matchResults,
    });
  } catch (error) {
    console.error('Error matching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to match jobs' },
      { status: 500 }
    );
  }
}

function matchStudentToJobs(student: any, jobs: any[]) {
  return jobs
    .map((job) => {
      // Calculate skill match
      const studentSkills = student.skills || [];
      const requiredSkills = job.requiredSkills || [];
      const matchingSkills = studentSkills.filter((skill: string) =>
        requiredSkills.some((req: string) => 
          req.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(req.toLowerCase())
        )
      );
      const skillMatch = requiredSkills.length > 0
        ? (matchingSkills.length / requiredSkills.length) * 100
        : 50;

      // Calculate score match
      const scoreMatch = student.overallScore >= job.minimumScore ? 100 : 
        (student.overallScore / job.minimumScore) * 100;

      // Calculate communication match
      const commMatch = student.communicationRating >= job.communicationRequirement ? 100 :
        (student.communicationRating / job.communicationRequirement) * 100;

      // Weighted matching score
      const matchScore = (
        skillMatch * 0.5 +
        scoreMatch * 0.3 +
        commMatch * 0.2
      );

      const reasons = [];
      if (skillMatch > 70) reasons.push('Strong skill match');
      if (scoreMatch > 90) reasons.push('Exceeds minimum score');
      if (commMatch > 80) reasons.push('Excellent communication');

      return {
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        matchScore: Math.round(matchScore),
        salaryBand: job.salaryBand?.category || 'medium',
        reasons,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

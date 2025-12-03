/**
 * Student Job Categorization Service
 * Matches student performance with job requirements and determines LPA fit
 */

interface StudentReport {
  technicalScore: number;
  communicationRating: number;
  overallScore: number;
  skillInsights: {
    technical: string[];
    communication: string[];
    problemSolving: string[];
    leadership: string[];
  };
}

interface JobRequirement {
  id: string;
  role: string;
  skills: string[];
  salaryRange: {
    min: number;
    max: number;
    category: 'high' | 'mid' | 'low';
  };
  minScore?: number;
}

interface JobMatch {
  jobId: string;
  role: string;
  matchScore: number;
  skillMatchPercentage: number;
  recommendedLPA: string;
  reasons: string[];
  salaryRange: {
    min: number;
    max: number;
  };
}

/**
 * Categorize student into LPA bands based on job readiness score
 */
export function categorizeLPA(jobReadinessScore: number): string {
  if (jobReadinessScore >= 85) {
    return 'High-Range Package (8+ LPA)';
  } else if (jobReadinessScore >= 65) {
    return 'Mid-Range Package (4-8 LPA)';
  } else {
    return 'Entry-Level Package (2-4 LPA)';
  }
}

/**
 * Get salary band from job readiness score
 */
export function getSalaryBand(jobReadinessScore: number): 'high' | 'medium' | 'low' {
  if (jobReadinessScore >= 85) return 'high';
  if (jobReadinessScore >= 65) return 'medium';
  return 'low';
}

/**
 * Calculate skill match score between student and job
 */
export function calculateSkillMatch(
  studentSkills: string[],
  requiredSkills: string[]
): number {
  if (requiredSkills.length === 0) return 100;

  const normalizedStudentSkills = studentSkills.map(s => s.toLowerCase().trim());
  const normalizedRequiredSkills = requiredSkills.map(s => s.toLowerCase().trim());

  let matchCount = 0;
  for (const requiredSkill of normalizedRequiredSkills) {
    // Check for exact match or partial match
    const hasMatch = normalizedStudentSkills.some(studentSkill =>
      studentSkill.includes(requiredSkill) || requiredSkill.includes(studentSkill)
    );
    if (hasMatch) {
      matchCount++;
    }
  }

  return Math.round((matchCount / requiredSkills.length) * 100);
}

/**
 * Calculate overall job match score
 */
export function calculateJobMatchScore(
  report: StudentReport,
  job: JobRequirement
): number {
  // Extract all student skills
  const allStudentSkills = [
    ...report.skillInsights.technical,
    ...report.skillInsights.problemSolving,
  ];

  // Calculate skill match
  const skillMatch = calculateSkillMatch(allStudentSkills, job.skills);

  // Weight factors
  const weights = {
    technicalScore: 0.4,
    skillMatch: 0.3,
    communicationScore: 0.2,
    overallScore: 0.1,
  };

  // Calculate weighted match score
  const matchScore = Math.round(
    report.technicalScore * weights.technicalScore +
    skillMatch * weights.skillMatch +
    report.communicationRating * weights.communicationScore +
    report.overallScore * weights.overallScore
  );

  return Math.min(matchScore, 100);
}

/**
 * Determine recommended LPA based on job match and student performance
 */
export function determineRecommendedLPA(
  matchScore: number,
  jobSalaryRange: { min: number; max: number }
): string {
  const { min, max } = jobSalaryRange;
  
  if (matchScore >= 85) {
    // High match - recommend upper range
    const recommendedSalary = Math.round(max / 100000);
    return `${recommendedSalary}+ LPA`;
  } else if (matchScore >= 65) {
    // Medium match - recommend mid range
    const recommendedSalary = Math.round((min + max) / 2 / 100000);
    return `${recommendedSalary} LPA`;
  } else {
    // Lower match - recommend lower range
    const recommendedSalary = Math.round(min / 100000);
    return `${recommendedSalary} LPA`;
  }
}

/**
 * Generate match reasons
 */
export function generateMatchReasons(
  report: StudentReport,
  _job: JobRequirement,
  matchScore: number,
  skillMatchPercentage: number
): string[] {
  const reasons: string[] = [];

  // Technical score reason
  if (report.technicalScore >= 80) {
    reasons.push(`Strong technical skills (${report.technicalScore}/100)`);
  } else if (report.technicalScore >= 60) {
    reasons.push(`Good technical foundation (${report.technicalScore}/100)`);
  }

  // Skill match reason
  if (skillMatchPercentage >= 70) {
    reasons.push(`${skillMatchPercentage}% skill match with job requirements`);
  } else if (skillMatchPercentage >= 40) {
    reasons.push(`Partial skill match (${skillMatchPercentage}%)`);
  }

  // Communication reason
  if (report.communicationRating >= 75) {
    reasons.push(`Excellent communication skills (${report.communicationRating}/100)`);
  }

  // Overall performance
  if (matchScore >= 80) {
    reasons.push('Highly recommended candidate');
  } else if (matchScore >= 60) {
    reasons.push('Suitable candidate with growth potential');
  } else {
    reasons.push('May require additional training');
  }

  return reasons;
}

/**
 * Match student with jobs and return recommendations
 */
export function matchStudentWithJobs(
  report: StudentReport,
  availableJobs: JobRequirement[]
): JobMatch[] {
  const matches: JobMatch[] = [];

  for (const job of availableJobs) {
    // Calculate match score
    const matchScore = calculateJobMatchScore(report, job);

    // Check if student meets minimum requirements
    const minScore = job.minScore || 50;
    if (matchScore < minScore) {
      continue; // Skip jobs where student doesn't meet minimum
    }

    // Calculate skill match percentage
    const allStudentSkills = [
      ...report.skillInsights.technical,
      ...report.skillInsights.problemSolving,
    ];
    const skillMatchPercentage = calculateSkillMatch(allStudentSkills, job.skills);

    // Determine recommended LPA
    const recommendedLPA = determineRecommendedLPA(matchScore, job.salaryRange);

    // Generate reasons
    const reasons = generateMatchReasons(report, job, matchScore, skillMatchPercentage);

    matches.push({
      jobId: job.id,
      role: job.role,
      matchScore,
      skillMatchPercentage,
      recommendedLPA,
      reasons,
      salaryRange: job.salaryRange,
    });
  }

  // Sort by match score (highest first)
  matches.sort((a, b) => b.matchScore - a.matchScore);

  return matches;
}

/**
 * Categorize students by LPA bands
 */
export function categorizeStudentsByLPA(
  reports: Array<StudentReport & { studentId: string; studentName: string }>
): {
  high: Array<{ studentId: string; studentName: string; score: number }>;
  medium: Array<{ studentId: string; studentName: string; score: number }>;
  low: Array<{ studentId: string; studentName: string; score: number }>;
} {
  const categorized = {
    high: [] as Array<{ studentId: string; studentName: string; score: number }>,
    medium: [] as Array<{ studentId: string; studentName: string; score: number }>,
    low: [] as Array<{ studentId: string; studentName: string; score: number }>,
  };

  for (const report of reports) {
    const band = getSalaryBand(report.overallScore);
    const studentInfo = {
      studentId: report.studentId,
      studentName: report.studentName,
      score: report.overallScore,
    };

    if (band === 'high') {
      categorized.high.push(studentInfo);
    } else if (band === 'medium') {
      categorized.medium.push(studentInfo);
    } else {
      categorized.low.push(studentInfo);
    }
  }

  // Sort each category by score
  categorized.high.sort((a, b) => b.score - a.score);
  categorized.medium.sort((a, b) => b.score - a.score);
  categorized.low.sort((a, b) => b.score - a.score);

  return categorized;
}

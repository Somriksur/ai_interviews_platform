/**
 * Candidate Performance Analytics
 * Calculate statistics and insights from interview data
 */

export interface InterviewData {
    id: string;
    role: string;
    totalScore: number;
    categoryScores: Array<{ name: string; score: number }>;
    techstack: string[];
    createdAt: string;
    strengths: string[];
    areasForImprovement: string[];
}

export interface AnalyticsResult {
    scoreTrends: Array<{ date: string; score: number; role: string }>;
    skillProficiency: Array<{ skill: string; score: number; fullMark: number }>;
    categoryBreakdown: Array<{ category: string; score: number }>;
    averageScore: number;
    improvement: number;
    totalInterviews: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
}

/**
 * Calculate comprehensive analytics from interview history
 */
export function calculateCandidateAnalytics(
    interviews: InterviewData[]
): AnalyticsResult {
    if (interviews.length === 0) {
        return {
            scoreTrends: [],
            skillProficiency: [],
            categoryBreakdown: [],
            averageScore: 0,
            improvement: 0,
            totalInterviews: 0,
            strengths: [],
            weaknesses: [],
            recommendations: [],
        };
    }

    // Sort by date
    const sortedInterviews = [...interviews].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Calculate score trends
    const scoreTrends = sortedInterviews.map((interview) => ({
        date: new Date(interview.createdAt).toLocaleDateString(),
        score: interview.totalScore,
        role: interview.role,
    }));

    // Calculate skill proficiency
    const skillScores: Record<string, number[]> = {};
    sortedInterviews.forEach((interview) => {
        interview.techstack.forEach((skill) => {
            if (!skillScores[skill]) {
                skillScores[skill] = [];
            }
            skillScores[skill].push(interview.totalScore);
        });
    });

    const skillProficiency = Object.entries(skillScores)
        .map(([skill, scores]) => ({
            skill,
            score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
            fullMark: 100,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8); // Top 8 skills

    // Calculate category breakdown
    const categoryScores: Record<string, number[]> = {};
    sortedInterviews.forEach((interview) => {
        interview.categoryScores.forEach((cat) => {
            if (!categoryScores[cat.name]) {
                categoryScores[cat.name] = [];
            }
            categoryScores[cat.name].push(cat.score);
        });
    });

    const categoryBreakdown = Object.entries(categoryScores).map(
        ([category, scores]) => ({
            category,
            score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        })
    );

    // Calculate average score
    const averageScore = Math.round(
        sortedInterviews.reduce((sum, i) => sum + i.totalScore, 0) /
            sortedInterviews.length
    );

    // Calculate improvement (first vs last)
    const improvement =
        sortedInterviews.length > 1
            ? sortedInterviews[sortedInterviews.length - 1].totalScore -
              sortedInterviews[0].totalScore
            : 0;

    // Aggregate strengths and weaknesses
    const strengthsMap: Record<string, number> = {};
    const weaknessesMap: Record<string, number> = {};

    sortedInterviews.forEach((interview) => {
        interview.strengths.forEach((strength) => {
            strengthsMap[strength] = (strengthsMap[strength] || 0) + 1;
        });
        interview.areasForImprovement.forEach((weakness) => {
            weaknessesMap[weakness] = (weaknessesMap[weakness] || 0) + 1;
        });
    });

    const strengths = Object.entries(strengthsMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([strength]) => strength);

    const weaknesses = Object.entries(weaknessesMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([weakness]) => weakness);

    // Generate recommendations
    const recommendations = generateRecommendations(
        averageScore,
        improvement,
        weaknesses,
        skillProficiency
    );

    return {
        scoreTrends,
        skillProficiency,
        categoryBreakdown,
        averageScore,
        improvement,
        totalInterviews: interviews.length,
        strengths,
        weaknesses,
        recommendations,
    };
}

/**
 * Generate AI-powered recommendations
 */
function generateRecommendations(
    averageScore: number,
    improvement: number,
    weaknesses: string[],
    skillProficiency: Array<{ skill: string; score: number }>
): string[] {
    const recommendations: string[] = [];

    // Score-based recommendations
    if (averageScore < 50) {
        recommendations.push(
            "Focus on fundamentals - Review core concepts in your target role"
        );
        recommendations.push(
            "Practice coding problems daily on platforms like LeetCode or HackerRank"
        );
    } else if (averageScore < 70) {
        recommendations.push(
            "Good progress! Focus on advanced topics to reach the next level"
        );
        recommendations.push(
            "Work on system design and architecture patterns"
        );
    } else {
        recommendations.push(
            "Excellent performance! Maintain your skills with regular practice"
        );
        recommendations.push(
            "Consider mentoring others to reinforce your knowledge"
        );
    }

    // Improvement-based recommendations
    if (improvement > 10) {
        recommendations.push(
            "Great improvement trend! Keep up the consistent practice"
        );
    } else if (improvement < -10) {
        recommendations.push(
            "Consider revisiting fundamentals and taking a structured course"
        );
    }

    // Weakness-based recommendations
    if (weaknesses.length > 0) {
        const topWeakness = weaknesses[0];
        recommendations.push(
            `Focus on improving: ${topWeakness} - Dedicate 30 minutes daily to this area`
        );
    }

    // Skill-based recommendations
    const weakSkills = skillProficiency.filter((s) => s.score < 60);
    if (weakSkills.length > 0) {
        recommendations.push(
            `Strengthen your skills in: ${weakSkills.map((s) => s.skill).join(", ")}`
        );
    }

    return recommendations.slice(0, 5); // Top 5 recommendations
}

/**
 * Compare candidate with peer group (anonymized)
 */
export function compareToPeers(
    candidateScore: number,
    allScores: number[]
): {
    percentile: number;
    aboveAverage: boolean;
    ranking: string;
} {
    const sortedScores = [...allScores].sort((a, b) => a - b);
    const position = sortedScores.filter((s) => s <= candidateScore).length;
    const percentile = Math.round((position / sortedScores.length) * 100);

    const average = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    const aboveAverage = candidateScore > average;

    let ranking = "Average";
    if (percentile >= 90) ranking = "Top 10%";
    else if (percentile >= 75) ranking = "Top 25%";
    else if (percentile >= 50) ranking = "Above Average";
    else if (percentile >= 25) ranking = "Below Average";
    else ranking = "Bottom 25%";

    return { percentile, aboveAverage, ranking };
}

/**
 * Calculate skill progression over time
 */
export function calculateSkillProgression(
    interviews: InterviewData[],
    skill: string
): Array<{ date: string; score: number }> {
    return interviews
        .filter((i) => i.techstack.includes(skill))
        .sort(
            (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        .map((i) => ({
            date: new Date(i.createdAt).toLocaleDateString(),
            score: i.totalScore,
        }));
}

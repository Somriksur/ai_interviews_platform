import { NextRequest, NextResponse } from "next/server";
import { db as adminDb } from "@/firebase/admin";

export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        // Fetch completed interviews
        const interviewsRef = adminDb
            .collection("interviews")
            .where("candidateId", "==", userId)
            .where("status", "==", "completed");

        const snapshot = await interviewsRef.get();

        // Analyze performance by tech stack
        const skillScores: Record<string, number[]> = {};

        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const techStack = data.techstack || [];
            const score = data.score || 0;

            techStack.forEach((tech: string) => {
                if (!skillScores[tech]) {
                    skillScores[tech] = [];
                }
                skillScores[tech].push(score);
            });
        });

        // Calculate average scores and identify weak areas (< 70)
        const weakAreas = Object.entries(skillScores)
            .map(([skill, scores]) => {
                const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
                return { skill, averageScore };
            })
            .filter((area) => area.averageScore < 70)
            .sort((a, b) => a.averageScore - b.averageScore);

        // Add learning resources for each weak area
        const weakAreasWithResources = weakAreas.map((area) => ({
            ...area,
            resources: getLearningResources(area.skill),
        }));

        return NextResponse.json({ weakAreas: weakAreasWithResources });
    } catch (error) {
        console.error("Error fetching learning path:", error);
        return NextResponse.json(
            { error: "Failed to fetch learning path" },
            { status: 500 }
        );
    }
}

// Helper function to get learning resources
function getLearningResources(skill: string) {
    const resourceDatabase: Record<string, Array<{ id: string; title: string; type: "course" | "article" | "video"; url: string; skill: string }>> = {
        JavaScript: [
            {
                id: "js-1",
                title: "JavaScript: The Complete Guide",
                type: "course",
                url: "https://www.udemy.com/course/javascript-the-complete-guide-2020-beginner-advanced/",
                skill: "JavaScript",
            },
            {
                id: "js-2",
                title: "JavaScript Tutorial for Beginners",
                type: "video",
                url: "https://www.youtube.com/watch?v=W6NZfCO5SIk",
                skill: "JavaScript",
            },
            {
                id: "js-3",
                title: "MDN JavaScript Guide",
                type: "article",
                url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
                skill: "JavaScript",
            },
        ],
        Python: [
            {
                id: "py-1",
                title: "Complete Python Bootcamp",
                type: "course",
                url: "https://www.udemy.com/course/complete-python-bootcamp/",
                skill: "Python",
            },
            {
                id: "py-2",
                title: "Python Tutorial - Python Full Course",
                type: "video",
                url: "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
                skill: "Python",
            },
        ],
        React: [
            {
                id: "react-1",
                title: "React - The Complete Guide",
                type: "course",
                url: "https://www.udemy.com/course/react-the-complete-guide-incl-redux/",
                skill: "React",
            },
            {
                id: "react-2",
                title: "React Official Documentation",
                type: "article",
                url: "https://react.dev/learn",
                skill: "React",
            },
        ],
        // Add more skills as needed
    };

    return resourceDatabase[skill] || [
        {
            id: `${skill}-1`,
            title: `Learn ${skill} - Comprehensive Guide`,
            type: "course" as const,
            url: `https://www.google.com/search?q=learn+${encodeURIComponent(skill)}`,
            skill,
        },
    ];
}

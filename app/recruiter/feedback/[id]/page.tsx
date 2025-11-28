import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { db } from "@/firebase/admin";
import dayjs from "dayjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function RecruiterFeedbackPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/auth/sign-in");
    }

    if (user.role !== "recruiter") {
        redirect("/candidate/dashboard");
    }

    const { id: feedbackId } = await params;

    // Get feedback
    const feedbackDoc = await db.collection("feedbacks").doc(feedbackId).get();

    if (!feedbackDoc.exists) {
        redirect("/recruiter/dashboard");
    }

    const feedback = feedbackDoc.data() as Feedback;

    // Verify this feedback belongs to recruiter's interview
    if (feedback.recruiterId !== user.id) {
        redirect("/recruiter/dashboard");
    }

    // Get interview details
    const interviewDoc = await db
        .collection("interviews")
        .doc(feedback.interviewId)
        .get();
    const interview = interviewDoc.data() as Interview;

    // Get candidate details
    const candidateDoc = await db
        .collection("users")
        .doc(feedback.candidateId)
        .get();
    const candidate = candidateDoc.data();

    const formattedDate = dayjs(feedback.createdAt).format("MMMM D, YYYY");

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <div className="mb-6">
                <Button asChild variant="outline">
                    <Link href="/recruiter/dashboard">← Back to Dashboard</Link>
                </Button>
            </div>

            <div className="card p-8 space-y-8">
                {/* Header */}
                <div className="border-b pb-6">
                    <h1 className="text-3xl font-bold">Interview Feedback</h1>
                    <p className="text-gray-400 mt-2">{formattedDate}</p>
                </div>

                {/* Candidate Info */}
                <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 text-blue-400">
                        Candidate Information
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-gray-400 text-sm">Name</p>
                            <p className="font-semibold">{candidate?.name}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Email</p>
                            <p className="font-semibold">{candidate?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Interview Details */}
                <div className="bg-purple-900/20 border border-purple-500 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 text-purple-400">
                        Interview Details
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-gray-400 text-sm">Role</p>
                            <p className="font-semibold capitalize">{interview.role}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Level</p>
                            <p className="font-semibold capitalize">{interview.level}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Type</p>
                            <p className="font-semibold capitalize">{interview.type}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Tech Stack</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {interview.techstack.map((tech, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-1 bg-primary/20 rounded text-xs"
                                    >
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overall Score */}
                <div className="text-center py-8 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-lg">
                    <p className="text-gray-400 text-sm uppercase tracking-wide">
                        Overall Score
                    </p>
                    <p className="text-6xl font-bold mt-2">{feedback.totalScore}</p>
                    <p className="text-gray-400 text-sm mt-1">out of 100</p>
                </div>

                {/* Category Scores */}
                <div>
                    <h2 className="text-2xl font-semibold mb-4">Category Breakdown</h2>
                    <div className="space-y-4">
                        {feedback.categoryScores.map((category, index) => (
                            <div
                                key={index}
                                className="border border-gray-700 rounded-lg p-4"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-semibold">{category.name}</h3>
                                    <span className="text-2xl font-bold text-primary">
                                        {category.score}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all"
                                        style={{ width: `${category.score}%` }}
                                    ></div>
                                </div>
                                <p className="text-gray-300 text-sm">{category.comment}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Strengths */}
                <div>
                    <h2 className="text-2xl font-semibold mb-4">Strengths</h2>
                    <ul className="space-y-2">
                        {feedback.strengths.map((strength, index) => (
                            <li
                                key={index}
                                className="flex items-start gap-3 bg-green-900/20 border border-green-500 rounded-lg p-3"
                            >
                                <span className="text-green-500 text-xl">✓</span>
                                <span className="text-gray-300">{strength}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Areas for Improvement */}
                <div>
                    <h2 className="text-2xl font-semibold mb-4">
                        Areas for Improvement
                    </h2>
                    <ul className="space-y-2">
                        {feedback.areasForImprovement.map((area, index) => (
                            <li
                                key={index}
                                className="flex items-start gap-3 bg-yellow-900/20 border border-yellow-500 rounded-lg p-3"
                            >
                                <span className="text-yellow-500 text-xl">→</span>
                                <span className="text-gray-300">{area}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Final Assessment */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4">Final Assessment</h2>
                    <p className="text-gray-300 leading-relaxed">
                        {feedback.finalAssessment}
                    </p>
                </div>

                {/* Transcript */}
                {feedback.transcript && feedback.transcript.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">
                            Interview Transcript
                        </h2>
                        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                            {feedback.transcript.map((entry: { role: string; content: string }, index: number) => (
                                <div key={index} className="mb-3 pb-3 border-b border-gray-800 last:border-0">
                                    <p className="text-xs text-gray-500 uppercase mb-1">
                                        {entry.role === "assistant" ? "Interviewer" : "Candidate"}
                                    </p>
                                    <p className="text-gray-300">{entry.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

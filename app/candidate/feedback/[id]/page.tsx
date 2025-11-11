import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { db } from "@/firebase/admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const feedbackId = resolvedParams.id;
    const user = await getCurrentUser();

    if (!user) {
        redirect("/auth/sign-in");
    }

    const feedbackDoc = await db.collection("feedbacks").doc(feedbackId).get();
    if (!feedbackDoc.exists) {
        return <div>Feedback not found</div>;
    }

    const feedback = { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;

    // Get interview details
    const interviewDoc = await db.collection("interviews").doc(feedback.interviewId).get();
    const interview = interviewDoc.data() as Interview;

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Interview Feedback</h1>
                <Button asChild>
                    <Link href="/candidate/dashboard">Back to Dashboard</Link>
                </Button>
            </div>

            <div className="card p-6 space-y-4">
                <div>
                    <h2 className="text-2xl font-semibold">{interview.role}</h2>
                    <p className="text-gray-400">{interview.level} • {interview.type}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {interview.techstack.map((tech, i) => (
                        <span key={i} className="px-3 py-1 bg-primary/20 rounded-full text-sm">
                            {tech}
                        </span>
                    ))}
                </div>
            </div>

            <div className="card p-6">
                <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold mb-2">Overall Score</h3>
                    <div className="text-6xl font-bold text-primary">
                        {feedback.totalScore}
                        <span className="text-2xl">/100</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {feedback.categoryScores.map((category, i) => (
                        <div key={i} className="border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold">{category.name}</h4>
                                <span className="text-2xl font-bold text-primary">
                                    {category.score}
                                </span>
                            </div>
                            <p className="text-sm text-gray-400">{category.comment}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6">
                    <h3 className="text-xl font-semibold mb-4 text-green-400">✅ Strengths</h3>
                    <ul className="space-y-2">
                        {feedback.strengths.map((strength, i) => (
                            <li key={i} className="flex items-start">
                                <span className="text-green-400 mr-2">•</span>
                                <span>{strength}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="card p-6">
                    <h3 className="text-xl font-semibold mb-4 text-yellow-400">📈 Areas for Improvement</h3>
                    <ul className="space-y-2">
                        {feedback.areasForImprovement.map((area, i) => (
                            <li key={i} className="flex items-start">
                                <span className="text-yellow-400 mr-2">•</span>
                                <span>{area}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="card p-6">
                <h3 className="text-xl font-semibold mb-4">Final Assessment</h3>
                <p className="text-gray-300 leading-relaxed">{feedback.finalAssessment}</p>
            </div>

            {user.role === "recruiter" && feedback.transcript && (
                <div className="card p-6">
                    <h3 className="text-xl font-semibold mb-4">Interview Transcript</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {feedback.transcript.map((entry, i) => (
                            <div key={i} className={`p-3 rounded-lg ${
                                entry.role === "assistant" ? "bg-primary/10" : "bg-secondary/10"
                            }`}>
                                <span className="font-semibold capitalize">{entry.role}:</span>
                                <p className="mt-1">{entry.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

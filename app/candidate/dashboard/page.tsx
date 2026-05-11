import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth.action";
import CandidateInterviewCard from "@/components/CandidateInterviewCard";
import BatchFixScoresButton from "@/components/BatchFixScoresButton";
import ScoreFixNotification from "@/components/ScoreFixNotification";
import { getAvailableInterviews, getCandidateInterviews } from "@/lib/actions/candidate.action";

export default async function CandidateDashboard() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/auth/sign-in");
    }

    // Allow access for "candidate" or "student" role
    if (user.role !== "candidate" && user.role !== "student") {
        redirect("/");
    }

    const [availableInterviews, myInterviews] = await Promise.all([
        getAvailableInterviews(user.email),
        getCandidateInterviews(user.id),
    ]);

    // Count interviews with low scores (likely affected by the issue)
    const lowScoreCount = myInterviews.filter((interview: any) => 
        interview.totalScore !== undefined && interview.totalScore < 25
    ).length;

    return (
        <div className="container mx-auto p-6 space-y-8">
            <ScoreFixNotification />
            
            <div>
                <h1 className="text-3xl font-bold">Candidate Dashboard</h1>
                <p className="text-gray-400 mt-2">Welcome, {user.name}!</p>
            </div>

            {/* Batch Fix Button - shows only if there are low scores */}
            <BatchFixScoresButton 
                userId={user.id}
                lowScoreCount={lowScoreCount}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6">
                    <h3 className="text-lg font-semibold">Interviews Taken</h3>
                    <p className="text-3xl font-bold mt-2">{myInterviews.length}</p>
                </div>
                <div className="card p-6">
                    <h3 className="text-lg font-semibold">Available</h3>
                    <p className="text-3xl font-bold mt-2">{availableInterviews.length}</p>
                </div>
                <div className="card p-6">
                    <h3 className="text-lg font-semibold">Avg Score</h3>
                    <p className="text-3xl font-bold mt-2">
                        {myInterviews.length > 0 ? "85%" : "N/A"}
                    </p>
                </div>
            </div>

            <section>
                <h2 className="text-2xl font-semibold mb-4">Available Interviews</h2>
                <div className="interviews-section">
                    {availableInterviews.length > 0 ? (
                        availableInterviews.map((interview: Interview) => (
                            <CandidateInterviewCard
                                key={interview.id}
                                interviewId={interview.id}
                                role={interview.role}
                                type={interview.type}
                                techstack={interview.techstack}
                                createdAt={interview.createdAt}
                                status={interview.status}
                            />
                        ))
                    ) : (
                        <p className="text-gray-400">No interviews assigned to you yet.</p>
                    )}
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-semibold mb-4">My Interviews</h2>
                <div className="interviews-section">
                    {myInterviews.length > 0 ? (
                        myInterviews.map((interview: Interview & { feedbackId?: string; totalScore?: number }) => (
                            <CandidateInterviewCard
                                key={interview.feedbackId || interview.id}
                                interviewId={interview.id}
                                role={interview.role}
                                type={interview.type}
                                techstack={interview.techstack}
                                createdAt={interview.createdAt}
                                status={interview.status}
                                hasFeedback={!!interview.feedbackId}
                                feedbackId={interview.feedbackId}
                                totalScore={interview.totalScore}
                            />
                        ))
                    ) : (
                        <p className="text-gray-400">You haven&apos;t taken any interviews yet.</p>
                    )}
                </div>
            </section>
        </div>
    );
}

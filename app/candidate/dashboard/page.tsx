import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth.action";
import CandidateInterviewCard from "@/components/CandidateInterviewCard";
import { getAvailableInterviews, getCandidateInterviews } from "@/lib/actions/candidate.action";

export default async function CandidateDashboard() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/auth/sign-in");
    }

    // If role is explicitly "recruiter", redirect to recruiter dashboard
    if (user.role === "recruiter") {
        redirect("/recruiter/dashboard");
    }

    // Allow access for "candidate" or undefined (default to candidate)

    const [availableInterviews, myInterviews] = await Promise.all([
        getAvailableInterviews(user.email),
        getCandidateInterviews(user.id),
    ]);

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Candidate Dashboard</h1>
                <p className="text-gray-400 mt-2">Welcome, {user.name}!</p>
            </div>

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
                                key={interview.feedbackId}
                                interviewId={interview.id}
                                role={interview.role}
                                type={interview.type}
                                techstack={interview.techstack}
                                createdAt={interview.createdAt}
                                status="completed"
                                hasFeedback={true}
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

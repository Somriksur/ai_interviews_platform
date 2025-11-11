import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";
import RecruiterInterviewCard from "@/components/RecruiterInterviewCard";
import RecruiterFeedbackCard from "@/components/RecruiterFeedbackCard";
import { getInterviewsByRecruiterId, getFeedbacksByRecruiterId } from "@/lib/actions/recruiter.action";

export default async function RecruiterDashboard() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/auth/sign-in");
    }

    // Only allow access if explicitly "recruiter"
    if (user.role !== "recruiter") {
        redirect("/candidate/dashboard");
    }

    const interviews = await getInterviewsByRecruiterId(user.id);
    const feedbacks = await getFeedbacksByRecruiterId(user.id);

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
                    <p className="text-gray-400 mt-2">Welcome back, {user.name}!</p>
                </div>
                <Button asChild className="btn-primary">
                    <Link href="/recruiter/create-interview">
                        ➕ Create New Interview
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6">
                    <h3 className="text-lg font-semibold">Total Interviews</h3>
                    <p className="text-3xl font-bold mt-2">{interviews.length}</p>
                </div>
                <div className="card p-6">
                    <h3 className="text-lg font-semibold">Assigned</h3>
                    <p className="text-3xl font-bold mt-2">
                        {interviews.filter((i: Interview) => i.status === "assigned").length}
                    </p>
                </div>
                <div className="card p-6">
                    <h3 className="text-lg font-semibold">Completed</h3>
                    <p className="text-3xl font-bold mt-2">
                        {interviews.filter((i: Interview) => i.status === "completed").length}
                    </p>
                </div>
            </div>

            <section>
                <h2 className="text-2xl font-semibold mb-4">Your Interviews</h2>
                <div className="interviews-section">
                    {interviews.length > 0 ? (
                        interviews.map((interview: Interview) => (
                            <RecruiterInterviewCard
                                key={interview.id}
                                interviewId={interview.id}
                                role={interview.role}
                                type={interview.type}
                                techstack={interview.techstack}
                                createdAt={interview.createdAt}
                                candidateEmail={interview.candidateEmail}
                                status={interview.status}
                            />
                        ))
                    ) : (
                        <p className="text-gray-400">No interviews created yet. Create your first one!</p>
                    )}
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-semibold mb-4">Candidate Results</h2>
                <div className="interviews-section">
                    {feedbacks.length > 0 ? (
                        feedbacks.map((feedback) => (
                            <RecruiterFeedbackCard
                                key={feedback.id}
                                feedbackId={feedback.id}
                                candidateName={feedback.candidate?.name || "Unknown"}
                                candidateEmail={feedback.candidate?.email || "N/A"}
                                role={feedback.interview?.role || "N/A"}
                                type={feedback.interview?.type || "N/A"}
                                level={feedback.interview?.level || "N/A"}
                                techstack={feedback.interview?.techstack || []}
                                totalScore={(feedback as { totalScore?: number }).totalScore || 0}
                                createdAt={(feedback as { createdAt?: string }).createdAt || new Date().toISOString()}
                                interviewId={(feedback as { interviewId?: string }).interviewId || feedback.interview.id}
                            />
                        ))
                    ) : (
                        <p className="text-gray-400">No candidate results yet. Results will appear here after candidates complete interviews.</p>
                    )}
                </div>
            </section>
        </div>
    );
}

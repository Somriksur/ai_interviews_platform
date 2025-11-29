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

            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card p-6 bg-blue-50 dark:bg-blue-900/20">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Interviews</h3>
                    <p className="text-3xl font-bold mt-2">{interviews.length}</p>
                    <p className="text-xs text-gray-500 mt-1">All time</p>
                </div>
                <div className="card p-6 bg-yellow-50 dark:bg-yellow-900/20">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Pending</h3>
                    <p className="text-3xl font-bold mt-2 text-yellow-600">
                        {interviews.filter((i: Interview) => i.status === "pending").length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Not started</p>
                </div>
                <div className="card p-6 bg-purple-50 dark:bg-purple-900/20">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">In Progress</h3>
                    <p className="text-3xl font-bold mt-2 text-purple-600">
                        {interviews.filter((i: Interview) => i.status === "in-progress").length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Ongoing</p>
                </div>
                <div className="card p-6 bg-green-50 dark:bg-green-900/20">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Completed</h3>
                    <p className="text-3xl font-bold mt-2 text-green-600">
                        {interviews.filter((i: Interview) => i.status === "completed").length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {interviews.length > 0 
                            ? `${Math.round((interviews.filter((i: Interview) => i.status === "completed").length / interviews.length) * 100)}% completion rate`
                            : "0% completion rate"
                        }
                    </p>
                </div>
            </div>

            {/* Additional Analytics */}
            {interviews.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold mb-4">📊 Most Used Roles</h3>
                        <div className="space-y-2">
                            {Object.entries(
                                interviews.reduce((acc: any, i: Interview) => {
                                    acc[i.role] = (acc[i.role] || 0) + 1;
                                    return acc;
                                }, {})
                            )
                            .sort(([,a]: any, [,b]: any) => b - a)
                            .slice(0, 5)
                            .map(([role, count]: any) => (
                                <div key={role} className="flex justify-between items-center">
                                    <span className="text-sm">{role}</span>
                                    <span className="font-semibold">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold mb-4">💻 Popular Tech Stacks</h3>
                        <div className="space-y-2">
                            {Object.entries(
                                interviews.reduce((acc: any, i: Interview) => {
                                    i.techstack.forEach((tech: string) => {
                                        acc[tech] = (acc[tech] || 0) + 1;
                                    });
                                    return acc;
                                }, {})
                            )
                            .sort(([,a]: any, [,b]: any) => b - a)
                            .slice(0, 5)
                            .map(([tech, count]: any) => (
                                <div key={tech} className="flex justify-between items-center">
                                    <span className="text-sm">{tech}</span>
                                    <span className="font-semibold">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

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

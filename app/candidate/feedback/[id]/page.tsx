import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { db } from "@/firebase/admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ExportPDFButton from "@/components/ExportPDFButton";
import InterviewIssueHandler from "@/components/InterviewIssueHandler";

export default async function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const feedbackId = resolvedParams.id;
    const user = await getCurrentUser();

    if (!user) {
        redirect("/auth/sign-in");
    }

    const reportDoc = await db.collection("evaluation_reports").doc(feedbackId).get();
    if (!reportDoc.exists) {
        return <div>Report not found</div>;
    }

    const report = { id: reportDoc.id, ...reportDoc.data() } as any;

    const sessionDoc = report.sessionId
        ? await db.collection("interview_sessions").doc(report.sessionId).get()
        : null;
    const session = sessionDoc?.data() || {};
    const driveDoc = session?.driveId
        ? await db.collection("interview_drives").doc(session.driveId).get()
        : null;
    const drive = driveDoc?.data() || {};

    const currentScore = Number(report.overallScore ?? report.scores?.overall ?? 0);

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Interview Feedback</h1>
                <div className="flex gap-2">
                    <ExportPDFButton
                        interviewData={{
                            candidateName: user.name || "Unknown",
                            role: drive.role || session?.role || "Interview",
                            score: currentScore,
                            questions: report.transcript?.questionResponses?.map((qr: any) => qr.question) || [],
                            answers: report.transcript?.questionResponses?.map((qr: any) => qr.response) || [],
                        }}
                    />
                    <Button asChild>
                        <Link href="/candidate/dashboard">Back to Dashboard</Link>
                    </Button>
                </div>
            </div>

            {/* Interview Issue Handler - shows for low scores and diagnoses the problem */}
            <InterviewIssueHandler 
                evaluationId={feedbackId}
                currentScore={currentScore}
                driveId={session?.driveId || drive?.id}
                studentId={report.studentId}
            />

            <div className="card p-6 space-y-4">
                <div>
                    <h2 className="text-2xl font-semibold">{drive.role || session?.role || "Interview"}</h2>
                    <p className="text-gray-400">{session?.level || "mid-level"} • {session?.type || "technical"}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {(session?.techstack || []).map((tech: string, i: number) => (
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
                        {currentScore}
                        <span className="text-2xl">/100</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { name: "Technical", score: Number(report.technicalScore ?? report.scores?.technical ?? 0), comment: "Technical competency assessment" },
                        { name: "Communication", score: Number(report.communicationScore ?? report.scores?.communication ?? 0), comment: "Communication effectiveness assessment" },
                        { name: "Problem Solving", score: Number(report.problemSolvingScore ?? report.scores?.problemSolving ?? 0), comment: "Problem solving assessment" },
                    ].map((category, i) => (
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
                        {(report.feedback?.strengths || []).map((strength: string, i: number) => (
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
                        {(report.feedback?.improvements || []).map((area: string, i: number) => (
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
                <p className="text-gray-300 leading-relaxed">
                    {report.feedback?.detailedAnalysis || "Detailed assessment unavailable."}
                </p>
            </div>

            {user.role === "organization" && report.transcript?.questionResponses && (
                <div className="card p-6">
                    <h3 className="text-xl font-semibold mb-4">Interview Transcript</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {report.transcript.questionResponses.map((entry: any, i: number) => (
                            <div key={i} className="p-3 rounded-lg bg-secondary/10">
                                <span className="font-semibold">Q:</span>
                                <p className="mt-1">{entry.question}</p>
                                <span className="font-semibold mt-2 inline-block">A:</span>
                                <p className="mt-1">{entry.response}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

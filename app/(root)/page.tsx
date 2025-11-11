import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";

import { getCurrentUser } from "@/lib/actions/auth.action";
import {
    getInterviewsByUserId,
    getLatestInterviews,
} from "@/lib/actions/general.action";

async function Home() {
    const user = await getCurrentUser();

    if (!user || !user.id) {
        return (
            <section className="card-cta text-center">
                <h2 className="text-xl font-semibold">
                    Please sign in to view or take interviews.
                </h2>
                <Button asChild className="btn-primary mt-4">
                    <Link href="/sign-in">Sign In</Link>
                </Button>
            </section>
        );
    }

    const [userInterviewsRaw, allInterviewRaw] = await Promise.all([
        getInterviewsByUserId(user.id),
        getLatestInterviews({ userId: user.id }),
    ]);

    // ✅ Ensure they are always arrays
    const userInterviews = userInterviewsRaw ?? [];
    const allInterview = allInterviewRaw ?? [];

    const hasPastInterviews = userInterviews.length > 0;
    const hasUpcomingInterviews = allInterview.length > 0;


    return (
        <>
            <section className="card-cta">
                <div className="flex flex-col gap-6 max-w-lg">
                    <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
                    <p className="text-lg">
                        Practice real interview questions & get instant feedback
                    </p>

                    <Button asChild className="btn-primary max-sm:w-full">
                        <Link href="/interview">Start an Interview</Link>
                    </Button>
                </div>

                <Image
                    src="/robot.png"
                    alt="robo-dude"
                    width={400}
                    height={400}
                    className="max-sm:hidden"
                />
            </section>

            <section className="flex flex-col gap-6 mt-8">
                <h2>Your Interviews</h2>

                <div className="interviews-section">
                    {hasPastInterviews ? (
                        userInterviews.map((interview) => (
                            <InterviewCard
                                key={String(interview.id)}
                                userId={user.id}
                                interviewId={String(interview.id)}
                                role={String(interview.role ?? "Unknown")}
                                type={String(interview.type ?? "N/A")}
                                techstack={
                                    Array.isArray(interview.techstack)
                                        ? interview.techstack
                                        : [String(interview.techstack ?? "")]
                                }
                                createdAt={String(interview.createdAt ?? "")}
                            />
                        ))
                    ) : (
                        <p>You haven&apos;t taken any interviews yet.</p>
                    )}
                </div>
            </section>

            <section className="flex flex-col gap-6 mt-8">
                <h2>Take Interviews</h2>

                <div className="interviews-section">
                    {hasUpcomingInterviews ? (
                        allInterview.map((interview) => (
                            <InterviewCard
                                key={String(interview.id)}
                                userId={user.id}
                                interviewId={String(interview.id)}
                                role={String(interview.role ?? "Unknown")}
                                type={String(interview.type ?? "N/A")}
                                techstack={
                                    Array.isArray(interview.techstack)
                                        ? interview.techstack
                                        : [String(interview.techstack ?? "")]
                                }
                                createdAt={String(interview.createdAt ?? "")}
                            />
                        ))
                    ) : (
                        <p>There are no interviews available.</p>
                    )}
                </div>
            </section>
        </>
    );
}

export default Home;

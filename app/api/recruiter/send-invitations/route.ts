import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth.action";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();

        if (!user || user.role !== "recruiter") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { interviewId, emails, interviewLink, interviewTitle } = await req.json();

        if (!interviewId || !emails || !Array.isArray(emails) || emails.length === 0) {
            return NextResponse.json(
                { error: "Invalid request data" },
                { status: 400 }
            );
        }

        console.log("Sending invitations to:", emails);
        console.log("Interview Link:", interviewLink);
        console.log("Interview Title:", interviewTitle);

        // Example email content structure
        const emailData = emails.map((email: string) => ({
            to: email,
            subject: `Interview Invitation: ${interviewTitle || "HireFlow Interview"}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>You've been invited to a HireFlow Interview</h2>
                    <p>Hello,</p>
                    <p>You have been invited to participate in a HireFlow interview.</p>
                    <p><strong>Interview:</strong> ${interviewTitle || "HireFlow Interview"}</p>
                    <p>Click the link below to start your interview:</p>
                    <a href="${interviewLink}" 
                       style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; 
                              color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                        Start Interview
                    </a>
                    <p>Or copy this link: ${interviewLink}</p>
                    <p>Good luck!</p>
                    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px;">
                        This is an automated invitation. Please do not reply to this email.
                    </p>
                </div>
            `,
            text: `You've been invited to a HireFlow Interview\n\nInterview: ${interviewTitle || "HireFlow Interview"}\n\nStart your interview here: ${interviewLink}\n\nGood luck!`
        }));

        // TODO: Integrate with actual email service
        // Example with Resend:
        // const resend = new Resend(process.env.RESEND_API_KEY);
        // await Promise.all(emailData.map(data => resend.emails.send(data)));

        // For now, just log and return success
        console.log("Email data prepared:", emailData);

        return NextResponse.json({
            success: true,
            message: `Invitations sent to ${emails.length} candidate(s)`,
            emailsSent: emails.length
        });

    } catch (error) {
        console.error("Error sending invitations:", error);
        return NextResponse.json(
            { error: "Failed to send invitations" },
            { status: 500 }
        );
    }
}

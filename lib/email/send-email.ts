/**
 * Email Service using Resend
 * 
 * Setup: npm install resend
 * Add to .env.local: RESEND_API_KEY=your_key
 */

interface EmailParams {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams) {
    try {
        // Check if Resend is configured
        const apiKey = process.env.RESEND_API_KEY;
        
        if (!apiKey) {
            console.warn("⚠️ RESEND_API_KEY not configured. Email not sent.");
            return { success: false, error: "Email service not configured" };
        }

        // Development mode: send all emails to Resend test inbox OR your verified email
        const isDevMode = process.env.EMAIL_DEV_MODE === "true";
        const devEmail = process.env.DEV_EMAIL || "delivered@resend.dev";
        const recipientEmail = isDevMode ? devEmail : to;
        
        if (isDevMode) {
            console.log(`📧 DEV MODE: Redirecting email from ${to} to ${devEmail}`);
        }

        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "HireFlow <onboarding@resend.dev>", // Change to your domain
                to: [recipientEmail],
                subject: isDevMode ? `[DEV - ${to}] ${subject}` : subject,
                html,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("❌ Email send failed:", error);
            console.error("📧 Recipient:", to);
            console.error("💡 TIP: For testing, set EMAIL_DEV_MODE=true in .env.local");
            return { success: false, error };
        }

        const data = await response.json();
        console.log("✅ Email sent successfully!");
        console.log("   Email ID:", data.id);
        console.log("   To:", recipientEmail);
        if (isDevMode) {
            console.log("   Original recipient:", to);
            console.log("   📬 Check: https://resend.com/emails");
        }
        return { success: true, id: data.id };

    } catch (error) {
        console.error("❌ Email error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

// Email Templates

export function getInterviewAssignedEmail(candidateName: string, role: string, questionsCount: number, interviewLink: string) {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 New Interview Assigned</h1>
        </div>
        <div class="content">
            <p>Hi ${candidateName},</p>
            
            <p>You've been assigned a new interview for the <strong>${role}</strong> position!</p>
            
            <p><strong>Interview Details:</strong></p>
            <ul>
                <li>Role: ${role}</li>
                <li>Questions: ${questionsCount}</li>
                <li>Estimated Time: ${questionsCount * 5} minutes</li>
            </ul>
            
            <p>Click the button below to start your interview:</p>
            
            <a href="${interviewLink}" class="button">Start Interview</a>
            
            <p>Good luck! 🚀</p>
            
            <p>Best regards,<br>The HireFlow Team</p>
        </div>
        <div class="footer">
            <p>This is an automated email from HireFlow. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
    `;
}

export function getInterviewReminderEmail(candidateName: string, role: string, deadline: string, interviewLink: string) {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fffbeb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ Interview Reminder</h1>
        </div>
        <div class="content">
            <p>Hi ${candidateName},</p>
            
            <div class="warning">
                <strong>⚠️ Reminder:</strong> Your interview for <strong>${role}</strong> is due soon!
            </div>
            
            <p><strong>Deadline:</strong> ${deadline}</p>
            
            <p>Don't miss this opportunity! Complete your interview before the deadline.</p>
            
            <a href="${interviewLink}" class="button">Complete Interview Now</a>
            
            <p>Best regards,<br>The HireFlow Team</p>
        </div>
    </div>
</body>
</html>
    `;
}

export function getInterviewCompletedEmail(recruiterName: string, candidateName: string, role: string, score: number, feedbackLink: string) {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .score { font-size: 48px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Interview Completed</h1>
        </div>
        <div class="content">
            <p>Hi ${recruiterName},</p>
            
            <p><strong>${candidateName}</strong> has completed the interview for <strong>${role}</strong>!</p>
            
            <div class="score">${score}/100</div>
            
            <p>Click below to view the detailed feedback and results:</p>
            
            <a href="${feedbackLink}" class="button">View Results</a>
            
            <p>Best regards,<br>The HireFlow Team</p>
        </div>
    </div>
</body>
</html>
    `;
}

export function getFeedbackReadyEmail(candidateName: string, role: string, score: number, feedbackLink: string) {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #faf5ff; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .score { font-size: 48px; font-weight: bold; color: #8b5cf6; text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Your Feedback is Ready</h1>
        </div>
        <div class="content">
            <p>Hi ${candidateName},</p>
            
            <p>Your interview feedback for <strong>${role}</strong> is now available!</p>
            
            <div class="score">${score}/100</div>
            
            <p>View your detailed feedback, scores, and areas for improvement:</p>
            
            <a href="${feedbackLink}" class="button">View Feedback</a>
            
            <p>Keep learning and improving! 💪</p>
            
            <p>Best regards,<br>The HireFlow Team</p>
        </div>
    </div>
</body>
</html>
    `;
}

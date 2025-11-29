/**
 * Gmail SMTP Email Service
 * Send emails to ANY address using Gmail SMTP
 * 
 * Setup:
 * 1. Enable 2-factor authentication on your Gmail
 * 2. Generate App Password: https://myaccount.google.com/apppasswords
 * 3. Add to .env.local:
 *    GMAIL_USER=your-email@gmail.com
 *    GMAIL_APP_PASSWORD=your-16-char-app-password
 */

import nodemailer from 'nodemailer';

interface EmailParams {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmailViaGmail({ to, subject, html }: EmailParams) {
    try {
        const gmailUser = process.env.GMAIL_USER;
        const gmailPassword = process.env.GMAIL_APP_PASSWORD;

        if (!gmailUser || !gmailPassword) {
            console.warn("⚠️ Gmail SMTP not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local");
            return { success: false, error: "Gmail SMTP not configured" };
        }

        // Create transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: gmailUser,
                pass: gmailPassword,
            },
        });

        // Send email
        const info = await transporter.sendMail({
            from: `HireFlow <${gmailUser}>`,
            to: to,
            subject: subject,
            html: html,
        });

        console.log("✅ Email sent successfully via Gmail!");
        console.log("   Message ID:", info.messageId);
        console.log("   To:", to);
        console.log("   From:", gmailUser);

        return { success: true, id: info.messageId };

    } catch (error) {
        console.error("❌ Gmail SMTP error:", error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "Unknown error" 
        };
    }
}

#!/usr/bin/env node
/**
 * Universal Email Testing Script
 * Test sending emails to ANY email address
 */

const fs = require('fs');
const readline = require('readline');

// Read .env.local
function loadEnv() {
    try {
        const envContent = fs.readFileSync('.env.local', 'utf8');
        const env = {};
        
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^#=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || 
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                
                env[key] = value;
            }
        });
        
        return env;
    } catch (error) {
        console.error('❌ Error reading .env.local:', error.message);
        return null;
    }
}

async function sendTestEmail(to, env) {
    const apiKey = env.RESEND_API_KEY;
    
    if (!apiKey) {
        console.error('❌ RESEND_API_KEY not found in .env.local');
        console.log('💡 Add your Resend API key to .env.local');
        console.log('   Get your key from: https://resend.com/api-keys');
        return;
    }

    // Check mode
    const isDevMode = env.EMAIL_DEV_MODE === 'true';
    const devEmail = env.DEV_EMAIL || 'delivered@resend.dev';
    const recipientEmail = isDevMode ? devEmail : to;
    
    // Determine sender
    const senderName = env.SENDER_NAME || 'HireFlow';
    const senderEmail = env.SENDER_EMAIL || 'onboarding@resend.dev';
    const from = `${senderName} <${senderEmail}>`;

    console.log('\n📧 Sending test email...');
    console.log('   From:', from);
    console.log('   To:', recipientEmail);
    if (isDevMode) {
        console.log('   ⚠️  DEV MODE: Original recipient:', to);
    }
    console.log('');

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: from,
                to: [recipientEmail],
                subject: isDevMode ? `[TEST - ${to}] Universal Email System Test` : 'Universal Email System Test',
                html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 8px 8px; }
        .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 12px; margin: 20px 0; }
        .info { background: #e0e7ff; border-left: 4px solid #6366f1; padding: 12px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Universal Email System Working!</h1>
        </div>
        <div class="content">
            <div class="success">
                <strong>Success!</strong> Your email system can now send to ANY email address.
            </div>
            
            <p><strong>Test Details:</strong></p>
            <ul>
                <li>Recipient: ${to}</li>
                <li>Actual Recipient: ${recipientEmail}</li>
                <li>Mode: ${isDevMode ? 'Development' : 'Production'}</li>
                <li>Sender: ${from}</li>
            </ul>
            
            ${isDevMode ? `
            <div class="info">
                <strong>💡 Development Mode Active</strong><br>
                All emails are being redirected to: ${devEmail}<br>
                To send to real addresses, set EMAIL_DEV_MODE=false in .env.local
            </div>
            ` : `
            <div class="info">
                <strong>🚀 Production Mode Active</strong><br>
                Emails are being sent to actual recipients.<br>
                Make sure your domain is verified at resend.com/domains
            </div>
            `}
            
            <p>Your HireFlow application is ready to send emails to candidates!</p>
            
            <p>Best regards,<br>The HireFlow Team</p>
        </div>
    </div>
</body>
</html>
                `,
                reply_to: env.SENDER_EMAIL || undefined,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Email send failed!');
            console.error('   Status:', response.status);
            console.error('   Error:', data.message || JSON.stringify(data));
            console.log('');
            
            // Provide helpful suggestions
            if (data.message?.includes('domain') || data.message?.includes('verify')) {
                console.log('💡 Domain Not Verified:');
                console.log('   Your domain needs to be verified to send to any email.');
                console.log('   ');
                console.log('   Quick Fix Options:');
                console.log('   1. Enable dev mode: Set EMAIL_DEV_MODE=true in .env.local');
                console.log('   2. Verify a domain at: https://resend.com/domains');
                console.log('   ');
                console.log('   📖 See DOMAIN_SETUP_GUIDE.md for detailed instructions');
            } else if (response.status >= 500) {
                console.log('💡 Service Unavailable:');
                console.log('   The email service is temporarily unavailable.');
                console.log('   Please try again in a few minutes.');
            } else {
                console.log('💡 Check your configuration:');
                console.log('   - Verify RESEND_API_KEY is correct');
                console.log('   - Check email address format');
                console.log('   - Review .env.local settings');
            }
            
            return;
        }

        console.log('✅ Email sent successfully!');
        console.log('   Email ID:', data.id);
        console.log('   Status: Delivered');
        console.log('');
        console.log('📬 Check your inbox:', recipientEmail);
        if (isDevMode) {
            console.log('   Or view in Resend dashboard: https://resend.com/emails');
        }
        console.log('');
        console.log('🎉 Your universal email system is working!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('');
        console.log('💡 Troubleshooting:');
        console.log('   - Check your internet connection');
        console.log('   - Verify RESEND_API_KEY in .env.local');
        console.log('   - Try again in a few moments');
    }
}

async function main() {
    console.log('🚀 Universal Email System Test\n');
    
    const env = loadEnv();
    if (!env) {
        return;
    }

    // Show current configuration
    console.log('📋 Current Configuration:');
    console.log('   API Key:', env.RESEND_API_KEY ? '✅ Configured' : '❌ Missing');
    console.log('   Dev Mode:', env.EMAIL_DEV_MODE === 'true' ? '✅ Enabled' : '❌ Disabled');
    if (env.EMAIL_DEV_MODE === 'true') {
        console.log('   Dev Email:', env.DEV_EMAIL || 'delivered@resend.dev');
    }
    console.log('   Sender:', env.SENDER_NAME || 'HireFlow');
    if (env.VERIFIED_DOMAIN) {
        console.log('   Domain:', env.VERIFIED_DOMAIN);
    }
    console.log('');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Enter email address to test (or press Enter for default): ', async (email) => {
        const testEmail = email.trim() || 'test@example.com';
        
        console.log('');
        await sendTestEmail(testEmail, env);
        
        rl.close();
    });
}

main();

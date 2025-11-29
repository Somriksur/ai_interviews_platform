// Test sending to Gmail
const fs = require('fs');

// Read .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const apiKeyMatch = envContent.match(/RESEND_API_KEY=(.+)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

async function testGmailSend() {
    console.log("🔍 Testing Gmail Email Send...\n");
    
    if (!apiKey) {
        console.error("❌ RESEND_API_KEY not found");
        return;
    }
    
    // Prompt for email
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    readline.question('Enter your Gmail address to test: ', async (email) => {
        console.log(`\n📧 Attempting to send to: ${email}\n`);
        
        try {
            const response = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: "HireFlow <onboarding@resend.dev>",
                    to: [email],
                    subject: "Test Email from HireFlow",
                    html: `
                        <h1>🎉 Email Test Successful!</h1>
                        <p>If you're reading this, emails are working!</p>
                        <p>Your HireFlow interview platform can now send emails to Gmail.</p>
                    `,
                }),
            });

            const data = await response.json();
            
            if (!response.ok) {
                console.error("❌ Failed to send:");
                console.error(JSON.stringify(data, null, 2));
                
                if (data.message && data.message.includes("can only send testing emails")) {
                    console.log("\n⚠️  SOLUTION NEEDED:");
                    console.log("   Your Resend account is in testing mode.");
                    console.log("   To send to Gmail, you need to:");
                    console.log("   1. Go to https://resend.com/domains");
                    console.log("   2. Add and verify a domain");
                    console.log("   OR");
                    console.log("   3. Add this email to your Resend audience");
                    console.log("   4. Verify the email address");
                }
            } else {
                console.log("✅ Email sent successfully!");
                console.log("   Email ID:", data.id);
                console.log(`   📬 Check your Gmail inbox: ${email}`);
                console.log("\n💡 If you don't see it:");
                console.log("   - Check spam folder");
                console.log("   - Wait 1-2 minutes");
                console.log("   - Check Resend dashboard: https://resend.com/emails");
            }
        } catch (error) {
            console.error("❌ Error:", error.message);
        }
        
        readline.close();
    });
}

testGmailSend();

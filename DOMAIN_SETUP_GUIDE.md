# 🌐 Domain Setup Guide - Send Emails to ANY Address

## 🎯 Goal

Enable your HireFlow application to send emails to **ANY email address** (Gmail, Yahoo, Outlook, custom domains, etc.) without restrictions.

## 📋 Current Status

- ✅ Email system implemented
- ✅ Resend API configured
- ⚠️ **Domain verification needed** for universal sending

## 🚀 Quick Setup Options

### ⚡ Option 0: Use Development Mode (EASIEST - Works Now!)

**Time needed:** 0 minutes - Already working!

**Your current setup:**
```bash
EMAIL_DEV_MODE=true
DEV_EMAIL=somriksur@gmail.com
```

**What this means:**
- ✅ Send to ANY email address in your app
- ✅ All emails arrive at `somriksur@gmail.com`
- ✅ Perfect for development and testing
- ✅ No domain needed!
- ✅ Works immediately!

**Test it:**
```bash
node test-universal-email.js
# Enter: anyone@gmail.com
# Email arrives at: somriksur@gmail.com
```

**When to use:**
- Development and testing
- MVP and demos
- Before production launch
- When you don't need to send to real addresses yet

**Recommendation:** Use this mode until you're ready to launch to real users!

---

### Option 1: Use a Free/Cheap Domain (For Production)

#### Step 1: Get a Free Domain (3 minutes)

**⚠️ Note:** Freenom is currently unavailable for new registrations.

**Working Free Domain Options:**

**Option A: GitHub Pages (Recommended - Free & Easy)**
1. Create a GitHub repository named `yourusername.github.io`
2. Your domain will be: `yourusername.github.io`
3. Free forever, no registration needed
4. Example: `somriksur.github.io`

**Option B: Vercel Custom Domain (Free with Vercel)**
1. Deploy your app to Vercel (free)
2. Get free subdomain: `yourapp.vercel.app`
3. Can use this for email sending
4. Example: `hireflow.vercel.app`

**Option C: Free Subdomain Services**
- **DuckDNS** (duckdns.org) - Free subdomains like `yourapp.duckdns.org`
- **Afraid.org** - Free DNS hosting with subdomains
- **No-IP** (noip.com) - Free dynamic DNS

**Option D: Cheap Paid Domain (Recommended for Production)**
- **Namecheap** - $0.99/year for .xyz domains
- **Porkbun** - $1-3/year for various TLDs
- **Google Domains** - $12/year for .com

**Domain Suggestions:**
- `yourusername.github.io` (GitHub Pages)
- `hireflow-app.vercel.app` (Vercel)
- `yourapp.duckdns.org` (DuckDNS)
- `hireflow.xyz` (Cheap paid - $0.99/year)

#### Step 2: Add Domain to Resend (2 minutes)

1. Go to [Resend Domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain (e.g., `hireflow-app.tk`)
4. Click "Add Domain"

Resend will show you DNS records to add.

#### Step 3: Configure DNS Records (5 minutes)

Resend will provide records like:

```
TXT Record:
Name: @
Value: resend-verify=abc123xyz...

MX Record:
Name: @
Value: feedback-smtp.resend.com
Priority: 10

DKIM Records (3 records):
Name: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3...
```

**For GitHub Pages:**
1. Go to your repository settings
2. Pages → Custom domain
3. Add your domain
4. Go to your DNS provider (GitHub doesn't manage DNS directly)
5. You'll need to use Cloudflare (free) for DNS management
6. Add DNS records in Cloudflare

**For Vercel:**
1. Go to your project settings
2. Domains → Add domain
3. Vercel will show you DNS records
4. Add records in Vercel's DNS management

**For Cloudflare (Free DNS Management):**
1. Sign up at [Cloudflare](https://cloudflare.com)
2. Add your domain
3. Go to DNS → Records
4. Add each record:
   - **TXT Record**: Name: `@`, Content: `resend-verify=...`
   - **MX Record**: Name: `@`, Content: `feedback-smtp.resend.com`, Priority: `10`
   - **DKIM Records**: Add all 3 DKIM records as shown
5. Click "Save"

**For Other Providers:**
- **Namecheap**: Advanced DNS → Add Records
- **Porkbun**: DNS → Add Records
- **DuckDNS**: DNS Settings → Add Records

#### Step 4: Verify Domain (2-5 minutes)

1. Wait 2-5 minutes for DNS propagation
2. Go back to [Resend Domains](https://resend.com/domains)
3. Click "Verify Domain" next to your domain
4. Should show "✅ Verified" status

**If verification fails:**
- Wait a few more minutes (DNS can take up to 24 hours)
- Double-check DNS records match exactly
- Try clicking "Verify" again

#### Step 5: Update Your Configuration (1 minute)

Update `.env.local`:

```bash
# Change these lines:
EMAIL_DEV_MODE=false
VERIFIED_DOMAIN=hireflow-app.tk
SENDER_EMAIL=noreply@hireflow-app.tk
SENDER_NAME=HireFlow
```

#### Step 6: Test! (1 minute)

```bash
node test-universal-email.js
```

Enter ANY email address and it should work! 🎉

---

### Option 2: Use Your Own Domain

If you already have a domain (GoDaddy, Namecheap, etc.):

1. Follow Steps 2-6 above
2. Add DNS records to your domain provider
3. Use your domain in configuration

---

## 🧪 Testing Your Setup

### Test with Development Mode (Safe Testing)

Keep `EMAIL_DEV_MODE=true` to test without sending real emails:

```bash
# .env.local
EMAIL_DEV_MODE=true
DEV_EMAIL=your-email@gmail.com
```

All emails will go to `DEV_EMAIL` for testing.

### Test with Production Mode (Real Sending)

Once domain is verified:

```bash
# .env.local
EMAIL_DEV_MODE=false
VERIFIED_DOMAIN=yourdomain.tk
SENDER_EMAIL=noreply@yourdomain.tk
```

Now emails will go to actual recipients!

### Run Test Script

```bash
node test-universal-email.js
```

Try different email providers:
- Gmail: `test@gmail.com`
- Yahoo: `test@yahoo.com`
- Outlook: `test@outlook.com`
- Custom: `test@anydomain.com`

---

## 🔧 Configuration Reference

### Environment Variables

```bash
# Required
RESEND_API_KEY=re_xxxxx

# Mode Configuration
EMAIL_DEV_MODE=false          # true = dev mode, false = production
DEV_EMAIL=test@example.com    # Used in dev mode

# Sender Configuration (Required for production)
VERIFIED_DOMAIN=yourdomain.tk
SENDER_EMAIL=noreply@yourdomain.tk
SENDER_NAME=HireFlow
```

### Email Modes

| Mode | EMAIL_DEV_MODE | Behavior |
|------|----------------|----------|
| Development | `true` | All emails → DEV_EMAIL |
| Production | `false` | Emails → actual recipients |

---

## 🐛 Troubleshooting

### "Domain not verified" Error

**Problem:** Resend says domain isn't verified

**Solutions:**
1. Wait 5-10 minutes for DNS propagation
2. Check DNS records match exactly
3. Try verification again
4. Use dev mode for testing: `EMAIL_DEV_MODE=true`

### "Can only send testing emails" Error

**Problem:** Resend restricts sending to verified emails only

**Solutions:**
1. Verify a domain (follow steps above)
2. Use dev mode: `EMAIL_DEV_MODE=true`
3. Check SENDER_EMAIL uses verified domain

### DNS Records Not Propagating

**Problem:** DNS changes not taking effect

**Solutions:**
1. Wait up to 24 hours (usually 5-10 minutes)
2. Check DNS with: `nslookup -type=TXT yourdomain.tk`
3. Clear DNS cache: `sudo dscacheutil -flushcache` (Mac)
4. Try different DNS server

### Email Not Arriving

**Problem:** Email sent but not received

**Solutions:**
1. Check spam/junk folder
2. Wait 2-3 minutes for delivery
3. Check Resend dashboard for delivery status
4. Verify recipient email is correct
5. Check email logs in console

---

## 💡 Best Practices

### For Development

```bash
EMAIL_DEV_MODE=true
DEV_EMAIL=your-email@gmail.com
```

- All emails go to your test inbox
- Safe to test without affecting users
- Can see all email content

### For Production

```bash
EMAIL_DEV_MODE=false
VERIFIED_DOMAIN=yourdomain.tk
SENDER_EMAIL=noreply@yourdomain.tk
```

- Emails go to actual recipients
- Domain must be verified
- Monitor delivery in Resend dashboard

### Security

- Never commit `.env.local` to git
- Keep API keys secret
- Use environment-specific configurations
- Monitor email sending patterns

---

## 📊 Verification Checklist

- [ ] Domain registered (free or paid)
- [ ] Domain added to Resend
- [ ] DNS records configured
- [ ] Domain verified in Resend
- [ ] `.env.local` updated with domain
- [ ] `EMAIL_DEV_MODE=false` for production
- [ ] Test script runs successfully
- [ ] Emails arriving at test addresses

---

## 🎉 Success!

Once setup is complete:

✅ Send emails to ANY email address
✅ Gmail, Yahoo, Outlook, custom domains
✅ Professional sender address
✅ Reliable delivery
✅ Easy testing with dev mode

Your HireFlow application is ready to send interview invitations to any candidate! 🚀

---

## 📚 Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend Domain Verification](https://resend.com/docs/dashboard/domains/introduction)
- [DNS Record Types](https://www.cloudflare.com/learning/dns/dns-records/)
- [Freenom Help](https://www.freenom.com/en/support.html)

---

## 🆘 Need Help?

If you're stuck:

1. Check the troubleshooting section above
2. Review Resend dashboard for errors
3. Run test script with verbose logging
4. Check DNS propagation status
5. Try dev mode first to isolate issues

The most common issue is waiting for DNS propagation - give it 10-15 minutes!

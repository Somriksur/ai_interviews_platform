# 🌐 Domain Setup Guide - Send Emails to ANY Address

## 🎯 Goal

Enable your HireFlow application to send emails to **ANY email address** (Gmail, Yahoo, Outlook, custom domains, etc.) without restrictions.

## 📋 Current Status

- ✅ Email system implemented
- ✅ Resend API configured
- ⚠️ **Domain verification needed** for universal sending

## 🚀 Quick Setup (10-15 minutes)

### Option 1: Use a Free Domain (Recommended)

#### Step 1: Get a Free Domain (3 minutes)

**Free Domain Providers:**
- **Freenom** (freenom.com) - Free .tk, .ml, .ga, .cf, .gq domains
- **GitHub Pages** - Use yourusername.github.io
- **InfinityFree** - Free subdomain with hosting

**Recommended: Freenom**
1. Go to [Freenom.com](https://www.freenom.com)
2. Search for a domain name (e.g., "hireflow", "yourname-app")
3. Select a free TLD (.tk, .ml, .ga)
4. Click "Get it now!" → "Checkout"
5. Create free account (use 12 months free)
6. Complete registration

**Domain Suggestions:**
- `hireflow-app.tk`
- `yourname-interviews.ml`
- `recruit-platform.ga`

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

**For Freenom:**
1. Login to [Freenom](https://my.freenom.com)
2. Go to "Services" → "My Domains"
3. Click "Manage Domain" next to your domain
4. Click "Manage Freenom DNS"
5. Add each record:
   - **TXT Record**: Name: `@`, Target: `resend-verify=...`
   - **MX Record**: Name: `@`, Target: `feedback-smtp.resend.com`, Priority: `10`
   - **DKIM Records**: Add all 3 DKIM records as shown
6. Click "Save Changes"

**For Other Providers:**
- **GoDaddy**: DNS Management → Add Records
- **Namecheap**: Advanced DNS → Add Records
- **Cloudflare**: DNS → Add Records

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

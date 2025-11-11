# HireFlow - Complete Project Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Key Features](#key-features)
5. [Environment Setup](#environment-setup)
6. [Database Schema](#database-schema)
7. [File Explanations](#file-explanations)
8. [User Flows](#user-flows)
9. [API Endpoints](#api-endpoints)
10. [Deployment Guide](#deployment-guide)
11. [Troubleshooting](#troubleshooting)

---

## Project Overview

HireFlow is a full-stack interview platform that allows recruiters to create and manage technical interviews, and candidates to take voice-based interviews. The platform uses Google's Gemini AI for question generation and feedback analysis, and Vapi for voice interactions.

### What It Does
- **For Recruiters**: Create interviews, generate AI questions, invite candidates, view results
- **For Candidates**: Take voice interviews with AI, get detailed feedback
- **AI Features**: Question generation, voice interviews, automated feedback analysis

---

## Tech Stack

### Frontend
- **Next.js 15.5.4** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components

### Backend
- **Next.js API Routes** - Serverless functions
- **Firebase Admin SDK** - Database and authentication
- **Firestore** - NoSQL database

### AI & Voice
- **Google Gemini 2.0** - Question generation and feedback analysis
- **Vapi** - Voice AI for conducting interviews
- **Vercel AI SDK** - AI integration

---

## Project Structure

```
Ai_Interviews_Platform_main/
├── app/                          # Next.js App Router
│   ├── (root)/                   # Landing page
│   ├── auth/                     # Authentication pages
│   │   ├── sign-in/             # Login page
│   │   └── sign-up/             # Registration page
│   ├── candidate/               # Candidate features
│   │   ├── dashboard/           # Candidate home
│   │   ├── interview/[id]/      # Take interview
│   │   └── feedback/[id]/       # View feedback
│   ├── recruiter/               # Recruiter features
│   │   ├── dashboard/           # Recruiter home
│   │   ├── create-interview/    # Create interview
│   │   └── feedback/[id]/       # View results
│   ├── interview/               # Demo interview
│   └── api/                     # API routes
│       ├── candidate/           # Candidate APIs
│       ├── recruiter/           # Recruiter APIs
│       └── test-api-key/        # Test endpoint
├── components/                   # React components
│   ├── ui/                      # Shadcn components
│   ├── AuthForm.tsx             # Login/signup
│   ├── InterviewInvitation.tsx  # Email invites
│   ├── VoiceInterview.tsx       # Voice component
│   └── ...                      # Other components
├── lib/                         # Utilities
│   └── actions/                 # Server actions
├── firebase/                    # Firebase config
│   ├── admin.ts                 # Server-side
│   └── client.ts                # Client-side
├── types/                       # TypeScript types
├── constants/                   # App constants
└── public/                      # Static assets
```

---

## Key Features

### 1. User Authentication
- Two roles: Recruiter and Candidate
- Firebase email/password authentication
- Role-based access control
- Secure session management

### 2. Interview Creation (Recruiter)
- AI-powered question generation using Gemini
- Customizable parameters:
  - Role (Frontend Developer, etc.)
  - Level (Junior/Mid/Senior)
  - Type (Technical/Behavioral/Mixed)
  - Tech stack (React, Node.js, etc.)
  - Number of questions
- Email invitations with link sharing
- Multiple candidate tagging

### 3. Voice Interviews (Candidate)
- HireFlow interviewer via Vapi
- Real-time transcription
- Avatar display (user-avatar.png for candidate, robot.png for HireFlow)
- Live conversation view
- Optional code editor for typing answers

### 4. AI Feedback Analysis
- Gemini-powered evaluation
- Detailed scoring:
  - Technical Knowledge
  - Communication Skills
  - Problem Solving
  - Confidence & Professionalism
- Proportional scoring based on completion
- Specific strengths and improvements
- Overall assessment

### 5. Interview Management
- Dashboard for both roles
- Status tracking (Draft, Assigned, In-Progress, Completed)
- Results viewing
- Delete functionality

---

## Environment Setup

### Required Environment Variables

Create `.env.local` file:

```env
# Google Gemini AI - Get from https://aistudio.google.com/app/apikey
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Firebase Admin SDK - Get from Firebase Console → Service Accounts
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Firebase Client SDK - Get from Firebase Console → General Settings
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Vapi Voice AI - Get from https://dashboard.vapi.ai
VAPI_API_KEY=your_vapi_api_key
NEXT_PUBLIC_VAPI_WEB_TOKEN=your_vapi_web_token
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_assistant_id
```

### Setup Steps

1. **Google AI Studio**:
   - Go to https://aistudio.google.com/app/apikey
   - Create API key
   - Copy to `GOOGLE_GENERATIVE_AI_API_KEY`

2. **Firebase**:
   - Create project at https://console.firebase.google.com
   - Enable Authentication → Email/Password
   - Create Firestore database
   - Get credentials from Project Settings

3. **Vapi**:
   - Sign up at https://dashboard.vapi.ai
   - Create assistant
   - Copy API key and assistant ID

---

## Database Schema

### Collections

#### users
```typescript
{
  id: string;              // User ID
  name: string;            // Full name
  email: string;           // Email
  role: "recruiter" | "candidate";
  createdAt: string;       // ISO timestamp
}
```

#### interviews
```typescript
{
  id: string;              // Interview ID
  recruiterId: string;     // Creator ID
  role: string;            // Job role
  level: string;           // Junior/Mid/Senior
  type: string;            // Technical/Behavioral/Mixed
  techstack: string[];     // Technologies
  questions: string[];     // Questions
  status: string;          // draft/assigned/in-progress/completed
  candidateEmail?: string; // Assigned candidate
  candidateId?: string;    // Candidate ID
  createdAt: string;       // ISO timestamp
}
```

#### feedbacks
```typescript
{
  id: string;              // Feedback ID
  interviewId: string;     // Related interview
  candidateId: string;     // Candidate ID
  recruiterId: string;     // Recruiter ID
  totalScore: number;      // Overall score (0-100)
  categoryScores: Array<{
    name: string;          // Category
    score: number;         // Score (0-100)
    comment: string;       // Feedback
  }>;
  strengths: string[];     // Strong points
  areasForImprovement: string[];
  finalAssessment: string; // Summary
  transcript: Array<{
    role: string;          // "user" or "assistant"
    content: string;       // Message
  }>;
  createdAt: string;       // ISO timestamp
}
```

---

## File Explanations

> **Note: For detailed code explanations with line-by-line breakdowns, see `CODE_EXPLANATIONS.md`**

### Authentication Files

**`components/AuthForm.tsx`**
- Handles login and registration
- Single component for both flows
- Firebase authentication
- Form validation with Zod
- Role selection (recruiter/candidate)
- Redirect handling after login

**`app/auth/sign-in/page.tsx` & `sign-up/page.tsx`**
- Authentication pages
- Wrapped in Suspense for useSearchParams
- Dynamic rendering
- Handles redirect parameter

### Interview Creation

**`app/recruiter/create-interview/page.tsx`**
- Form for creating interviews
- Multi-step: details → questions → assign
- AI question generation button
- Tech stack input
- Candidate email assignment

**`app/api/recruiter/generate-questions/route.ts`**
- API for AI question generation
- Uses Google Gemini 2.0
- Validates recruiter auth
- Generates based on parameters
- Returns JSON array

### Interview Taking

**`app/candidate/interview/[id]/page.tsx`**
- Main interview page
- Authentication check
- Vapi voice integration
- Real-time transcript
- Code editor for typing
- Submit on completion

**`components/VoiceInterview.tsx`**
- Standalone voice component
- Vapi SDK integration
- Call status management
- Transcript with avatars
- Auto-scroll

### Feedback & Analysis

**`app/api/candidate/submit-interview/route.ts`**
- Processes completed interviews
- Calls Gemini for analysis
- Generates detailed feedback
- Proportional scoring
- Saves to Firestore
- Updates status

**`app/candidate/feedback/[id]/page.tsx`**
- Displays feedback to candidates
- Overall score
- Category breakdown
- Strengths and improvements
- Full transcript

**`app/recruiter/feedback/[id]/page.tsx`**
- Shows results to recruiters
- Same feedback view
- Additional candidate info
- Interview details

### Invitation System

**`components/InterviewInvitation.tsx`**
- Email tagging and link sharing
- Add multiple emails
- Email validation
- Visual chips with remove
- Copy link to clipboard
- Send bulk invitations

**`app/api/recruiter/send-invitations/route.ts`**
- API for sending invitations
- Validates recruiter auth
- Accepts email array
- Email HTML template
- Ready for email service integration

### Dashboard Files

**`app/recruiter/dashboard/page.tsx`**
- Recruiter home page
- Statistics display
- List of interviews
- Candidate results
- Create button
- Delete functionality

**`app/candidate/dashboard/page.tsx`**
- Candidate home page
- Statistics
- Available interviews
- Completed interviews
- Start interview button

### Utility Files

**`lib/actions/auth.action.ts`**
- `signUp()`: Create user
- `signIn()`: Validate and create session
- `getCurrentUser()`: Get current user
- `signOut()`: Clear session

**`lib/actions/recruiter.action.ts`**
- `getInterviewsByRecruiterId()`: Fetch interviews
- `getFeedbacksByRecruiterId()`: Fetch results
- `createInterview()`: Save interview

**`lib/actions/candidate.action.ts`**
- `getAvailableInterviews()`: Get assigned
- `getCandidateInterviews()`: Get completed
- `startInterview()`: Mark in-progress

### Configuration

**`firebase/admin.ts`**
- Firebase Admin SDK (server-side)
- Database operations
- Auth verification

**`firebase/client.ts`**
- Firebase Client SDK (browser)
- User authentication
- Client operations

**`types/index.d.ts`**
- TypeScript definitions
- Interview, Feedback, User interfaces
- Component props
- API parameters

---

## User Flows

### Creating an Interview
```
Recruiter Dashboard
  ↓
Create Interview Page
  ↓
Fill Form → Generate Questions (Gemini API)
  ↓
Review Questions → Enter Candidate Email
  ↓
Submit → Creates in Firestore
  ↓
Back to Dashboard
```

### Taking an Interview
```
Candidate receives link/email
  ↓
Clicks link → Sign-in (if not logged in)
  ↓
After sign-in → Interview page
  ↓
Loads interview details
  ↓
Clicks "Start Interview"
  ↓
Vapi connects → AI asks questions
  ↓
Candidate answers via voice
  ↓
Transcript captured
  ↓
Interview ends → Submit
  ↓
Gemini analyzes → Generates feedback
  ↓
Saves feedback → Redirects to results
```

### Inviting Candidates
```
Recruiter Dashboard → Interview Card
  ↓
Click "Invite Candidates"
  ↓
Panel expands → Add emails
  ↓
Option 1: Copy link → Share manually
Option 2: Send Invitations → API sends emails
  ↓
Candidates receive email
  ↓
Click link → Sign in → Take interview
```

---

## API Endpoints

### Recruiter APIs
- `POST /api/recruiter/generate-questions` - Generate questions
- `POST /api/recruiter/create-interview` - Create interview
- `POST /api/recruiter/send-invitations` - Send emails
- `DELETE /api/recruiter/delete-interview/[id]` - Delete interview
- `DELETE /api/recruiter/delete-feedback/[id]` - Delete feedback

### Candidate APIs
- `GET /api/candidate/interview/[id]` - Get interview
- `POST /api/candidate/submit-interview` - Submit interview
- `DELETE /api/candidate/delete-feedback/[id]` - Delete feedback

### Test APIs
- `GET /api/test-api-key` - Verify env variables
- `GET /api/test-gemini` - Test Gemini connection

---

## Deployment Guide

### Step 1: Local Testing

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Test all features
# - Sign up as recruiter
# - Create interview
# - Generate questions
# - Sign up as candidate
# - Take interview
```

### Step 2: Deploy to Vercel

#### Using Vercel CLI
```bash
# Install CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### Using Git
1. Push to GitHub/GitLab/Bitbucket
2. Go to https://vercel.com/new
3. Import repository
4. Auto-deploys on push

### Step 3: Configure Vercel Environment Variables

1. Go to: Project Settings → Environment Variables
2. Add each variable from `.env.local`
3. Select all environments (Production, Preview, Development)
4. Click Save

**Important for `FIREBASE_PRIVATE_KEY`**:
- Keep the quotes
- Keep the `\n` characters
- Paste exactly as in JSON

### Step 4: Verify Deployment

Test these URLs:

1. **API Key Test**:
   ```
   https://your-app.vercel.app/api/test-api-key
   ```
   Should show: `"hasApiKey": true`

2. **Gemini Test**:
   ```
   https://your-app.vercel.app/api/test-gemini
   ```
   Should show: `"success": true`

3. **App Test**:
   - Sign up
   - Create interview
   - Generate questions
   - Take interview

---

## 🐛 Troubleshooting

### Issue 1: "API key expired"

**Symptoms**: Question generation fails

**Solution**:
1. Go to https://aistudio.google.com/app/apikey
2. Create new API key
3. Update in Vercel:
   - Delete `GOOGLE_GENERATIVE_AI_API_KEY`
   - Add it again with new value
4. Redeploy: `vercel --prod --force`

### Issue 2: Environment variables not updating

**Symptoms**: Updated in Vercel but still old value

**Solution**:
1. Delete and re-add variable (don't edit)
2. Clear build cache:
   - Deployments → Latest → "..." → Redeploy
   - Uncheck "Use existing Build Cache"
3. Or: `git commit --allow-empty -m "redeploy" && git push`

### Issue 3: "No session cookie found"

**Symptoms**: Warnings in logs

**Solution**: This is normal! Not an error. Happens for unauthenticated requests.

### Issue 4: Firebase auth not working

**Solution**:
1. Firebase Console → Authentication → Sign-in method
2. Enable Email/Password
3. Verify all Firebase env variables
4. Check project ID matches

### Issue 5: Vapi not starting

**Solution**:
1. Check `NEXT_PUBLIC_VAPI_ASSISTANT_ID` is set
2. Verify assistant exists in Vapi dashboard
3. Check browser console
4. Grant microphone permissions

### Issue 6: Build fails

**Solution**:
1. Run locally: `npm run build`
2. Fix TypeScript errors
3. Check imports
4. Verify types
5. Push and redeploy

---

## 🔍 Debugging Tips

### Check Vercel Logs
```
Dashboard → Project → Deployments → Latest → Logs
```

Look for:
- 🔑 API Key available: true/false
- ❌ Error messages
- Console outputs

### Test API Endpoints
```bash
# Test API key
curl https://your-app.vercel.app/api/test-api-key

# Test Gemini
curl https://your-app.vercel.app/api/test-gemini
```

### Check Firebase Console
- Authentication → Users
- Firestore → Data
- Usage stats

### Browser DevTools
- Console: JavaScript errors
- Network: API calls
- Application: Cookies

---

## Pre-Launch Checklist

- [ ] All env variables in Vercel
- [ ] Firebase auth enabled
- [ ] Vapi assistant created
- [ ] Google AI key valid
- [ ] Test sign-up flow
- [ ] Test interview creation
- [ ] Test question generation
- [ ] Test voice interview
- [ ] Test feedback generation
- [ ] Test email invitations
- [ ] Check mobile responsive
- [ ] Verify all links
- [ ] Test error scenarios
- [ ] Check Vercel logs
- [ ] Set up monitoring

---

## Success Indicators

Deployment successful when:
- `/api/test-api-key` shows `hasApiKey: true`
- `/api/test-gemini` shows `success: true`
- Can sign up and sign in
- Can create interviews
- Questions generate
- Voice interviews work
- Feedback generates
- No errors in logs

---

## Development Commands

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Deploy to Vercel
vercel --prod

# Force redeploy
vercel --prod --force
```

---

## Quick Reference

### Important URLs
- Google AI Studio: https://aistudio.google.com/app/apikey
- Firebase Console: https://console.firebase.google.com
- Vapi Dashboard: https://dashboard.vapi.ai
- Vercel Dashboard: https://vercel.com

### Key Concepts
- **Role-based access**: Different dashboards for recruiter/candidate
- **Authentication flow**: Firebase → Session cookie → Protected routes
- **AI integration**: Gemini for questions/feedback, Vapi for voice
- **Real-time updates**: Transcript during interview, status changes
- **Error handling**: Try-catch everywhere, user-friendly messages

---

**Built using Next.js, Firebase, and AI**

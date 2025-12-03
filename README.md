# HireFlow - AI Campus Placement Platform

A comprehensive Next.js platform for managing campus placements with AI-powered interview assessments, connecting organizations, colleges, and students. Built with Next.js 15, TypeScript, Firebase, and advanced AI/NLP capabilities.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.5.0-orange)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Table of Contents

- [Features](#features)
  - [For Organizations/Recruiters](#for-organizationsrecruiters)
  - [For Colleges](#for-colleges)
  - [For Students](#for-students)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [User Flows](#user-flows)
 - [Key Features](#key-features)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Database Schema](#database-schema)
- [Available Scripts](#available-scripts)
- [Development Workflow](#development-workflow)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd hireflow

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase credentials

# Run development server
npm run dev

# Open http://localhost:3000
```

## Features

### For Organizations/Recruiters
- **Job Management**: Create and manage job postings with detailed profiles
- **College Targeting**: Tag colleges for recruitment drives with normalized college name system
- **Interview Drives**: Create AI-powered interview drives with auto-generated questions
- **Student Reports**: View comprehensive AI-generated evaluation reports with sentiment analysis
- **Candidate Selection**: Select candidates based on AI assessments and behavioral analysis
- **Analytics Dashboard**: Track recruitment metrics and student performance
- **Notification System**: Real-time notifications for college responses and student selections

### For Colleges
- **Student Registration Management**: Approve/reject student registration requests with validation
- **Job Notifications**: Receive and respond to job notifications from organizations
- **Interview Drive Management**: Assign students to interview drives and track participation
- **Student Upload**: Bulk upload students via Excel/CSV files
- **Performance Tracking**: Monitor student performance and selection rates
- **Messaging System**: Communicate with organizations and students
- **Analytics**: View college-wide placement statistics and trends
- **Drive Selections**: Track student selections across all interview drives

### For Students
- **Registration Flow**: Register with college credentials and await approval
- **Status Checking**: Check registration status before approval
- **AI Interviews**: Take AI-powered interview assessments with real-time evaluation
- **Dashboard**: Personalized dashboard with assigned interviews and notifications
- **Job Recommendations**: Receive AI-powered job recommendations based on profile
- **Interview History**: View past interviews and performance reports
- **Notifications**: Real-time updates on interview assignments and selections
- **Profile Management**: Manage student profile and academic information

## Tech Stack

### Core Technologies
- **Framework:** Next.js 15.5.4 with Turbopack (React 19.1.0)
- **Language:** TypeScript 5
- **Database:** Firebase Firestore with Firebase Admin SDK
- **Authentication:** Firebase Auth with role-based access control
- **Styling:** Tailwind CSS 4 with tailwindcss-animate

### AI/ML & NLP
- **AI Models:** 
  - Google Generative AI (Gemini) via @ai-sdk/google
  - Groq SDK for fast inference
  - OpenAI integration
- **NLP Services:** 
  - Custom sentiment and behavioral analysis
  - Answer evaluation with context understanding
  - Automated feedback generation
- **Interview System:** AI-powered question generation and evaluation

### UI Components & Libraries
- **Component Library:** shadcn/ui with Radix UI primitives
- **Forms:** React Hook Form with Zod validation
- **Rich Text:** TipTap editor with code highlighting (Prism.js, Lowlight)
- **Code Editor:** Monaco Editor
- **Charts:** Recharts for analytics visualization
- **Icons:** Lucide React
- **Notifications:** Sonner for toast notifications
- **Search:** Fuse.js for fuzzy search

### Testing & Quality
- **Testing Framework:** Jest with fast-check for property-based testing
- **Test Coverage:** Comprehensive unit and integration tests
- **Type Safety:** Full TypeScript coverage with strict mode

### Additional Features
- **File Processing:** 
  - Excel/CSV parsing (xlsx)
  - PDF generation (jsPDF with autotable)
  - Document parsing (mammoth, pdf-parse)
- **Voice Integration:** VAPI for voice-based interviews
- **Email:** Nodemailer and Resend for notifications
- **Date Handling:** Day.js for date manipulation
- **HTTP Client:** Axios for external API calls

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager
- Firebase project with:
  - Firestore database enabled
  - Authentication enabled (Email/Password provider)
  - Firebase Admin SDK credentials
- Python 3.x (optional, for AI proxy server)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd hireflow
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (for server-side operations)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY=your_private_key

# AI/ML API Keys (optional, based on features used)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key

# Email Configuration (optional)
RESEND_API_KEY=your_resend_api_key
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password

# VAPI Configuration (optional, for voice interviews)
VAPI_API_KEY=your_vapi_api_key
```

4. **Configure Firebase**

Set up Firestore security rules and indexes:
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

5. **Run database migrations (if needed)**
```bash
# Migrate college names to normalized format
npm run migrate:college-names

# Fix existing college data
npm run fix-colleges
```

6. **Start the development server**
```bash
npm run dev
```

7. **Open the application**

Navigate to [http://localhost:3000](http://localhost:3000)

### Optional: AI Proxy Server

If using the Python-based AI proxy:
```bash
nohup python3 gradio-proxy-v2.py > proxy.log 2>&1 &
```

## User Flows

### Student Registration & Onboarding Flow
1. **Sign Up**: Student creates account at `/auth/sign-in` (Firebase Auth)
2. **Registration**: Student submits registration request at `/student/register` with college details
3. **Status Check**: Student can check approval status at `/student/check-status`
4. **Approval**: College admin reviews and approves/rejects at `/college/{collegeId}/registration-requests`
5. **Access**: Approved student signs in and accesses dashboard at `/student/[studentId]/dashboard`

### Job Posting & Notification Flow
1. **Job Creation**: Organization creates job posting with detailed profile
2. **College Tagging**: Organization tags relevant colleges for the job
3. **Notification**: Tagged colleges receive job notifications
4. **Response**: College admins respond (accept/reject) at `/college/{collegeId}/job-notifications`
5. **Tracking**: Organization tracks college responses and participation

### Interview Drive Flow
1. **Drive Creation**: Organization creates interview drive at `/organization/{orgId}/interview-drives/create`
2. **AI Questions**: System generates AI-powered interview questions based on job profile
3. **College Notification**: Colleges receive drive notifications
4. **Student Assignment**: College assigns eligible students at `/college/{collegeId}/interview-drives/{driveId}/assign-students`
5. **Interview**: Students take AI interviews at `/student/{studentId}/interview/{driveId}/conduct`
6. **Evaluation**: AI evaluates answers with NLP and sentiment analysis
7. **Reports**: Organization reviews comprehensive reports at `/organization/{orgId}/interview-drives/{driveId}/reports`
8. **Selection**: Organization selects candidates based on AI recommendations
9. **Notification**: Selected students receive notifications

### Bulk Student Upload Flow
1. College admin navigates to `/college/{collegeId}/upload-students`
2. Uploads Excel/CSV file with student data
3. System validates and processes student records
4. Students are created with normalized college association
5. Students can now register and link their accounts

### Messaging & Communication Flow
1. Organizations send messages to colleges
2. Colleges view messages at `/college/{collegeId}/messages`
3. Colleges can respond and track communication history
4. Real-time notification system keeps all parties updated

## Key Features

### AI-Powered Interview System
- **Question Generation**: Automatic generation using Google Gemini, Groq, and OpenAI models
- **NLP Evaluation**: Advanced natural language processing for answer evaluation
- **Sentiment Analysis**: Behavioral and emotional analysis of responses
- **Context Understanding**: AI understands context and provides relevant follow-ups
- **Comprehensive Reports**: Detailed evaluation reports with recommendations
- **Voice Integration**: VAPI integration for voice-based interviews

### Advanced NLP & Analytics
- **Answer Evaluation**: Multi-dimensional scoring (technical accuracy, communication, problem-solving)
- **Behavioral Analysis**: Personality traits and soft skills assessment
- **Sentiment Detection**: Emotional intelligence and confidence measurement
- **Feedback Generation**: Automated constructive feedback for candidates
- **Performance Trends**: Analytics and visualization of student performance

### Multi-Role Access Control
- **Organizations**: Full recruitment lifecycle management
- **Colleges**: Student coordination and placement tracking
- **Students**: Interview participation and career tracking
- **Role-Based Permissions**: Secure access control with Firebase Auth
- **Admin Dashboards**: Customized dashboards for each role

### Comprehensive Notification System
- **Job Notifications**: Real-time alerts for new job opportunities
- **Drive Notifications**: Interview drive assignments and updates
- **Registration Notifications**: Student approval/rejection alerts
- **Selection Notifications**: Candidate selection announcements
- **Message Notifications**: Communication alerts between parties
- **Mark as Read**: Notification management and tracking

### College Name Normalization System
- **Case-Insensitive Search**: Fuzzy search with Fuse.js
- **Normalized Storage**: Consistent college name format (lowercase, trimmed)
- **Automatic Migration**: Scripts to migrate existing data
- **Validation Middleware**: Ensures data consistency across the platform
- **Resolution Service**: Handles college name conflicts and duplicates

### Student Management
- **Registration Workflow**: Multi-step approval process
- **Bulk Upload**: Excel/CSV import for batch student creation
- **Profile Management**: Comprehensive student profiles with academic data
- **Interview History**: Track all past interviews and performance
- **Job Recommendations**: AI-powered job matching based on skills and performance

### Reporting & Export
- **PDF Reports**: Generate comprehensive PDF reports with jsPDF
- **Excel Export**: Export data to Excel format
- **Performance Analytics**: Visual charts and graphs with Recharts
- **Custom Reports**: Configurable report templates
- **Batch Processing**: Generate reports for multiple students

### Security & Validation
- **Firebase Security Rules**: Comprehensive Firestore security rules
- **Input Validation**: Zod schema validation for all forms
- **Access Control Middleware**: Role-based access verification
- **Security Event Logging**: Track security-related events
- **Data Sanitization**: Prevent injection attacks and XSS

## Project Structure

```
hireflow/
├── app/                           # Next.js 15 App Router
│   ├── (root)/                   # Root layout and landing page
│   ├── api/                      # API Routes (Server-side)
│   │   ├── ai/                   # AI question generation
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── candidate/            # Candidate portal APIs
│   │   ├── colleges/             # College management APIs
│   │   │   ├── __tests__/       # College API tests
│   │   │   ├── [collegeId]/     # Dynamic college routes
│   │   │   ├── by-admin/        # Get colleges by admin
│   │   │   └── search/          # College search
│   │   ├── interview-drives/     # Interview drive management
│   │   ├── interview-sessions/   # Interview session tracking
│   │   ├── job-notifications/    # Job notification system
│   │   ├── job-postings/         # Job posting management
│   │   ├── job-profiles/         # Job profile management
│   │   ├── nlp/                  # NLP evaluation services
│   │   ├── organization/         # Organization management
│   │   ├── registration-requests/ # Student registration
│   │   ├── reports/              # Report generation
│   │   ├── students/             # Student management
│   │   ├── users/                # User management
│   │   └── vapi/                 # Voice interview integration
│   ├── auth/                     # Authentication pages
│   │   └── sign-in/             # Sign in/Sign up page
│   ├── college/                  # College Admin Portal
│   │   └── [collegeId]/         # Dynamic college routes
│   │       ├── analytics/       # College analytics
│   │       ├── categorization/  # Student categorization
│   │       ├── dashboard/       # College dashboard
│   │       ├── drive-selections/ # Interview selections
│   │       ├── interview-drives/ # Drive management
│   │       ├── job-notifications/ # Job notifications
│   │       ├── messages/        # Organization messages
│   │       ├── registration-requests/ # Student approvals
│   │       ├── reports/         # College reports
│   │       ├── selections/      # Student selections
│   │       ├── students/        # Student management
│   │       └── upload-students/ # Bulk student upload
│   ├── organization/             # Organization/Recruiter Portal
│   │   └── [orgId]/             # Dynamic organization routes
│   │       ├── categorization/  # Candidate categorization
│   │       ├── colleges/        # College management
│   │       ├── interview-drives/ # Interview drive creation
│   │       ├── job-postings/    # Job posting management
│   │       ├── job-profiles/    # Job profile management
│   │       ├── reports/         # Organization reports
│   │       ├── students/        # Student/candidate view
│   │       └── tag-colleges/    # College tagging
│   ├── student/                  # Student Portal
│   │   ├── check-status/        # Registration status check
│   │   ├── register/            # Student registration
│   │   └── [studentId]/         # Dynamic student routes
│   │       ├── dashboard/       # Student dashboard
│   │       ├── interview/       # Interview pages
│   │       ├── notifications/   # Student notifications
│   │       └── profile/         # Profile management
│   ├── onboarding/              # User onboarding flow
│   ├── notifications/           # Notification center
│   ├── search/                  # Global search
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── favicon.ico              # App icon
│
├── components/                   # React Components
│   ├── college/                 # College-specific components
│   │   └── Navigation.tsx       # College navigation
│   ├── messages/                # Message components
│   │   └── MessageCard.tsx      # Message display
│   ├── notifications/           # Notification components
│   │   └── NotificationBadge.tsx # Notification badge
│   ├── reports/                 # Report components
│   │   ├── __tests__/          # Report component tests
│   │   ├── ComprehensiveReportView.tsx
│   │   ├── RecommendationBadge.tsx
│   │   └── ReportExporter.tsx
│   ├── student/                 # Student components
│   │   ├── CollegeSearchInput.tsx
│   │   ├── Navigation.tsx
│   │   └── SelectionStatusCard.tsx
│   └── ui/                      # shadcn/ui components
│       ├── alert.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── dialog.tsx
│       ├── select.tsx
│       └── textarea.tsx
│
├── lib/                          # Library & Utilities
│   ├── actions/                 # Server Actions
│   │   ├── __tests__/
│   │   └── auth.action.ts       # Authentication actions
│   ├── middleware/              # Custom Middleware
│   │   ├── __tests__/
│   │   ├── access-control.ts    # Role-based access control
│   │   └── college-validation.ts # College validation
│   ├── nlp/                     # NLP Services
│   │   └── sentiment-behavior-analysis.ts
│   ├── services/                # Business Logic Services
│   │   ├── __tests__/
│   │   ├── categorization.service.ts
│   │   ├── college-name.service.ts
│   │   ├── college-resolution.service.ts
│   │   ├── migration-validation.service.ts
│   │   ├── nlp-evaluation.service.ts
│   │   └── notification.service.ts
│   └── utils.ts                 # Utility functions
│
├── types/                        # TypeScript Definitions
│   ├── __tests__/               # Type tests
│   ├── campus.ts                # Campus types
│   ├── drive-notification.ts    # Drive notification types
│   ├── evaluation-report.ts     # Evaluation report types
│   ├── index.d.ts               # Main type definitions
│   ├── job-notification.ts      # Job notification types
│   ├── job-posting.ts           # Job posting types
│   ├── messages.ts              # Message types
│   ├── registration-request.ts  # Registration request types
│   ├── student-selection.ts     # Student selection types
│   └── vapi.d.ts                # VAPI type definitions
│
├── firebase/                     # Firebase Configuration
│   ├── config.ts                # Firebase client config
│   └── admin.ts                 # Firebase Admin SDK config
│
├── scripts/                      # Utility Scripts
│   ├── __tests__/               # Script tests
│   ├── clear-database-data.ts   # Clear database utility
│   ├── fix-existing-colleges.ts # Fix college data
│   ├── migrate-college-names.ts # Migrate college names
│   └── migrate-recruiter-to-organization.ts
│
├── public/                       # Static Assets
│   ├── images/
│   └── icons/
│
├── .kiro/                        # Kiro Specs (Feature Specs)
│   └── specs/
│       └── college-name-primary-key/
│           ├── requirements.md
│           ├── design.md
│           └── tasks.md
│
├── docs/                         # Documentation
│
├── .env.local                    # Environment variables (local)
├── .env.example                  # Environment variables template
├── firebase.json                 # Firebase configuration
├── firestore.rules              # Firestore security rules
├── firestore.indexes.json       # Firestore indexes
├── jest.config.js               # Jest configuration
├── jest.setup.js                # Jest setup
├── next.config.mjs              # Next.js configuration
├── tsconfig.json                # TypeScript configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## API Endpoints

### Authentication & Users
- `GET /api/auth/me` - Get current authenticated user
- `GET /api/users/[userId]` - Get user details
- `PUT /api/users/[userId]` - Update user profile

### Students
- `POST /api/students/registration-requests` - Submit registration request
- `GET /api/students/by-user/[userId]` - Get student by user ID
- `GET /api/students/by-email/[email]` - Get student by email
- `GET /api/students/[studentId]` - Get student profile
- `PUT /api/students/[studentId]` - Update student profile
- `GET /api/students/[studentId]/assigned-drives` - Get assigned interview drives
- `GET /api/students/[studentId]/assigned-interviews` - Get assigned interviews
- `GET /api/students/[studentId]/dashboard` - Get student dashboard data
- `GET /api/students/[studentId]/notifications` - Get student notifications
- `PUT /api/students/[studentId]/notifications/[notificationId]` - Update notification
- `POST /api/students/[studentId]/notifications/mark-read` - Mark notifications as read
- `GET /api/students/[studentId]/reports` - Get student evaluation reports
- `GET /api/students/[studentId]/interviews` - Get interview history
- `GET /api/students/[studentId]/job-recommendations` - Get AI job recommendations

### Colleges
- `GET /api/colleges/search` - Search colleges with fuzzy matching
- `GET /api/colleges/[collegeId]` - Get college details
- `GET /api/colleges/by-admin/[adminId]` - Get colleges by admin
- `GET /api/colleges/[collegeId]/registration-requests` - Get registration requests
- `POST /api/colleges/[collegeId]/upload-students` - Bulk upload students
- `GET /api/colleges/[collegeId]/job-notifications` - Get job notifications
- `GET /api/colleges/[collegeId]/notifications` - Get all notifications
- `PUT /api/colleges/[collegeId]/notifications/[notificationId]` - Update notification
- `GET /api/colleges/[collegeId]/messages` - Get messages from organizations
- `GET /api/colleges/[collegeId]/messages/[messageId]` - Get specific message
- `GET /api/colleges/[collegeId]/reports` - Get college reports
- `GET /api/colleges/[collegeId]/selections` - Get student selections
- `GET /api/colleges/[collegeId]/drive-selections` - Get interview drive selections
- `POST /api/colleges/[collegeId]/interview-drives/[driveId]/tag-students` - Tag students for drive

### Registration Requests
- `POST /api/registration-requests/[requestId]/approve` - Approve student registration
- `POST /api/registration-requests/[requestId]/reject` - Reject student registration

### Organizations
- `GET /api/organization/[orgId]` - Get organization details
- `POST /api/organization/create` - Create new organization
- `GET /api/organization/by-admin/[adminId]` - Get organizations by admin
- `GET /api/organization/[orgId]/students` - Get all students for organization
- `GET /api/organization/[orgId]/reports` - Get organization reports
- `POST /api/organization/[orgId]/job-postings` - Create job posting
- `GET /api/organization/[orgId]/interview-drives` - Get interview drives
- `POST /api/organization/[orgId]/interview-drives` - Create interview drive
- `GET /api/organization/[orgId]/interview-drives/[driveId]/students` - Get drive students
- `POST /api/organization/[orgId]/interview-drives/[driveId]/select-student` - Select student
- `GET /api/organization/[orgId]/interview-drives/[driveId]/reports` - Get drive reports

### Job Postings & Notifications
- `GET /api/job-profiles` - Get all job profiles
- `POST /api/job-profiles` - Create job profile
- `GET /api/job-profiles/[jobId]` - Get job profile details
- `PUT /api/job-profiles/[jobId]` - Update job profile
- `POST /api/job-postings/[jobId]/tag-colleges` - Tag colleges for job posting
- `GET /api/job-postings/[jobId]/students` - Get students for job posting
- `POST /api/job-postings/[jobId]/select-students` - Select students for job
- `GET /api/job-notifications` - Get all job notifications
- `POST /api/job-notifications/[notificationId]/respond` - Respond to job notification

### Interview Drives
- `GET /api/interview-drives/[driveId]` - Get interview drive details
- `POST /api/interview-drives/[driveId]/assign-students` - Assign students to drive
- `POST /api/interview-drives/[driveId]/generate-reports` - Generate AI reports
- `GET /api/drive-notifications/[notificationId]/respond` - Respond to drive notification

### Interview Sessions
- `POST /api/interview-sessions` - Create interview session
- `GET /api/interview-sessions/[sessionId]` - Get interview session
- `PUT /api/interview-sessions/[sessionId]` - Update interview session

### AI & NLP
- `POST /api/ai/generate-questions` - Generate AI interview questions
- `POST /api/nlp/evaluate` - Evaluate interview answers with NLP
- `POST /api/nlp/generate-feedback` - Generate AI feedback

### Reports & Export
- `POST /api/reports/export` - Export reports to PDF/Excel

### Notifications
- `GET /api/notifications` - Get all notifications
- `PUT /api/notifications/[id]` - Update notification
- `POST /api/notifications/mark-all-read` - Mark all notifications as read

### Security & Debug
- `POST /api/security/log-event` - Log security event
- `GET /api/debug/drive-selections` - Debug drive selections (dev only)

### VAPI (Voice Interviews)
- `POST /api/vapi/token` - Get VAPI authentication token

### Candidate Portal (Alternative Interview System)
- `POST /api/candidate/interview` - Start candidate interview
- `POST /api/candidate/submit-interview` - Submit interview answers
- `GET /api/candidate/history` - Get interview history
- `GET /api/candidate/learning-path` - Get personalized learning path
- `DELETE /api/candidate/delete-interview` - Delete interview
- `DELETE /api/candidate/delete-feedback` - Delete feedback

## Testing

The project includes comprehensive test coverage using Jest and fast-check for property-based testing.

### Running Tests

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run specific test file:
```bash
npm test -- path/to/test.ts
```

Run tests with coverage:
```bash
npm test -- --coverage
```

### Test Structure

Tests are organized alongside source files with `__tests__` directories:

```
app/api/
├── students/
│   ├── __tests__/
│   │   ├── assigned-interviews.test.ts
│   │   ├── profile-creation.test.ts
│   │   └── registration-requests.test.ts
│   └── [studentId]/
├── colleges/
│   ├── __tests__/
│   │   ├── search.test.ts
│   │   ├── upload-students.test.ts
│   │   └── error-handling.test.ts
│   └── [collegeId]/
└── ...
```

### Test Categories

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and workflows
- **Property-Based Tests**: Test properties that should hold for all inputs (using fast-check)
- **Component Tests**: Test React components and UI interactions

### Key Test Files

- `app/api/students/__tests__/` - Student API tests
- `app/api/colleges/__tests__/` - College API tests
- `app/api/job-notifications/__tests__/` - Job notification workflow tests
- `app/api/registration-requests/__tests__/` - Registration approval tests
- `lib/services/__tests__/` - Service layer tests
- `lib/middleware/__tests__/` - Middleware and access control tests
- `components/reports/__tests__/` - Report component tests
- `scripts/__tests__/` - Migration and utility script tests

## Database Schema

### Firestore Collections

#### Core Collections
- **`users`** - User authentication and profile data
  - Fields: uid, email, role, displayName, createdAt, updatedAt
  - Roles: student, college_admin, organization_admin

- **`students`** - Student profiles and academic information
  - Fields: userId, email, name, college, collegeName, normalizedCollegeName, department, graduationYear, skills, resume, createdAt
  - Indexes: normalizedCollegeName, email, userId

- **`colleges`** - College/institution information
  - Fields: name, normalizedName, adminId, location, website, contactEmail, studentsCount, createdAt
  - Indexes: normalizedName, adminId

- **`organizations`** - Recruiting organization profiles
  - Fields: name, adminId, industry, website, description, contactEmail, createdAt
  - Indexes: adminId

#### Job & Recruitment Collections
- **`jobPostings`** - Job posting details
  - Fields: organizationId, title, description, requirements, skills, location, salary, type, status, createdAt
  - Indexes: organizationId, status

- **`jobProfiles`** - Detailed job profiles for AI matching
  - Fields: title, description, requiredSkills, preferredSkills, experience, education, responsibilities

- **`jobNotifications`** - Job notifications sent to colleges
  - Fields: jobPostingId, collegeId, organizationId, status, response, sentAt, respondedAt
  - Indexes: collegeId, jobPostingId, status

#### Interview Collections
- **`interviewDrives`** - Interview drive campaigns
  - Fields: organizationId, jobPostingId, title, description, questions, startDate, endDate, status, aiGenerated
  - Indexes: organizationId, status

- **`driveNotifications`** - Interview drive notifications to colleges
  - Fields: driveId, collegeId, organizationId, status, response, sentAt, respondedAt
  - Indexes: collegeId, driveId, status

- **`interviewSessions`** - Individual student interview sessions
  - Fields: studentId, driveId, answers, evaluation, score, status, startedAt, completedAt
  - Indexes: studentId, driveId, status

- **`studentSelections`** - Student selection results
  - Fields: studentId, driveId, organizationId, status, selectedAt, recommendation, aiScore
  - Indexes: studentId, driveId, organizationId, status

#### Registration & Approval Collections
- **`registrationRequests`** - Student registration approval requests
  - Fields: studentId, collegeId, collegeName, status, requestedAt, reviewedAt, reviewedBy
  - Indexes: collegeId, status, studentId

#### Communication Collections
- **`messages`** - Messages between organizations and colleges
  - Fields: senderId, recipientId, subject, body, read, sentAt
  - Indexes: recipientId, read

- **`notifications`** - General notification system
  - Fields: userId, type, title, message, read, createdAt, metadata
  - Indexes: userId, read, type

#### Evaluation & Reports Collections
- **`evaluationReports`** - AI-generated evaluation reports
  - Fields: studentId, sessionId, driveId, technicalScore, communicationScore, behavioralAnalysis, sentiment, recommendation, generatedAt

### Firestore Indexes

Key composite indexes defined in `firestore.indexes.json`:
- `students`: normalizedCollegeName + createdAt
- `jobNotifications`: collegeId + status + sentAt
- `driveNotifications`: collegeId + status + sentAt
- `interviewSessions`: studentId + status + completedAt
- `studentSelections`: driveId + status + selectedAt

### Security Rules

Comprehensive security rules in `firestore.rules`:
- Role-based access control
- Owner-only write permissions
- Admin-level access for college and organization admins
- Public read for certain collections (colleges, job postings)
- Validation rules for data integrity

## Available Scripts

### Development
```bash
npm run dev              # Start development server with Turbopack
npm run build            # Build for production with Turbopack
npm start                # Start production server
npm run lint             # Run ESLint
```

### Testing
```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
```

### Database Management
```bash
npm run clear-data              # Clear all database data (use with caution!)
npm run migrate:college-names   # Migrate college names to normalized format
npm run fix-colleges            # Fix existing college data inconsistencies
```

### Custom Scripts
All scripts are located in the `scripts/` directory and can be run with `tsx`:
```bash
npx tsx scripts/your-script.ts
```

## Development Workflow

### 1. Feature Development with Specs

This project uses Kiro Specs for structured feature development:

1. **Requirements**: Define user stories and acceptance criteria
2. **Design**: Create detailed design with correctness properties
3. **Tasks**: Break down implementation into actionable tasks
4. **Implementation**: Execute tasks with testing

Example spec location: `.kiro/specs/college-name-primary-key/`

### 2. Code Organization

- **API Routes**: Place in `app/api/[resource]/`
- **Pages**: Place in `app/[role]/[...path]/`
- **Components**: Place in `components/[category]/`
- **Services**: Place in `lib/services/`
- **Types**: Place in `types/`
- **Tests**: Co-locate with source in `__tests__/` directories

### 3. Testing Strategy

- Write tests alongside implementation
- Use property-based testing for complex logic
- Test API endpoints with integration tests
- Test components with React Testing Library
- Maintain high test coverage

### 4. Database Changes

- Update Firestore security rules in `firestore.rules`
- Add indexes in `firestore.indexes.json`
- Deploy with `firebase deploy --only firestore`
- Create migration scripts for data changes

### 5. Type Safety

- Define types in `types/` directory
- Use Zod for runtime validation
- Leverage TypeScript strict mode
- Avoid `any` types

## Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**
   - Import project to Vercel
   - Connect GitHub repository

2. **Configure Environment Variables**
   - Add all variables from `.env.local`
   - Set Firebase credentials
   - Add API keys for AI services

3. **Deploy**
   ```bash
   vercel deploy
   ```

### Firebase Deployment

Deploy Firestore rules and indexes:
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### Environment-Specific Configuration

- **Development**: Uses `.env.local`
- **Production**: Set environment variables in hosting platform
- **Staging**: Create `.env.staging` for staging environment

## Troubleshooting

### Common Issues

**Issue: Firebase Admin SDK errors**
- Ensure `FIREBASE_ADMIN_PRIVATE_KEY` is properly formatted
- Check that service account has correct permissions

**Issue: College name normalization errors**
- Run `npm run fix-colleges` to fix existing data
- Check `lib/services/college-name.service.ts` for normalization logic

**Issue: AI question generation fails**
- Verify API keys are set correctly
- Check API rate limits
- Review `app/api/ai/generate-questions/route.ts` logs

**Issue: Student registration not working**
- Verify college exists in database
- Check Firestore security rules
- Review registration request status

**Issue: Tests failing**
- Clear Jest cache: `npx jest --clearCache`
- Check Firebase emulator is not running
- Verify test data setup

### Debug Mode

Enable debug logging by setting:
```env
NEXT_PUBLIC_DEBUG=true
```

### Database Inspection

Use Firebase Console or debug endpoints:
- `/api/debug/drive-selections` - View drive selections (dev only)

## Performance Optimization

- **Turbopack**: Fast builds and hot module replacement
- **React 19**: Latest React features and optimizations
- **Code Splitting**: Automatic with Next.js App Router
- **Image Optimization**: Use Next.js Image component
- **Caching**: Implement caching strategies for API routes
- **Firestore Indexes**: Optimize queries with proper indexes

## Security Best Practices

- **Environment Variables**: Never commit `.env.local`
- **API Keys**: Rotate keys regularly
- **Firestore Rules**: Test rules thoroughly
- **Input Validation**: Use Zod schemas for all inputs
- **Authentication**: Verify user roles on server-side
- **CORS**: Configure properly for production
- **Rate Limiting**: Implement for public endpoints

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Follow code style**
   - Use TypeScript
   - Follow existing patterns
   - Add tests for new features
   - Update documentation

4. **Write meaningful commits**
   ```bash
   git commit -m 'feat: Add amazing feature'
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Describe changes clearly
   - Reference related issues
   - Ensure tests pass
   - Update README if needed

### Commit Convention

Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test additions or changes
- `refactor:` - Code refactoring
- `style:` - Code style changes
- `chore:` - Build process or auxiliary tool changes

## Roadmap

### Current Features ✅
- Multi-role authentication system
- AI-powered interview generation and evaluation
- College name normalization system
- Student registration and approval workflow
- Job posting and notification system
- Interview drive management
- Comprehensive reporting and analytics
- Bulk student upload
- Real-time notifications
- Voice interview integration (VAPI)

### Planned Features 🚀
- **Enhanced AI Features**
  - Multi-language interview support
  - Video interview analysis
  - Advanced behavioral assessment
  - Personalized learning recommendations

- **Analytics & Insights**
  - Predictive analytics for student success
  - Market trend analysis
  - Salary benchmarking
  - Placement rate predictions

- **Communication**
  - In-app chat system
  - Video conferencing integration
  - Email campaign management
  - SMS notifications

- **Mobile App**
  - React Native mobile application
  - Push notifications
  - Offline interview capability

- **Integration**
  - LinkedIn integration
  - ATS (Applicant Tracking System) integration
  - Calendar integration (Google, Outlook)
  - Payment gateway for premium features

- **Advanced Features**
  - Resume parsing and matching
  - Skill gap analysis
  - Interview scheduling automation
  - Collaborative hiring workflows

## Technology Decisions

### Why Next.js 15?
- App Router for better performance
- Server Components for reduced client-side JavaScript
- Turbopack for faster builds
- Built-in API routes
- Excellent TypeScript support

### Why Firebase?
- Real-time database capabilities
- Robust authentication system
- Scalable infrastructure
- Easy integration with Next.js
- Generous free tier

### Why Multiple AI Providers?
- Redundancy and fallback options
- Cost optimization
- Feature-specific model selection
- Performance comparison

### Why Property-Based Testing?
- Catches edge cases automatically
- Validates correctness properties
- Complements unit tests
- Ensures robust code

## Architecture Decisions

### Normalized College Names
- **Problem**: Inconsistent college names causing data fragmentation
- **Solution**: Normalized storage with case-insensitive search
- **Implementation**: Migration scripts and validation middleware
- **Benefits**: Data consistency, better search, easier reporting

### Role-Based Access Control
- **Implementation**: Firebase Auth custom claims + middleware
- **Roles**: student, college_admin, organization_admin
- **Security**: Server-side verification on all protected routes
- **Flexibility**: Easy to extend with new roles

### AI Evaluation Pipeline
- **Question Generation**: Context-aware using job profiles
- **Answer Evaluation**: Multi-dimensional NLP analysis
- **Sentiment Analysis**: Emotional intelligence assessment
- **Report Generation**: Comprehensive PDF reports with recommendations

### Notification System
- **Types**: Job notifications, drive notifications, selections, messages
- **Delivery**: In-app + email (optional SMS)
- **Status Tracking**: Read/unread, response tracking
- **Real-time**: Firestore listeners for instant updates

## Performance Metrics

- **Build Time**: ~30s with Turbopack
- **Page Load**: <2s for most pages
- **API Response**: <500ms average
- **Test Suite**: ~5s for full suite
- **Lighthouse Score**: 90+ on all metrics

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatible
- High contrast mode support
- Semantic HTML structure

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Acknowledgments

- **shadcn/ui** for beautiful UI components
- **Vercel** for hosting and deployment
- **Firebase** for backend infrastructure
- **OpenAI, Google, Groq** for AI capabilities
- **Next.js team** for the amazing framework

## Support & Contact

### Getting Help
- **Documentation**: Check this README and inline code comments
- **Issues**: Open an issue on GitHub for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions

### Contact
- **Email**: [your-email@example.com]
- **GitHub**: [your-github-profile]
- **Website**: [your-website.com]

### Community
- Join our Discord server (coming soon)
- Follow us on Twitter (coming soon)
- Subscribe to our newsletter (coming soon)

---

**Built with ❤️ using Next.js, TypeScript, and Firebase**

**Last Updated**: December 2024

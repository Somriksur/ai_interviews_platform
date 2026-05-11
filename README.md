# HireFlow — AI-Powered Campus Recruitment Platform

> **Version 1.0.0** | Built with Next.js 15, Firebase, Groq AI, Vapi Voice AI, and two custom-trained AI models deployed on HuggingFace.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [User Roles](#4-user-roles)
5. [Core Features — A to Z](#5-core-features--a-to-z)
6. [AI Model 1 — HireFlow-Qwen-Fresh-Pro (Question Generation)](#6-ai-model-1--hireflow-qwen-fresh-pro-question-generation)
7. [AI Model 2 — HireFlow NLP Evaluation (Response Analysis)](#7-ai-model-2--hireflow-nlp-evaluation-response-analysis)
8. [Hybrid NLP Analysis System](#8-hybrid-nlp-analysis-system)
9. [API Reference](#9-api-reference)
10. [Database Schema](#10-database-schema)
11. [Authentication & Security](#11-authentication--security)
12. [Interview Drive Lifecycle](#12-interview-drive-lifecycle)
13. [Voice Interview System](#13-voice-interview-system)
14. [Report Generation](#14-report-generation)
15. [Analytics & Dashboards](#15-analytics--dashboards)
16. [Email Notification System](#16-email-notification-system)
17. [File Upload & Processing](#17-file-upload--processing)
18. [Environment Variables](#18-environment-variables)
19. [Local Development Setup](#19-local-development-setup)
20. [Deployment](#20-deployment)
21. [Testing](#21-testing)
22. [Project File Structure](#22-project-file-structure)

---

## 1. Project Overview

HireFlow is a full-stack, AI-powered campus recruitment platform that connects **Organizations**, **Colleges**, and **Candidates** in a seamless end-to-end hiring workflow. It automates the entire campus placement process — from posting job notifications and scheduling interview drives, to conducting AI voice interviews, evaluating responses with two custom-trained AI models, and generating detailed PDF reports.

### What HireFlow Does

- **Organizations** post job openings, create interview drives, and select candidates from college campuses — all from one dashboard.
- **Colleges** receive job notifications, register students, assign them to drives, and track placement outcomes with analytics.
- **Candidates** receive interview invitations, attend AI-powered voice interviews, and get instant detailed feedback reports.

### Why HireFlow Exists

Traditional campus recruitment is slow, manual, and inconsistent. HireFlow replaces paper-based processes and generic video calls with:

- Automated AI voice interviews that run 24/7 without human interviewers
- Two custom AI models that evaluate every response for sentiment, emotion, communication quality, confidence, and stress
- Real-time analytics so colleges and organizations can make data-driven hiring decisions
- Automated PDF report generation for every candidate

### Key Numbers

| Metric | Value |
|--------|-------|
| AI Models | 2 custom-trained models |
| NLP Training Samples | 12,000+ interview responses |
| Question Bank | 5,270 training questions |
| Supported Roles | 3 (Organization, College, Candidate) |
| API Endpoints | 40+ REST endpoints |
| Report Types | PDF, HTML, JSON |
| Voice AI Provider | Vapi |
| LLM Provider | Groq (Llama 3) |

---

## 2. Tech Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 15.5.4 | Full-stack React framework with App Router |
| React | 19.1.0 | UI library |
| TypeScript | 5.x | Type safety across the entire codebase |
| Tailwind CSS | 4.x | Utility-first styling |
| Radix UI | Latest | Accessible headless UI components |
| Lucide React | 0.545.0 | Icon library |
| Recharts | 3.5.1 | Analytics charts and graphs |
| React Hook Form | 7.65.0 | Form state management and validation |
| Zod | 4.1.12 | Schema validation for forms and APIs |
| Monaco Editor | 4.7.0 | Code editor for technical interviews |
| TipTap | 3.11.1 | Rich text editor |
| next-themes | 0.4.6 | Dark/light mode support |

### Backend & APIs

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js API Routes | 15.5.4 | REST API endpoints |
| Firebase Admin SDK | 13.5.0 | Server-side Firestore and Auth |
| Groq SDK | 0.37.0 | LLM inference (Llama 3) for evaluation |
| OpenAI SDK | 6.3.0 | Additional AI capabilities |
| Nodemailer | 7.0.11 | Email notifications |
| Resend | 6.5.2 | Transactional email delivery |
| Axios | 1.12.2 | HTTP client for external APIs |

### Database & Auth

| Technology | Purpose |
|-----------|---------|
| Firebase Firestore | Primary NoSQL database |
| Firebase Authentication | User identity management |
| Firebase Admin | Server-side privileged operations |

### AI & Machine Learning

| Technology | Purpose |
|-----------|---------|
| HuggingFace Spaces | Hosting both custom AI models |
| PyTorch | Model training and inference |
| Transformers (HuggingFace) | RoBERTa-base for NLP |
| Qwen 2.5-0.5B-Instruct | Base model for question generation |
| Gradio | Web interface for HuggingFace Spaces |
| Groq (Llama 3) | Comprehensive interview evaluation |
| Vapi | Real-time voice AI for interviews |

### File Processing

| Technology | Purpose |
|-----------|---------|
| jsPDF | PDF report generation |
| jspdf-autotable | Table rendering in PDFs |
| mammoth | DOCX file parsing |
| pdf-parse | PDF text extraction |
| xlsx | Excel file processing |
| papaparse | CSV parsing |

### Development & Testing

| Technology | Purpose |
|-----------|---------|
| Jest | Unit and integration testing |
| Testing Library | React component testing |
| fast-check | Property-based testing |
| ESLint | Code linting |
| tsx | TypeScript execution |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          HIREFLOW PLATFORM                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────┐   │
│  │ Organization │   │   College    │   │       Candidate          │   │
│  │  Dashboard   │   │  Dashboard   │   │       Interface          │   │
│  └──────┬───────┘   └──────┬───────┘   └────────────┬─────────────┘   │
│         │                  │                         │                 │
│         └──────────────────┴─────────────────────────┘                 │
│                            │                                           │
│                    ┌───────▼────────┐                                  │
│                    │  Next.js 15    │                                  │
│                    │  App Router    │                                  │
│                    │  API Routes    │                                  │
│                    └───────┬────────┘                                  │
│                            │                                           │
│         ┌──────────────────┼──────────────────────┐                   │
│         │                  │                      │                   │
│  ┌──────▼──────┐   ┌───────▼──────┐   ┌──────────▼──────┐           │
│  │  Firebase   │   │   Groq AI    │   │  HuggingFace    │           │
│  │  Firestore  │   │  (Llama 3)   │   │    Spaces       │           │
│  │  + Auth     │   │  Evaluation  │   │  (2 AI Models)  │           │
│  └─────────────┘   └──────────────┘   └─────────────────┘           │
│                                                                         │
│         ┌──────────────────┬──────────────────────┐                   │
│         │                  │                      │                   │
│  ┌──────▼──────┐   ┌───────▼──────┐   ┌──────────▼──────┐           │
│  │  Vapi Voice │   │   Resend /   │   │  jsPDF Report   │           │
│  │     AI      │   │  Nodemailer  │   │   Generation    │           │
│  └─────────────┘   └──────────────┘   └─────────────────┘           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Request Flow

```
Browser Request
      │
      ▼
Next.js Middleware (Auth Check)
      │
      ▼
API Route Handler
      │
      ├── Auth Context (Firebase token verification)
      │
      ├── Role Guard (organization / college / candidate)
      │
      ├── Zod Schema Validation
      │
      ├── Business Logic
      │   ├── Firestore Operations
      │   ├── AI Model Calls (Groq / HuggingFace)
      │   └── Email Notifications
      │
      └── JSON Response
```

---

## 4. User Roles

HireFlow has three distinct user roles, each with a completely separate dashboard and permission set.

### Organization

An organization is a company that wants to hire candidates from college campuses.

**Capabilities:**
- Create and manage job profiles (role, level, tech stack, requirements)
- Post job notifications to one or multiple colleges
- Create interview drives linked to job profiles
- Assign students from colleges to interview drives
- Generate AI interview questions automatically using the Qwen model
- View all candidate evaluation reports and scores
- Finalize results and select candidates
- Download PDF reports for individual candidates or entire drives
- View analytics: placement rates, score distributions, college comparisons
- Send messages to college administrators

**Dashboard Sections:**
- Overview with key metrics
- Job Profiles management
- Interview Drives management
- Candidate Results and Reports
- College Partnerships
- Analytics

### College

A college is an educational institution that participates in campus placements.

**Capabilities:**
- Receive job notifications from organizations
- Accept or decline job notifications
- Register students (bulk upload via CSV/Excel or manual entry)
- Assign students to interview drives
- Track student performance across all drives
- View placement analytics and reports
- Communicate with organizations
- Download placement reports

**Dashboard Sections:**
- Overview with placement statistics
- Student Management
- Interview Drives
- Job Notifications
- Reports and Analytics
- Organization Messages

### Candidate

A candidate is a student who participates in AI-powered interviews.

**Capabilities:**
- View assigned interview drives
- Start and complete AI voice interviews
- Receive instant evaluation reports after each interview
- View detailed feedback: scores, strengths, improvements
- Track interview history
- View personalized learning path recommendations
- Download their own evaluation reports

**Dashboard Sections:**
- Home with upcoming interviews
- Interview History
- Feedback Reports
- Learning Path

---

## 5. Core Features — A to Z

### A — Authentication System

HireFlow uses Firebase Authentication with custom session management.

- Email/password authentication for all three roles
- Custom session tokens stored server-side
- Role-based access control enforced at every API endpoint
- Auth context injected into every request via `getAuthContext()`
- `requireRole()` guard rejects unauthorized role access with 403
- Session endpoint: `GET /api/auth/session`
- Registration endpoint: `POST /api/auth/register`
- Current user endpoint: `GET /api/auth/me`

### B — Bulk Student Upload

Colleges can upload hundreds of students at once using CSV or Excel files.

- Endpoint: `POST /api/colleges/[collegeId]/upload-students`
- Supported formats: CSV, XLSX, XLS
- Required columns: name, email, rollNumber, branch, year
- Automatic duplicate detection by email
- Validation errors returned per row
- Successful uploads trigger welcome emails to students
- Uses `papaparse` for CSV and `xlsx` for Excel parsing

### C — Candidate Interview Flow

The complete candidate journey from invitation to report:

1. Organization creates interview drive
2. College assigns student to drive
3. Student receives email notification
4. Student logs in and sees drive on dashboard
5. Student clicks "Start Interview"
6. Vapi voice AI conducts the interview
7. Student answers questions verbally
8. Student clicks "End Interview"
9. Loading screen: "Generating your analysis report..."
10. Two AI models analyze responses (within 30 seconds)
11. Groq AI generates comprehensive evaluation
12. PDF report generated and stored
13. Student sees detailed feedback immediately
14. Organization and college can view results

### D — Drive Management

Interview drives are the core scheduling unit in HireFlow.

- Each drive is linked to one job profile
- Drives can target one or multiple colleges
- Drive status lifecycle: `draft → active → completed → finalized`
- Endpoint: `GET/PUT /api/interview-drives/[driveId]`
- Assign students: `POST /api/interview-drives/[driveId]/assign-students`
- Create interviews for assigned students: `POST /api/interview-drives/[driveId]/create-interviews`
- Finalize results: `POST /api/interview-drives/[driveId]/finalize-results`
- Generate reports: `POST /api/interview-drives/[driveId]/generate-reports`
- Match jobs to candidates: `POST /api/interview-drives/[driveId]/match-jobs`

### E — Evaluation Reports

Every interview generates a comprehensive evaluation report stored in Firestore.

Report contains:
- Technical score (0-100)
- Communication score (0-100)
- Problem-solving score (0-100)
- Overall score (0-100)
- Technical correctness score
- Conceptual understanding score
- Practical application score
- Per-question analysis with strengths and weaknesses
- Emotion analysis (dominant emotions, stability, wellbeing)
- Confidence analysis (real-time tracking across answers)
- Industry-specific evaluation
- Recommendation: `highly-recommended / recommended / consider / not-recommended`
- Full interview transcript
- Personalized improvement suggestions

### F — Feedback Generation

Feedback is generated through a multi-layer AI pipeline:

1. **Groq AI (Llama 3)** — Comprehensive semantic analysis of all answers
2. **NLP Evaluation Service** — Behavioral and linguistic analysis
3. **Emotion Detector** — Advanced emotion tracking across the interview
4. **Confidence Tracker** — Real-time confidence measurement
5. **Industry Evaluator** — Role-specific technical assessment
6. **Semantic Evaluator** — Deep concept coverage analysis
7. **Explainable NLP** — Human-readable score explanations

### G — Question Generation (AI Model 1)

Questions are generated using the custom HireFlow-Qwen-Fresh-Pro model.

- Endpoint: `POST /api/ai/generate-questions`
- Input: role, level, type (Technical/Behavioral/Mixed), amount
- Output: array of tailored interview questions
- Model: `somriksur/HireFlow-Qwen-Fresh-Pro` on HuggingFace
- Training data: 5,270 role-specific question-answer pairs
- Supports: Software Engineer, Data Scientist, DevOps, Frontend, Backend, Full Stack, Mobile, and more

### H — Health Checks

All AI services expose health check endpoints.

- Qwen Space health: `GET /api/ai/health-check`
- NLP Space health: checked internally before each analysis
- Health check interval: 60 seconds (cached to avoid spam)
- Status values: `healthy / loading / error`

### I — Interview Sessions

Each candidate-drive pairing creates one interview session.

- Collection: `interview_sessions`
- Fields: studentId, driveId, collegeId, status, transcript, evaluationId
- Status lifecycle: `pending → in_progress → completed`
- Endpoint: `GET/PUT /api/interview-sessions/[sessionId]`
- Transcript stored as array of `{role, content, timestamp}` messages
- Evaluation triggered automatically on session completion

### J — Job Notifications

Organizations send job notifications to colleges to announce openings.

- Endpoint: `POST /api/job-notifications`
- Colleges receive notifications and can accept/decline
- Notification contains: job details, requirements, deadline, drive info
- College response endpoint: `POST /api/college-notifications/[notificationId]/respond`
- Drive notifications for specific drives: `GET/PUT /api/drive-notifications/[notificationId]`

### K — Knowledge Base (Training Data)

The platform uses a curated training dataset for question generation.

- File: `training_data.jsonl`
- Size: 5,270 question-answer pairs
- Format: `{instruction: string, output: string}`
- Covers: 15+ technology stacks, 3 experience levels, 4 question types
- Used by the secondary question service when the primary AI model is unavailable

### L — Learning Path

After each interview, candidates receive a personalized learning path.

- Endpoint: `GET /api/candidate/learning-path`
- Based on: weak areas identified in evaluation, knowledge gaps, industry trends
- Contains: recommended resources, topics to study, practice exercises
- Updated after each interview

### M — Multi-Modal Analysis

HireFlow combines multiple analysis dimensions for comprehensive evaluation:

- **Text NLP**: Sentiment, emotion, communication quality
- **Voice Analysis**: Speech patterns, pace, filler words (via Vapi)
- **Semantic Analysis**: Concept coverage, reasoning depth
- **Behavioral Analysis**: Consistency, engagement, authenticity
- **Industry Analysis**: Role-specific technical accuracy

### N — Notifications System

HireFlow sends automated emails at key workflow points:

- Student registration confirmation
- Interview drive invitation
- Interview reminder (24 hours before)
- Interview completion confirmation
- Results available notification
- Selection/rejection notification
- College admin notifications for new drives

### O — Organization Analytics

Organizations get detailed analytics across all their drives and colleges.

- Endpoint: `GET /api/analytics/recruiter/[orgId]`
- Metrics: total candidates, placement rate, average scores, top performers
- College comparison charts
- Score distribution histograms
- Drive performance over time
- Role-wise analytics

### P — PDF Report Generation

Every evaluation generates a downloadable PDF report.

- Service: `lib/services/report-generation.service.ts`
- Library: jsPDF + jspdf-autotable
- Report sections: Executive Summary, Scores, Per-Question Analysis, Transcript, Recommendations
- Two versions: Candidate report (detailed) and Recruiter report (summary)
- Stored in Firestore as base64 or served on-demand

### Q — Question Types

HireFlow supports four interview question types:

1. **Technical** — Coding, system design, architecture questions
2. **Behavioral** — STAR-format situational questions
3. **Mixed** — Combination of technical and behavioral
4. **Role-Specific** — Industry and domain-specific questions

### R — Reports and Exports

Multiple export formats are supported:

- PDF: Full evaluation report with charts
- HTML: Web-viewable report
- JSON: Raw evaluation data for integrations
- Excel: Bulk candidate data for colleges
- CSV: Simple data export

### S — Student Management

Colleges manage their student roster through a dedicated interface.

- Endpoint: `GET /api/colleges/[collegeId]/students`
- Tag students for specific drives: `POST /api/interview-drives/[driveId]/tag-students`
- View student interview history
- Track placement status per student
- Bulk operations: assign, tag, export

### T — Transcript Generation

Every interview produces a structured transcript.

- Interviewer transcript: questions asked, strategy, difficulty progression
- Candidate transcript: answers, emotional state per answer, key moments
- Timeline analysis: duration, pacing, engagement over time
- Stored in evaluation report and shareable with candidates

### U — Ultimate Hybrid NLP Analysis

The core analysis engine that runs after every interview (detailed in sections 7 and 8).

- Runs within 30 seconds of interview completion
- Combines two AI models for maximum accuracy
- Never returns blank results
- Silent operation — no technical details shown to users

### V — Voice Interview (Vapi)

Interviews are conducted entirely through voice using Vapi AI.

- SDK: `@vapi-ai/web`
- Real-time speech-to-text transcription
- AI interviewer asks questions naturally
- Candidate responds verbally
- Transcript captured in real-time
- Interview ends when candidate clicks "End Interview" or time limit reached

### W — Webhook & Real-time Updates

- Firebase Firestore real-time listeners for live status updates
- Interview session status updates pushed to UI in real-time
- Drive status changes reflected immediately across all dashboards

### X — Cross-College Drive Support

A single interview drive can span multiple colleges simultaneously.

- Organization selects multiple colleges when creating a drive
- Each college sees the drive in their dashboard
- Students from all selected colleges can be assigned
- Results aggregated across colleges in organization analytics

### Y — Your Data Security

- All API endpoints require authentication
- Role-based access control at every endpoint
- Firebase security rules enforce data isolation
- No cross-organization data leakage
- Student PII protected — only accessible to their college and assigned organization
- Evaluation reports access-controlled by role

### Z — Zero-Downtime Analysis

The hybrid NLP system ensures analysis is always available:

- Primary AI model (RoBERTa NLP) with 25-second timeout
- Secondary analysis (rule-based NLP) always runs in parallel
- Results averaged when both succeed
- Rule-based used alone if primary times out
- Emergency keyword-based analysis as final safety net
- Analysis report always generated — never blank

---

## 6. AI Model 1 — HireFlow-Qwen-Fresh-Pro (Question Generation)

This is the first of two custom AI models built for HireFlow. It generates tailored interview questions based on job role, experience level, and interview type.

### Overview

| Property | Value |
|----------|-------|
| Model Name | HireFlow-Qwen-Fresh-Pro |
| HuggingFace ID | `somriksur/HireFlow-Qwen-Fresh-Pro` |
| Base Model | Qwen/Qwen2.5-0.5B-Instruct |
| Deployment | HuggingFace Space (Gradio) |
| Space URL | `https://somriksur-hireflow-qwen-api.hf.space` |
| Training Data | 5,270 question-answer pairs |
| Training Time | ~3 hours on GPU |
| Purpose | Generate role-specific interview questions |

### Base Model: Qwen 2.5-0.5B-Instruct

The base model is Alibaba's Qwen 2.5 series, specifically the 0.5B parameter instruction-tuned variant. It was chosen for:

- **Small footprint**: 0.5B parameters fits within HuggingFace free tier GPU limits
- **Instruction following**: The `-Instruct` variant is fine-tuned to follow prompts precisely
- **Quality output**: Despite small size, produces coherent, structured text
- **Fast inference**: Generates questions in 5-10 seconds on CPU, 2-3 seconds on GPU

### Fine-Tuning Process

The model was fine-tuned on a custom dataset of 5,270 interview question-answer pairs:

**Training Configuration:**
```
Base Model:           Qwen/Qwen2.5-0.5B-Instruct
Training Data:        5,270 JSONL pairs
Batch Size:           2
Gradient Accumulation: 16 steps (effective batch = 32)
Learning Rate:        2e-4
Epochs:               3
GPU Memory Fraction:  0.8
Checkpoint Steps:     100
Training Time:        ~3 hours
```

**Dataset Format (training_data.jsonl):**
```json
{
  "instruction": "Generate 5 technical interview questions for a senior React developer",
  "output": "1. How do you optimize React application performance?\n2. Explain the difference between useMemo and useCallback...\n3. ..."
}
```

**Dataset Coverage:**
- 15+ technology stacks (React, Node.js, Python, Java, TypeScript, etc.)
- 3 experience levels (Junior, Mid-level, Senior)
- 4 question types (Technical, Behavioral, Mixed, Role-Specific)
- 25+ job roles (Frontend, Backend, Full Stack, DevOps, Data Science, etc.)

### How It Works

The model is deployed as a Gradio Space on HuggingFace. The Next.js backend calls it via the Gradio API:

**Step 1: Build prompt**
```
"Generate 5 technical interview questions for a senior React developer"
```

**Step 2: Call Gradio API**
```
POST https://somriksur-hireflow-qwen-api.hf.space/gradio_api/call/generate_interface
Body: { data: [prompt, max_tokens, temperature] }
Response: { event_id: "abc123" }
```

**Step 3: Poll for result**
```
GET https://somriksur-hireflow-qwen-api.hf.space/gradio_api/call/generate_interface/abc123
Response: SSE stream with generated text
```

**Step 4: Parse questions**
The service extracts numbered questions from the generated text, cleans formatting artifacts, ensures each ends with `?`, and validates length (15-200 characters).

### API Integration

**Service file:** `lib/services/ai-model.service.ts`

**Endpoints that use this model:**
- `POST /api/ai/generate-questions` — Main question generation
- `POST /api/ai/simple-generate` — Simplified generation for voice interviews
- `POST /api/ai/template-generate` — Template-based generation

**Request:**
```typescript
{
  role: "Senior React Developer",
  level: "Senior",
  type: "Technical",
  amount: 5
}
```

**Response:**
```typescript
{
  questions: [
    "How do you optimize React application performance for large-scale applications?",
    "Explain the difference between useMemo and useCallback with practical examples?",
    "How would you architect a micro-frontend system using React?",
    "What strategies do you use for state management in complex React applications?",
    "How do you handle code splitting and lazy loading in React?"
  ],
  metadata: {
    model: "HireFlow-Qwen-Fresh-Pro",
    spaceEndpoint: "https://somriksur-hireflow-qwen-api.hf.space",
    generatedAt: "2026-05-05T10:30:00.000Z",
    role: "Senior React Developer",
    level: "Senior",
    type: "Technical"
  }
}
```

### Hybrid Question Generation

The question generation also uses a hybrid approach via `lib/services/hybrid-question-generation.service.ts`:

- **Primary**: HireFlow-Qwen-Fresh-Pro model via HuggingFace Space
- **Secondary**: 5,270-question training data bank (via `lib/services/fallback-questions.service.ts`)

The secondary service intelligently selects questions from the training data by:
1. Extracting technology keywords from the role name
2. Normalizing experience level (junior/mid/senior)
3. Filtering training data by matching criteria
4. Randomly selecting and shuffling for variety

### Performance

| Metric | Value |
|--------|-------|
| Average Generation Time | 8-12 seconds |
| Questions per Request | 1-25 |
| Supported Roles | 25+ |
| Supported Levels | Junior, Mid, Senior |
| Question Quality | Validated (15-200 chars, ends with ?) |
| Timeout | 30 seconds initial call, 90 seconds result |

---

## 7. AI Model 2 — HireFlow NLP Evaluation (Response Analysis)

This is the second custom AI model. It analyzes candidate interview responses for sentiment, emotion, communication quality, confidence, and stress levels. It is a multi-task deep learning model trained specifically on interview response data.

### Overview

| Property | Value |
|----------|-------|
| Model Name | HireFlow NLP Evaluation |
| Architecture | RoBERTa-base Multi-Task Learning |
| Parameters | 126 million |
| Training Data | 12,000+ interview responses |
| Training Patterns | 25 (15 original + 10 edge cases) |
| Deployment | HuggingFace Space (Gradio + FastAPI) |
| Space URL | `https://somriksur-hireflow-nlp-evaluation.hf.space` |
| Model File | `best_model_90percent.pt` (481 MB) |
| GPU | T4 GPU on HuggingFace |
| Inference Time | ~500ms on CPU, ~200ms on GPU |
| Overall Accuracy | 90%+ (100% on test cases) |

### Base Model: RoBERTa-base

RoBERTa (Robustly Optimized BERT Pretraining Approach) is a transformer model from Facebook AI. The `roberta-base` variant has:

- 125 million parameters
- 12 transformer layers
- 768 hidden dimensions
- 12 attention heads
- Pre-trained on 160GB of text data
- Excellent at understanding context and nuance in text

RoBERTa was chosen over BERT because it uses dynamic masking, removes the Next Sentence Prediction objective, and trains with larger batches — making it significantly better at understanding conversational text like interview responses.

### Multi-Task Learning Architecture

The model uses a shared encoder with 5 separate classification heads — one for each analysis task. This multi-task approach means the model learns shared representations that benefit all tasks simultaneously.

```python
class MultiTaskNLPModel(torch.nn.Module):
    def __init__(self, base_model):
        super().__init__()
        self.roberta = base_model          # Shared RoBERTa encoder (126M params)
        self.dropout = torch.nn.Dropout(0.3)
        
        # 5 task-specific classification heads
        self.sentiment_head    = torch.nn.Linear(768, 3)  # positive, negative, neutral
        self.emotion_head      = torch.nn.Linear(768, 7)  # 7 emotion classes
        self.communication_head = torch.nn.Linear(768, 4) # excellent, good, fair, poor
        self.confidence_head   = torch.nn.Linear(768, 5)  # very_high to very_low
        self.stress_head       = torch.nn.Linear(768, 5)  # very_high to very_low
    
    def forward(self, input_ids, attention_mask):
        outputs = self.roberta(input_ids=input_ids, attention_mask=attention_mask)
        pooled_output = outputs.pooler_output   # [CLS] token representation
        pooled_output = self.dropout(pooled_output)
        
        return {
            'sentiment':       self.sentiment_head(pooled_output),
            'emotion':         self.emotion_head(pooled_output),
            'communication':   self.communication_head(pooled_output),
            'confidence_level': self.confidence_head(pooled_output),
            'stress_level':    self.stress_head(pooled_output)
        }
```

### The 5 Analysis Tasks

**Task 1: Sentiment Analysis**
- Classes: `POSITIVE`, `NEUTRAL`, `NEGATIVE`
- Detects the overall emotional tone of the response
- Goes beyond simple keyword matching — understands context
- Example: "I struggled with this but eventually solved it" → POSITIVE (growth mindset)

**Task 2: Emotion Detection**
- Classes: `ANGRY`, `FEAR`, `JOY`, `LOVE`, `SADNESS`, `SURPRISE`, `CONFIDENT`
- Identifies the dominant emotional state of the candidate
- Critical for understanding candidate psychology during interviews
- Example: "Um, I'm not really sure..." → FEAR (nervousness)

**Task 3: Communication Quality**
- Classes: `POOR`, `FAIR`, `GOOD`, `EXCELLENT`
- Evaluates clarity, structure, and effectiveness of communication
- Considers vocabulary, sentence structure, and coherence
- Example: Structured STAR-format answer → EXCELLENT

**Task 4: Confidence Level**
- Classes: `VERY_LOW`, `LOW`, `MEDIUM`, `HIGH`, `VERY_HIGH`
- Measures how confident the candidate sounds
- Detects hedging language, filler words, and certainty markers
- Example: "I definitely have experience with..." → HIGH

**Task 5: Stress Level**
- Classes: `VERY_LOW`, `LOW`, `MEDIUM`, `HIGH`, `VERY_HIGH`
- Assesses stress and anxiety indicators in the response
- Detects panic, overwhelm, and pressure signals
- Example: "I'm completely overwhelmed by this question" → VERY_HIGH

### Training Details

**Training Configuration:**
```
Optimizer:        AdamW
Learning Rate:    2e-5
Batch Size:       16
Max Token Length: 256
Epochs:           4
Training Time:    ~25-30 minutes on T4 GPU
Loss Function:    CrossEntropyLoss (per task)
Dropout Rate:     0.3
```

**Training Data: 12,000 Interview Responses**

The training dataset was carefully curated to cover:
- Professional confident responses
- Nervous and anxious responses
- Sarcastic and ironic responses
- Self-deprecating responses
- Overconfident responses
- Stressed and burnout responses
- Humble expert responses
- Imposter syndrome responses
- Jargon-heavy responses
- Balanced realistic responses

**Training Process:**
1. Load pre-trained `roberta-base` from HuggingFace
2. Add 5 classification heads
3. Tokenize all 12,000 training samples (max 256 tokens)
4. Train with AdamW optimizer for 4 epochs
5. Validate on held-out test set
6. Save best checkpoint as `best_model_90percent.pt`

### Edge Cases Detected (10 Patterns)

One of the most powerful features of this model is its ability to detect subtle psychological patterns that simple keyword-based systems miss entirely:

**1. Sarcasm/Irony**
- Pattern: Positive words used in negative context
- Example: "Oh yeah, React is just AMAZING. I absolutely LOVE debugging for hours."
- Detection: Positive sentiment words + negative context markers

**2. Self-Deprecating Humor**
- Pattern: Negative self-description followed by impressive achievement
- Example: "I'm probably the worst developer ever, but I built a system handling 10M requests daily."
- Detection: Negative self-reference + contrasting achievement

**3. Jargon Overload**
- Pattern: Excessive technical buzzwords without substance
- Example: "I leverage synergistic microservices architectures with cloud-native paradigms..."
- Detection: High density of technical terms + low communication score

**4. Imposter Syndrome**
- Pattern: Capable person expressing unwarranted self-doubt
- Example: "Everyone else understands this better. I feel like a fraud in this interview."
- Detection: Fraud/fake/lucky keywords + nervous emotion

**5. Overconfidence**
- Pattern: Arrogant tone with dismissive language
- Example: "Obviously, this is a simple problem. Easy to solve."
- Detection: Obviously/easy/simple + short response + poor communication

**6. Burnout**
- Pattern: Exhaustion and disengagement signals
- Example: "I'm just so tired of dealing with these kinds of problems every day."
- Detection: Exhaustion keywords + high stress + negative sentiment

**7. Passive Aggressive**
- Pattern: Negative sentiment with controlled stress
- Example: "Sure, I'll just do it the way management wants, as always."
- Detection: Negative sentiment + medium stress + compliance language

**8. Humble Expert**
- Pattern: High competence expressed with genuine modesty
- Example: "I've worked on this for years, though I'm sure there's still much to learn."
- Detection: High confidence + positive sentiment + learning-oriented language

**9. Micromanager Anxiety**
- Pattern: Overly detailed, process-obsessed responses with stress
- Example: "I would first create a 47-step checklist, then verify each step three times..."
- Detection: Excessive detail + high stress + process keywords

**10. Balanced Realistic**
- Pattern: Honest self-assessment with both strengths and areas for growth
- Example: "I'm strong in React but still learning system design. Here's what I'd do..."
- Detection: Balanced positive/negative + growth mindset language

### Performance Metrics

| Metric | Value |
|--------|-------|
| Overall Accuracy | 90%+ |
| Simple Cases Accuracy | 100% (5/5) |
| Edge Cases Accuracy | 100% (8/8) |
| Inference Time (CPU) | ~500ms |
| Inference Time (GPU) | ~200ms |
| Model File Size | 481 MB |
| Max Input Length | 512 tokens |
| Confidence Score Output | Per-task softmax probability |

### Deployment on HuggingFace Space

The model is deployed as a Gradio application with a FastAPI backend:

**Files in `huggingface_nlp_space/`:**
```
app_simple_working.py   — Main Gradio application
best_model_90percent.pt — Trained model weights (481 MB)
requirements.txt        — Python dependencies
Dockerfile              — Container configuration
```

**Dockerfile:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y build-essential curl
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app_simple_working.py app.py
COPY best_model_90percent.pt .
EXPOSE 7860
CMD ["python", "app.py"]
```

**Requirements:**
```
torch>=2.0.0
transformers>=4.30.0
gradio>=4.0.0
fastapi
uvicorn
```

**Gradio Interface:**
```python
iface = gr.Interface(
    fn=analyze_interview_response,
    inputs=gr.Textbox(label="Enter Interview Response", lines=6),
    outputs=gr.Markdown(label="Analysis Results"),
    title="HireFlow NLP Evaluation",
    examples=[...]
)
iface.launch(server_name="0.0.0.0", server_port=7860)
```

### API Integration

**Service file:** `lib/services/ml-nlp.service.ts`

**Health check:**
```
GET https://somriksur-hireflow-nlp-evaluation.hf.space/health
Response: { status: "healthy" }
```

**Analysis request:**
```
POST https://somriksur-hireflow-nlp-evaluation.hf.space/analyze
Body: { text: "I have 5 years of React experience..." }
Response: {
  sentiment: "positive",
  emotion: "confident",
  communication: "excellent",
  confidence_level: "high",
  stress_level: "low",
  model_version: "2.0"
}
```

---

## 8. Hybrid NLP Analysis System

After every interview, HireFlow runs a sophisticated hybrid analysis that combines both AI models to produce the most accurate results possible — all within 30 seconds, always producing a complete report.

### Design Principles

1. **Silent operation** — The user only sees "Generating your analysis report..." — never any technical details about which model ran
2. **30-second hard guarantee** — The entire analysis pipeline completes within 30 seconds
3. **Averaged results** — When the RoBERTa NLP model succeeds, its results are averaged with the rule-based analysis for higher accuracy
4. **Never blank** — Multiple safety layers ensure a complete report is always generated
5. **No technical jargon to users** — Users see clean scores and labels, never model names or system details

### The Two Analysis Engines

**Engine 1: RoBERTa NLP Model (Primary)**
- The custom-trained 126M parameter model described in Section 7
- Called via HuggingFace Space API
- 25-second timeout protection
- Produces: sentiment, emotion, communication, confidence, stress labels + confidence scores
- Detects 10 edge case patterns

**Engine 2: Rule-Based NLP (Secondary)**
- Pure TypeScript/JavaScript implementation — no external API calls
- Always runs, always succeeds, completes in 3-5 seconds
- Uses: keyword matching, pattern recognition, linguistic rules, statistical analysis
- Files: `lib/nlp/sentiment-behavior-analysis.ts`, `lib/nlp/advanced-emotion-detection.ts`, `lib/nlp/real-time-confidence-tracker.ts`

### Complete Analysis Flow

```
User clicks "End Interview"
          │
          ▼
Frontend shows: "Generating your analysis report..."
          │
          ▼
POST /api/nlp/analyze-interview
{ answers: [...], questions: [...] }
          │
          ▼
ultimateHybridNLP.analyzeInterview(answers, questions)
          │
          ├─────────────────────────────────────────┐
          │                                         │
          ▼                                         ▼
  tryMLAnalysis(text)                  runRuleBasedAnalysis(answers, questions)
  [25-second timeout]                  [Always runs, 3-5 seconds]
          │                                         │
          ▼                                         ▼
  RoBERTa NLP Model                    Sentiment Analysis
  via HuggingFace Space                Emotion Detection
          │                            Communication Quality
          │                            Confidence Tracking
          │                            Stress Assessment
          │                                         │
          └──────────────┬──────────────────────────┘
                         │
                         ▼
              Did ML model succeed?
                 ╱              ╲
               YES               NO
                │                 │
                ▼                 ▼
        averageResults()    Use rule-based result
        (ML + Rule) / 2     directly (silently)
                │                 │
                └────────┬────────┘
                         │
                         ▼
              Return UltimateNLPResult
              {
                sentiment: { label, score, confidence },
                emotion: { label, score, confidence },
                communication: { label, score, confidence },
                confidence_level: { label, score },
                stress_level: { label, score },
                overallScore: number,
                edgeCases: string[]
              }
                         │
                         ▼
              API returns clean result
              (no internal details)
                         │
                         ▼
              Frontend displays analysis report
```

### Averaging Logic

When the RoBERTa model succeeds, both results are averaged for higher accuracy:

```
ML Model:         Sentiment=80, Emotion=85, Communication=70, Confidence=90, Stress=20
Rule-Based:       Sentiment=70, Emotion=75, Communication=60, Confidence=80, Stress=30

Averaged Result:  Sentiment=75, Emotion=80, Communication=65, Confidence=85, Stress=25
Confidence Score: 98% (high confidence when both models agree)
```

The averaging formula:
```typescript
avgScore = Math.round((mlScore + ruleBasedScore) / 2)
```

Labels are re-derived from the averaged scores using threshold mappings:
- Sentiment: ≥65 → positive, ≤35 → negative, else neutral
- Communication: ≥80 → excellent, ≥60 → good, ≥40 → fair, else poor
- Confidence: ≥70 → high, ≤35 → low, else medium
- Stress: ≥65 → high, ≤35 → low, else medium

### Overall Score Calculation

The overall score is a weighted average of all components:

```typescript
overallScore = (
  sentiment    * 0.25 +
  communication * 0.35 +
  confidence   * 0.25 +
  (100 - stress) * 0.15   // Inverted: lower stress = better score
)
```

Communication has the highest weight (35%) because it is the most directly observable and actionable metric in an interview context.

### Timing Breakdown

| Scenario | ML Time | Rule-Based Time | Total |
|----------|---------|-----------------|-------|
| ML succeeds | 10-15s | 3-5s (parallel) | 15-20s |
| ML times out | 25s | 3-5s (after timeout) | 28-30s |
| Emergency | — | — | <5s |

### Safety Layers

The system has four independent safety layers to guarantee a result is always returned:

**Layer 1 — ML Timeout (25 seconds)**
```typescript
const result = await Promise.race([
  performMLAnalysis(text),
  new Promise(resolve => setTimeout(() => resolve(null), 25000))
]);
```

**Layer 2 — Rule-Based Always Runs**
```typescript
const ruleBasedResult = await runRuleBasedAnalysis(answers, questions);
// This never throws — catches all internal errors
```

**Layer 3 — Emergency Keyword Analysis**
```typescript
catch (error) {
  return getEmergencyFallback(answers, questions, processingTime);
  // Basic keyword counting — always works
}
```

**Layer 4 — API-Level Safety Net**
```typescript
catch (error) {
  return NextResponse.json({
    success: true,
    analysis: getDefaultAnalysis() // Neutral 50/100 scores
  });
}
```

### Service Files

| File | Purpose |
|------|---------|
| `lib/services/ultimate-hybrid-nlp.service.ts` | Main hybrid orchestration service |
| `lib/services/ml-nlp.service.ts` | RoBERTa model API client |
| `lib/services/hybrid-nlp.service.ts` | Legacy hybrid service |
| `lib/services/ml-nlp-with-fallback.service.ts` | ML with rule-based fallback |
| `lib/nlp/sentiment-behavior-analysis.ts` | Rule-based sentiment and behavior |
| `lib/nlp/advanced-emotion-detection.ts` | Advanced emotion detection |
| `lib/nlp/real-time-confidence-tracker.ts` | Confidence tracking |
| `lib/nlp/semantic-evaluation.service.ts` | Deep semantic analysis |
| `lib/nlp/explainable-nlp.service.ts` | Human-readable score explanations |
| `lib/nlp/feedback-generation.service.ts` | Personalized feedback text |
| `lib/nlp/industry-specific-evaluator.ts` | Role-specific evaluation |
| `lib/nlp/multi-modal-integration.ts` | Combines text + voice analysis |
| `lib/nlp/voice-analysis.service.ts` | Voice pattern analysis |
| `lib/nlp/advanced-linguistic-analysis.ts` | Deep linguistic analysis |

### API Endpoint

```
POST /api/nlp/analyze-interview

Request:
{
  "answers": ["answer1", "answer2", "answer3"],
  "questions": ["question1", "question2", "question3"]
}

Response:
{
  "success": true,
  "analysis": {
    "sentiment":        { "label": "positive",   "score": 75, "confidence": 98 },
    "emotion":          { "label": "confident",  "score": 80, "confidence": 98 },
    "communication":    { "label": "good",       "score": 65, "confidence": 98 },
    "confidence_level": { "label": "high",       "score": 85 },
    "stress_level":     { "label": "low",        "score": 25 },
    "overallScore": 78,
    "edgeCases": ["Sarcasm detected"]
  },
  "metadata": {
    "processingTime": 15234,
    "timestamp": "2026-05-05T10:30:00.000Z",
    "answersAnalyzed": 3
  }
}
```

---

## 9. API Reference

All API endpoints require authentication via Firebase session token. Role requirements are noted per endpoint.

### Authentication Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| GET | `/api/auth/session` | Public | Get/create session |
| GET | `/api/auth/me` | Any | Get current user |

### AI Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/ai/generate-questions` | org, college | Generate interview questions |
| POST | `/api/ai/simple-generate` | org, college | Simple question generation |
| POST | `/api/ai/template-generate` | org, college | Template-based generation |
| POST | `/api/ai/fallback-generate` | org, college | Training data questions |
| GET | `/api/ai/health-check` | org, college | Check AI model health |
| POST | `/api/nlp/analyze-interview` | Any | Hybrid NLP analysis |

### Candidate Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/candidate/history` | candidate | Interview history |
| GET | `/api/candidate/learning-path` | candidate | Learning recommendations |
| POST | `/api/candidate/submit-interview` | candidate | Submit completed interview |
| GET | `/api/candidate/interview/[id]` | candidate | Get interview details |
| DELETE | `/api/candidate/delete-interview/[id]` | candidate | Delete interview |
| DELETE | `/api/candidate/delete-feedback/[id]` | candidate | Delete feedback |

### College Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET/PUT | `/api/colleges/[collegeId]` | college | College details |
| GET | `/api/colleges/search` | Any | Search colleges |
| GET | `/api/colleges/by-admin/[adminId]` | college | College by admin |
| GET | `/api/colleges/[collegeId]/students` | college | List students |
| POST | `/api/colleges/[collegeId]/upload-students` | college | Bulk upload students |
| GET | `/api/colleges/[collegeId]/interview-drives` | college | College drives |
| GET | `/api/colleges/[collegeId]/job-notifications` | college | Job notifications |
| GET | `/api/colleges/[collegeId]/notifications` | college | All notifications |
| GET | `/api/colleges/[collegeId]/messages` | college | Messages from orgs |
| GET | `/api/colleges/[collegeId]/reports` | college | Placement reports |
| GET | `/api/colleges/[collegeId]/selections` | college | Selected candidates |
| GET | `/api/colleges/[collegeId]/drive-selections` | college | Drive selections |
| POST | `/api/colleges/[collegeId]/registration-requests` | college | Registration requests |

### Interview Drive Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET/PUT | `/api/interview-drives/[driveId]` | org | Drive details |
| POST | `/api/interview-drives/[driveId]/assign-students` | org | Assign students |
| POST | `/api/interview-drives/[driveId]/create-interviews` | org | Create interview sessions |
| POST | `/api/interview-drives/[driveId]/finalize-results` | org | Finalize and select |
| POST | `/api/interview-drives/[driveId]/generate-reports` | org | Generate PDF reports |
| POST | `/api/interview-drives/[driveId]/match-jobs` | org | Match candidates to jobs |
| POST | `/api/interview-drives/[driveId]/tag-students` | org, college | Tag students |

### Interview Session Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/interview-sessions` | Any | List sessions |
| POST | `/api/interview-sessions` | Any | Create session |
| GET/PUT | `/api/interview-sessions/[sessionId]` | Any | Session details |

### Job Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/job-profiles` | org | List job profiles |
| POST | `/api/job-profiles` | org | Create job profile |
| GET/PUT/DELETE | `/api/job-profiles/[jobId]` | org | Job profile details |
| GET | `/api/job-postings/[jobId]` | Any | Job posting details |
| GET | `/api/job-notifications` | Any | List notifications |
| POST | `/api/job-notifications` | org | Create notification |
| GET/PUT | `/api/job-notifications/[notificationId]` | Any | Notification details |

### Notification Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/college-notifications/[id]/respond` | college | Respond to notification |
| GET/PUT | `/api/drive-notifications/[id]` | Any | Drive notification |
| POST | `/api/drive-notifications/[id]/respond` | college | Respond to drive notification |

### Analytics Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/analytics/recruiter/[orgId]` | org | Recruiter analytics |

---

## 10. Database Schema

HireFlow uses Firebase Firestore (NoSQL). All collections and their key fields:

### Collection: `users`
```
{
  id: string,
  email: string,
  name: string,
  role: "organization" | "college" | "candidate",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `organizations`
```
{
  id: string,
  userId: string,
  name: string,
  industry: string,
  website: string,
  description: string,
  createdAt: Timestamp
}
```

### Collection: `colleges`
```
{
  id: string,
  adminId: string,
  name: string,
  location: string,
  affiliation: string,
  totalStudents: number,
  createdAt: Timestamp
}
```

### Collection: `students`
```
{
  id: string,
  userId: string,
  collegeId: string,
  name: string,
  email: string,
  rollNumber: string,
  branch: string,
  year: number,
  cgpa: number,
  createdAt: Timestamp
}
```

### Collection: `job_profiles`
```
{
  id: string,
  organizationId: string,
  title: string,
  role: string,
  level: "Junior" | "Mid-level" | "Senior",
  type: "Technical" | "Behavioral" | "Mixed",
  techstack: string[],
  requirements: string[],
  salary: string,
  location: string,
  createdAt: Timestamp
}
```

### Collection: `interview_drives`
```
{
  id: string,
  organizationId: string,
  jobProfileId: string,
  title: string,
  role: string,
  colleges: string[],
  questions: { text: string, type: string }[],
  status: "draft" | "active" | "completed" | "finalized",
  scheduledDate: Timestamp,
  createdAt: Timestamp
}
```

### Collection: `interview_sessions`
```
{
  id: string,
  studentId: string,
  driveId: string,
  collegeId: string,
  status: "pending" | "in_progress" | "completed",
  transcript: { role: string, content: string, timestamp: Timestamp }[],
  evaluationId: string,
  completedAt: Timestamp,
  createdAt: Timestamp
}
```

### Collection: `evaluation_reports`
```
{
  id: string,
  studentId: string,
  driveId: string,
  sessionId: string,
  scores: {
    technical: number,
    communication: number,
    problemSolving: number,
    overall: number,
    technicalCorrectness: number,
    conceptualUnderstanding: number,
    practicalApplication: number
  },
  feedback: {
    strengths: string[],
    improvements: string[],
    detailedAnalysis: string,
    questionResponses: QuestionResponse[]
  },
  recommendation: "highly-recommended" | "recommended" | "consider" | "not-recommended",
  emotionAnalysis: AdvancedEmotionReport,
  confidenceAnalysis: ConfidenceAnalysis,
  sentTo: { collegeId: string, organizationId: string, sentAt: Timestamp },
  createdAt: Timestamp
}
```

### Collection: `job_notifications`
```
{
  id: string,
  organizationId: string,
  targetColleges: string[],
  jobProfileId: string,
  driveId: string,
  title: string,
  message: string,
  deadline: Timestamp,
  status: "pending" | "accepted" | "declined",
  createdAt: Timestamp
}
```

### Collection: `college_notifications`
```
{
  id: string,
  collegeId: string,
  organizationId: string,
  driveId: string,
  type: "job_notification" | "drive_assignment" | "result_available",
  title: string,
  message: string,
  status: "unread" | "read" | "accepted" | "declined",
  collegeResponse: string,
  collegeNotes: string,
  respondedAt: Timestamp,
  createdAt: Timestamp
}
```

### Collection: `student_notifications`
```
{
  id: string,
  studentId: string,
  type: "interview_invitation" | "reminder" | "result_available" | "selected" | "rejected",
  title: string,
  message: string,
  driveId: string,
  read: boolean,
  readAt: Timestamp,
  createdAt: Timestamp
}
```

### Collection: `drive_student_selections`
```
{
  id: string,
  driveId: string,
  studentId: string,
  collegeId: string,
  organizationId: string,
  status: "selected" | "waitlisted" | "rejected",
  rank: number,
  overallScore: number,
  selectedAt: Timestamp,
  createdAt: Timestamp
}
```

### Collection: `registration_requests`
```
{
  id: string,
  studentName: string,
  email: string,
  collegeName: string,
  normalizedCollegeName: string,
  rollNumber: string,
  branch: string,
  year: number,
  status: "pending" | "approved" | "rejected",
  reviewedAt: Timestamp,
  reviewedBy: string,
  rejectionReason: string,
  createdAt: Timestamp
}
```

### Collection: `drive_student_tags`
```
{
  id: string,
  driveId: string,
  studentId: string,
  collegeId: string,
  taggedBy: string,
  status: "tagged" | "assigned" | "completed",
  createdAt: Timestamp
}
```

### Collection: `college_messages`
```
{
  id: string,
  collegeId: string,
  organizationId: string,
  subject: string,
  body: string,
  targetStudentIds: string[],
  createdAt: Timestamp
}
```

### Firestore Indexes

`firestore.indexes.json` defines composite indexes for common query patterns:

- `interview_sessions` by `(driveId, studentId)` — for fetching a student's session in a drive
- `evaluation_reports` by `(driveId, scores.overall DESC)` — for ranking candidates in a drive
- `students` by `(collegeId, createdAt DESC)` — for paginated student lists
- `interview_drives` by `(organizationId, status, createdAt DESC)` — for org drive dashboard
- `job_notifications` by `(targetColleges, status, createdAt DESC)` — for college notification inbox

---

## 11. Authentication & Security

### Authentication Flow

```
1. User submits email + password
2. Firebase Authentication verifies credentials
3. Firebase returns ID token
4. Client sends ID token to POST /api/auth/session
5. Server verifies token with Firebase Admin SDK
6. Server creates session document in Firestore
7. Server returns session cookie
8. All subsequent requests include session cookie
9. getAuthContext() verifies session on every API call
```

### Security Guards

Every API endpoint uses two security layers:

**Layer 1: Authentication Check**
```typescript
const authResult = await getAuthContext(request);
if (!authResult.ok) return authResult.response; // 401 Unauthorized
```

**Layer 2: Role Check**
```typescript
const roleError = requireRole(authResult.context, ["organization"]);
if (roleError) return roleError; // 403 Forbidden
```

### Input Validation

All API endpoints use Zod schemas for strict input validation:
```typescript
const schema = z.object({
  role: z.string().min(1).max(120),
  level: z.string().min(1).max(80),
  amount: z.number().int().min(1).max(25)
}).strict(); // Rejects unknown fields
```

### Firestore Security Rules

The `firestore.rules` file enforces data isolation at the database level — a second line of defense beyond the API-level role checks.

Key rules:

- **Users**: Any authenticated user can read user documents; only the owner can write their own document.
- **Colleges**: Creation requires a valid `normalizedName` (lowercase, trimmed, ≥3 chars). Updates cannot directly modify `normalizedName` — that must go through the dedicated update endpoint to maintain consistency.
- **Students**: Students can only read/update their own data. College admins can read/update students from their college (matched via `normalizedCollegeName` in the auth token).
- **Interview Drives**: Only the owning organization can update or delete a drive.
- **Drive Notifications / Job Notifications**: Created only by the server (Admin SDK). Colleges can only update the `status` and `respondedAt` fields — they cannot modify the notification content.
- **Student Notifications**: Students can only update `read` and `readAt` fields on their own notifications.
- **Error Logs**: Append-only — no one can delete error logs.
- **Registration Requests**: Students can create requests; college admins can approve/reject by updating `status`, `reviewedAt`, `reviewedBy`, and `rejectionReason` only.

The `normalizedFieldsUnchanged()` helper function prevents direct modification of normalized name fields, ensuring the college name normalization system stays consistent across all queries.

### Anti-Cheat and Security Monitoring

`lib/security/anti-cheat.ts` and `components/SecurityMonitor.tsx` implement interview integrity features:

- Tab switch detection (candidate leaves the interview window)
- Copy-paste detection during interviews
- Unusual response timing detection (too fast = likely copied)
- Multiple device session detection
- All security events logged to the evaluation report

---

## 12. Interview Drive Lifecycle

A complete interview drive goes through these stages:

```
Organization creates drive (status: draft)
          │
          ▼
Organization adds questions (AI-generated or manual)
          │
          ▼
Organization sends job notification to colleges
          │
          ▼
College accepts notification
          │
          ▼
College assigns students to drive
          │
          ▼
Organization activates drive (status: active)
          │
          ▼
Interview sessions created for each assigned student
          │
          ▼
Students receive email invitations
          │
          ▼
Students complete AI voice interviews
          │
          ▼
Evaluation reports generated automatically
          │
          ▼
Organization reviews all reports
          │
          ▼
Organization finalizes results (status: finalized)
          │
          ▼
Selected candidates notified
          │
          ▼
PDF reports generated for all candidates
          │
          ▼
Drive marked complete (status: completed)
```

---

## 13. Voice Interview System

HireFlow uses Vapi AI for real-time voice interviews.

### How Vapi Works in HireFlow

1. **Interview Start**: Candidate clicks "Start Interview" on their dashboard
2. **Vapi Connection**: Frontend initializes Vapi client with `@vapi-ai/web`
3. **AI Interviewer**: Vapi's AI voice reads questions naturally
4. **Candidate Response**: Candidate speaks their answers
5. **Real-time Transcription**: Vapi transcribes speech to text in real-time
6. **Transcript Building**: Each exchange is stored as `{role: "assistant"|"user", content: string}`
7. **Interview End**: Candidate clicks "End Interview"
8. **Submission**: Transcript sent to `/api/candidate/submit-interview`
9. **Analysis**: Hybrid NLP system analyzes all responses

### Voice Analysis Integration

Beyond text analysis, HireFlow also analyzes voice patterns:
- Speech pace and rhythm
- Filler word frequency (um, uh, like, you know)
- Pause patterns
- Response length consistency
- Engagement level over time

### Vapi Configuration

HireFlow configures Vapi with a custom AI interviewer persona:

```typescript
// lib/vapi.config.ts
export const vapiConfig = {
  name: "HireFlow Interviewer",
  voice: {
    provider: "11labs",
    voiceId: "professional-male"
  },
  model: {
    provider: "openai",
    model: "gpt-4",
    systemPrompt: `You are a professional technical interviewer for HireFlow.
    Ask the provided questions one at a time. Be professional, encouraging, and clear.
    After each answer, acknowledge briefly and move to the next question.
    Do not evaluate answers during the interview — just collect responses.`
  },
  firstMessage: "Hello! Welcome to your HireFlow interview. I'll be asking you a series of questions today. Please speak clearly and take your time with each answer. Let's begin.",
  endCallMessage: "Thank you for completing the interview. Your responses are being analyzed and you'll receive your evaluation report shortly.",
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en-US"
  }
};
```

### Interview Timer and Progress

`components/InterviewTimer.tsx` and `components/InterviewProgress.tsx` provide:
- Real-time countdown timer per question
- Overall interview progress bar
- Question number indicator (e.g., "Question 3 of 7")
- Visual cue when time is running low (last 30 seconds)

### Swipe Navigation

`components/SwipeNavigation.tsx` enables mobile-friendly swipe gestures:
- Swipe left to advance to the next question
- Swipe right to go back to the previous question
- Touch gesture support via `lib/utils/touch-gestures.ts`

---

## 14. Report Generation

HireFlow generates detailed PDF reports for every interview.

### Report Service

**File:** `lib/services/report-generation.service.ts`

This is one of the largest files in the codebase (~3,800+ lines) and handles:

- Executive summary generation
- Score visualization
- Per-question analysis tables
- Interview transcript formatting
- Emotion analysis charts
- Confidence tracking graphs
- Recommendation section
- Improvement suggestions
- Industry-specific insights

### Report Sections

**Candidate Report (Full Detail):**
1. Cover page with candidate name, role, date
2. Executive summary with overall recommendation
3. Score breakdown (technical, communication, problem-solving)
4. Emotion and confidence analysis
5. Per-question analysis with scores and feedback
6. Full interview transcript
7. Strengths and improvement areas
8. Personalized learning path
9. Industry-specific insights

**Recruiter Report (Summary):**
1. Candidate overview
2. Overall scores and recommendation
3. Key strengths and concerns
4. Comparison with other candidates
5. Hiring recommendation with justification

### PDF Generation

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const doc = new jsPDF();
doc.text('Interview Evaluation Report', 20, 20);
autoTable(doc, {
  head: [['Metric', 'Score', 'Level']],
  body: [
    ['Technical', '85', 'Excellent'],
    ['Communication', '72', 'Good'],
    ['Problem Solving', '78', 'Good']
  ]
});
doc.save('evaluation-report.pdf');
```

---

## 15. Analytics & Dashboards

### Organization Analytics

**Endpoint:** `GET /api/analytics/recruiter/[orgId]`

Metrics available:
- Total candidates interviewed
- Placement rate (selected / total)
- Average scores by drive
- Score distribution histogram
- College-wise performance comparison
- Role-wise analytics
- Drive performance over time
- Top performing candidates

### College Analytics

Available through college dashboard:
- Total students placed
- Placement rate by company
- Average scores across all drives
- Student performance distribution
- Drive participation rates
- Year-wise placement trends

### Scoring Weights and Calculation

`lib/scoring/weighted-scoring.ts` implements the scoring engine:

```typescript
// Default scoring weights
const SCORING_WEIGHTS = {
  technical:              0.30,  // Technical accuracy and depth
  communication:          0.25,  // Clarity, structure, vocabulary
  problemSolving:         0.20,  // Analytical thinking, approach
  confidence:             0.15,  // Confidence level from NLP
  stressManagement:       0.10   // Inverse of stress level
};

// Score calculation
overallScore = (
  technicalScore    * 0.30 +
  communicationScore * 0.25 +
  problemSolvingScore * 0.20 +
  confidenceScore   * 0.15 +
  (100 - stressScore) * 0.10
);
```

Organizations can customize weights per job profile — a highly technical role might weight technical score at 50% while a customer-facing role might weight communication at 40%.

### Adaptive Difficulty

`lib/adaptive/difficulty-engine.ts` and `lib/adaptive/question-ordering.ts` implement adaptive interview logic:

- Questions start at the configured difficulty level
- If the candidate answers well (score ≥ 75), the next question increases in difficulty
- If the candidate struggles (score < 40), the next question decreases in difficulty
- This creates a more accurate assessment by finding the candidate's true skill ceiling
- Difficulty levels: `easy → medium → hard → expert`

### Candidate Ranking

`lib/services/ranking.service.ts` ranks candidates within a drive:

- Candidates ranked by overall score (descending)
- Tie-breaking: communication score, then technical score
- Percentile calculation: where each candidate falls relative to all candidates in the drive
- Top N selection: organization specifies how many candidates to select; the service recommends the top N

---

## 16. Email Notification System

HireFlow sends automated emails using Nodemailer and Resend.

### Email Types

| Trigger | Recipients | Content |
|---------|-----------|---------|
| Student registration | Student | Welcome + login instructions |
| Drive invitation | Student | Interview details + link |
| Interview reminder | Student | 24-hour reminder |
| Interview complete | Student | Confirmation + report link |
| Results available | Student | Score summary + full report link |
| Selection notification | Student | Congratulations + next steps |
| New job notification | College admin | Job details + action required |
| Drive assigned | College admin | Drive details + student list |

### Email Configuration

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
RESEND_API_KEY=your-resend-key
```

---

## 17. File Upload & Processing

### Student Bulk Upload

Colleges can upload student data via CSV or Excel:

**Supported Formats:** CSV, XLSX, XLS

**Required Columns:**
```
name, email, rollNumber, branch, year
```

**Optional Columns:**
```
cgpa, phone, address, skills
```

**Processing Flow:**
1. File uploaded to `/api/colleges/[collegeId]/upload-students`
2. File type detected (CSV vs Excel)
3. Parsed with papaparse (CSV) or xlsx (Excel)
4. Each row validated for required fields
5. Duplicate emails detected and skipped
6. Valid students created in Firestore
7. Welcome emails sent to new students
8. Summary returned: created, skipped, errors

### Resume/Document Processing

For future features, HireFlow includes:
- `mammoth` for DOCX parsing
- `pdf-parse` for PDF text extraction
- Used for resume analysis and job matching

---

## 18. Environment Variables

Create a `.env.local` file in the project root with all of the following variables. Every variable marked **required** must be set before the app will start correctly.

### Firebase Client SDK (required — frontend)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

These values come from your Firebase project settings → General → Your apps → Web app → SDK setup and configuration.

### Firebase Admin SDK (required — server-side)

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

Download the service account JSON from Firebase Console → Project Settings → Service Accounts → Generate new private key. Copy the three fields above from that JSON file. The private key must be wrapped in double quotes and newlines replaced with `\n`.

### Groq AI (required — LLM evaluation)

```env
GROQ_API_KEY=gsk_...
```

Get your key from https://console.groq.com/keys. The free tier supports Llama 3 inference which is what HireFlow uses for comprehensive interview evaluation.

### Vapi Voice AI (required — voice interviews)

```env
NEXT_PUBLIC_VAPI_WEB_TOKEN=vapi_...
VAPI_API_KEY=vapi_...
```

Create an account at https://vapi.ai, then go to Dashboard → API Keys. The `NEXT_PUBLIC_VAPI_WEB_TOKEN` is the public web token used in the browser SDK. The `VAPI_API_KEY` is the private server key used for server-side Vapi operations.

### HuggingFace AI Models (required — question generation and NLP)

```env
HUGGINGFACE_API_KEY=hf_...
NEXT_PUBLIC_QWEN_SPACE_URL=https://somriksur-hireflow-qwen-api.hf.space
NEXT_PUBLIC_NLP_SPACE_URL=https://somriksur-hireflow-nlp-evaluation.hf.space
```

Get your HuggingFace token from https://huggingface.co/settings/tokens. The Space URLs point to the two deployed AI models. If you deploy your own copies, update these URLs accordingly.

### Google Gemini AI (optional — additional AI capabilities)

```env
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...
```

Used by the `@ai-sdk/google` and `@google/generative-ai` packages for supplementary AI features. Get a key from https://aistudio.google.com/app/apikey.

### Email — Nodemailer / Gmail SMTP (required for email notifications)

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM=HireFlow <your-gmail@gmail.com>
```

For Gmail, you must use an **App Password** (not your regular password). Enable 2FA on your Google account, then go to Google Account → Security → App Passwords → Generate. The app password is 16 characters with no spaces.

### Email — Resend (optional, alternative to Nodemailer)

```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

Resend is a transactional email service. Get your key from https://resend.com/api-keys. If both Nodemailer and Resend are configured, HireFlow uses Resend as the primary sender.

### Application Settings (optional)

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

`NEXT_PUBLIC_APP_URL` is used to build absolute URLs in emails (e.g., the "View Report" button link). Set it to your production domain in production.

### Model Training Variables (only needed if retraining models)

```env
HUGGINGFACE_USERNAME=your_username
BASE_MODEL_ID=Qwen/Qwen2.5-0.5B-Instruct
CURRENT_MODEL_ID=somriksur/HireFlow-Qwen-Fresh-Pro
TRAINING_DATA_SIZE=5270
TARGET_ACCURACY=90
TRAINING_TIME_HOURS=3
USE_GPU=true
GPU_MEMORY_FRACTION=0.8
BATCH_SIZE=2
GRADIENT_ACCUMULATION_STEPS=16
ENABLE_LOGGING=true
LOG_LEVEL=INFO
SAVE_CHECKPOINTS=true
CHECKPOINT_STEPS=100
```

These are only needed if you are retraining the Qwen question generation model. They are not required for running the application.

### Complete `.env.local` Template

```env
# ─── Firebase Client (public) ───────────────────────────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# ─── Firebase Admin (server-only) ───────────────────────────────────────────
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# ─── AI Services ────────────────────────────────────────────────────────────
GROQ_API_KEY=
NEXT_PUBLIC_VAPI_WEB_TOKEN=
VAPI_API_KEY=
HUGGINGFACE_API_KEY=
NEXT_PUBLIC_QWEN_SPACE_URL=https://somriksur-hireflow-qwen-api.hf.space
NEXT_PUBLIC_NLP_SPACE_URL=https://somriksur-hireflow-nlp-evaluation.hf.space
GOOGLE_GENERATIVE_AI_API_KEY=

# ─── Email ───────────────────────────────────────────────────────────────────
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# ─── App ─────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 19. Local Development Setup

### Prerequisites

Before you begin, make sure you have the following installed and configured:

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 20.x or higher | Use `node --version` to check |
| npm | 10.x or higher | Comes with Node.js |
| Git | Any recent version | For cloning the repo |
| Firebase CLI | Latest | `npm install -g firebase-tools` |
| A Firebase project | — | Free Spark plan is sufficient |
| A Groq account | — | Free tier available at console.groq.com |
| A Vapi account | — | Free tier available at vapi.ai |
| A HuggingFace account | — | Free at huggingface.co |

### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-org/hireflow.git
cd hireflow
```

### Step 2 — Install Dependencies

```bash
npm install
```

This installs all ~200 packages listed in `package.json`. The install takes 2-3 minutes on first run.

### Step 3 — Set Up Firebase

**3a. Create a Firebase project:**
1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Enter a project name (e.g., `hireflow-dev`)
4. Disable Google Analytics (not needed)
5. Click "Create project"

**3b. Enable Firestore:**
1. In your Firebase project, go to Build → Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select a region close to you (e.g., `us-central1`)
5. Click "Enable"

**3c. Enable Authentication:**
1. Go to Build → Authentication
2. Click "Get started"
3. Under Sign-in method, enable "Email/Password"
4. Click "Save"

**3d. Get your Firebase config:**
1. Go to Project Settings (gear icon) → General
2. Scroll to "Your apps" → click the web icon `</>`
3. Register the app with a nickname (e.g., `hireflow-web`)
4. Copy the `firebaseConfig` object values into your `.env.local`

**3e. Get your service account key:**
1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Copy `project_id`, `client_email`, and `private_key` into `.env.local`

**3f. Deploy Firestore security rules:**
```bash
firebase login
firebase use --add   # select your project
firebase deploy --only firestore:rules
```

### Step 4 — Configure Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in all required values as described in Section 18.

### Step 5 — Start the Development Server

```bash
npm run dev
```

The app starts on http://localhost:3000. You should see the HireFlow landing page.

For faster hot-reload using Turbopack:
```bash
npm run dev:turbo
```

### Step 6 — Create Your First User

1. Open http://localhost:3000/auth/sign-up
2. Register as an Organization, College, or Candidate
3. Log in at http://localhost:3000/auth/sign-in

### Step 7 — Verify AI Services

Open http://localhost:3000/api/ai/health-check in your browser. You should see:
```json
{
  "status": "healthy",
  "qwenSpace": "healthy",
  "timestamp": "2026-05-05T10:00:00.000Z"
}
```

If the Qwen Space shows `"loading"`, wait 30-60 seconds for the HuggingFace Space to wake up (free tier Spaces sleep after inactivity).

### Step 8 — Test the NLP System

Open http://localhost:3000/test-nlp in your browser. This page lets you test the hybrid NLP analysis system directly by entering sample interview responses.

### Troubleshooting Common Issues

**"Firebase: Error (auth/invalid-api-key)"**
→ Your `NEXT_PUBLIC_FIREBASE_API_KEY` is wrong or missing. Double-check the value in `.env.local`.

**"Error: FIREBASE_PRIVATE_KEY is not set"**
→ Make sure the private key in `.env.local` is wrapped in double quotes and all newlines are `\n`.

**"Groq API error: 401 Unauthorized"**
→ Your `GROQ_API_KEY` is invalid. Generate a new key at https://console.groq.com/keys.

**HuggingFace Space returns 503**
→ The Space is sleeping. Make a request to the Space URL directly to wake it up, then wait 30-60 seconds.

**"Cannot find module 'firebase-admin'"**
→ Run `npm install` again. Some packages may not have installed correctly.

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Development server | `npm run dev` | Starts Next.js dev server on port 3000 with hot reload |
| Development (Turbopack) | `npm run dev:turbo` | Starts with Turbopack for faster compilation |
| Production build | `npm run build` | Compiles and optimizes for production |
| Production server | `npm start` | Runs the production build |
| Linting | `npm run lint` | Runs ESLint across all TypeScript/TSX files |
| All tests | `npm test` | Runs the full Jest test suite once |
| Watch mode tests | `npm run test:watch` | Runs Jest in interactive watch mode |
| Firebase connection test | `npm run test:firebase` | Tests Firebase Admin SDK connectivity |

---

## 20. Deployment

### Vercel (Recommended)

HireFlow is pre-configured for Vercel deployment. The `.vercel/project.json` file already contains the project and organization IDs.

**Step 1 — Install Vercel CLI:**
```bash
npm install -g vercel
```

**Step 2 — Link to your Vercel project:**
```bash
vercel link
```

**Step 3 — Add environment variables to Vercel:**

Go to your Vercel project dashboard → Settings → Environment Variables. Add every variable from Section 18. Pay special attention to `FIREBASE_PRIVATE_KEY` — paste the entire key including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines, with actual newlines (not `\n`). Vercel handles the escaping automatically.

**Step 4 — Deploy:**
```bash
vercel --prod
```

Or push to your `main` branch if you have GitHub integration enabled — Vercel auto-deploys on every push.

**Vercel Project Settings:**

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Install Command | `npm install` |
| Node.js Version | 20.x |
| Root Directory | `.` (project root) |

**Important:** The build uses `--turbopack` flag (`"build": "next build --turbopack"` in package.json). Vercel supports this natively.

**Custom Domain:**
1. Go to Vercel project → Settings → Domains
2. Add your domain (e.g., `hireflow.yourdomain.com`)
3. Update `NEXT_PUBLIC_APP_URL` environment variable to match
4. Update `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` if using a custom Firebase auth domain

### Firebase Hosting (Alternative)

HireFlow can also be deployed to Firebase Hosting alongside Firestore:

```bash
npm run build
firebase deploy --only hosting
```

The `firebase.json` and `.firebaserc` files are already configured. Note that Firebase Hosting serves static files — for the Next.js API routes you still need a server (Vercel, Cloud Run, or similar).

### Docker (Self-Hosted)

For self-hosted deployments:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t hireflow .
docker run -p 3000:3000 --env-file .env.local hireflow
```

### HuggingFace Spaces — AI Model Deployment

Both AI models are deployed as HuggingFace Spaces. Here is how to deploy or redeploy them.

**Model 1 — HireFlow-Qwen-Fresh-Pro (Question Generation):**

1. Go to https://huggingface.co/spaces and click "Create new Space"
2. Name: `hireflow-qwen-api`
3. SDK: Gradio
4. Hardware: CPU Basic (free) or T4 GPU for faster inference
5. Clone the Space repository:
   ```bash
   git clone https://huggingface.co/spaces/YOUR_USERNAME/hireflow-qwen-api
   ```
6. Copy your fine-tuned model files into the cloned directory
7. Push to deploy:
   ```bash
   git add . && git commit -m "Deploy Qwen model" && git push
   ```
8. Update `NEXT_PUBLIC_QWEN_SPACE_URL` in your environment variables to point to the new Space URL

**Model 2 — HireFlow NLP Evaluation (RoBERTa):**

1. Create a new Space with Docker SDK
2. Name: `hireflow-nlp-evaluation`
3. Hardware: T4 GPU (required for reasonable inference speed — ~$0.60/hour on HuggingFace)
4. Clone and copy all files from `huggingface_nlp_space/`:
   ```bash
   git clone https://huggingface.co/spaces/YOUR_USERNAME/hireflow-nlp-evaluation
   cp huggingface_nlp_space/* hireflow-nlp-evaluation/
   ```
5. The `best_model_90percent.pt` file is 481 MB — use Git LFS:
   ```bash
   cd hireflow-nlp-evaluation
   git lfs install
   git lfs track "*.pt"
   git add .gitattributes
   git add . && git commit -m "Deploy NLP model" && git push
   ```
6. The Space builds automatically using the Dockerfile. Build takes 5-10 minutes.
7. Update `NEXT_PUBLIC_NLP_SPACE_URL` in your environment variables

**Space Sleep Policy:**
HuggingFace free tier Spaces sleep after 48 hours of inactivity. The first request after sleep takes 30-60 seconds to wake up. The hybrid NLP system handles this gracefully — if the NLP Space is sleeping, it falls back to rule-based analysis automatically.

To keep Spaces awake, upgrade to a paid tier or set up a cron job that pings the health endpoint every 24 hours.

### Production Checklist

Before going live, verify:

- [ ] All environment variables set in Vercel (or your hosting provider)
- [ ] Firebase security rules deployed (`firebase deploy --only firestore:rules`)
- [ ] Firebase Authentication domain whitelist includes your production domain
- [ ] Both HuggingFace Spaces are running and healthy
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL
- [ ] Email sending tested (send a test registration email)
- [ ] Groq API key has sufficient quota for expected load
- [ ] Vapi account has sufficient minutes for expected interview volume
- [ ] Custom domain configured and SSL certificate active

---

## 21. Testing

HireFlow uses Jest as the test runner with `ts-jest` for TypeScript support and `jest-environment-jsdom` for browser environment simulation.

### Test Configuration

**`jest.config.js`** — Jest is configured with:
- `ts-jest` transformer for TypeScript files
- `jsdom` test environment for React component tests
- `node` environment for API and service tests
- Module name mapper for `@/` path aliases
- Setup file: `jest.setup.js` (imports `@testing-library/jest-dom`)

### Test Files

| File | What It Tests |
|------|--------------|
| `app/api/colleges/__tests__/search.test.ts` | College search API — fuzzy matching, normalization |
| `app/api/colleges/__tests__/upload-students.test.ts` | Bulk student upload — CSV/Excel parsing, validation |
| `app/api/colleges/__tests__/tag-students.test.ts` | Student tagging for drives |
| `app/api/colleges/__tests__/error-handling.test.ts` | API error responses and edge cases |
| `app/api/colleges/__tests__/job-notifications.test.ts` | Job notification creation and delivery |
| `app/api/interview-drives/__tests__/assign-students.test.ts` | Student assignment to drives |
| `app/api/interview-drives/__tests__/ai-pipeline.test.ts` | AI question generation pipeline |
| `app/api/drive-notifications/__tests__/respond.test.ts` | College notification response flow |
| `lib/actions/__tests__/` | Server action unit tests |
| `lib/middleware/__tests__/` | Access control and validation middleware |
| `lib/nlp/__tests__/` | NLP analysis accuracy tests |
| `lib/security/__tests__/` | Auth context and role guard tests |
| `lib/services/__tests__/` | Service layer unit tests |
| `scripts/__tests__/migration.test.ts` | Database migration validation |
| `scripts/__tests__/migration-properties.test.ts` | Migration property tests |
| `types/__tests__/interview-drive.test.ts` | TypeScript type validation |
| `types/__tests__/job-posting.test.ts` | Job posting type tests |

### Running Tests

**Run all tests once:**
```bash
npm test
```

**Run tests in watch mode (re-runs on file changes):**
```bash
npm run test:watch
```

**Run a specific test file:**
```bash
npx jest app/api/colleges/__tests__/search.test.ts
```

**Run tests matching a pattern:**
```bash
npx jest --testNamePattern="should return 404"
```

**Run with coverage report:**
```bash
npx jest --coverage
```

**Run only NLP tests:**
```bash
npx jest lib/nlp
```

**Test Firebase connection:**
```bash
npm run test:firebase
```
This runs `scripts/test-firebase-connection.ts` which verifies that the Firebase Admin SDK can connect to Firestore using your environment variables.

### Test Categories

**Unit Tests** — Test individual functions and services in isolation:
- NLP analysis functions
- Score calculation logic
- Validation schemas
- Utility functions

**Integration Tests** — Test API routes with mocked Firebase:
- Authentication flows
- CRUD operations
- Role-based access control
- Error handling

**Property-Based Tests** — Use `fast-check` to test with randomly generated inputs:
- Input validation edge cases
- Score boundary conditions
- Data normalization

### Writing New Tests

Test files follow this pattern:

```typescript
// lib/services/__tests__/my-service.test.ts
import { myFunction } from '../my-service';

describe('myFunction', () => {
  it('should return expected result for valid input', () => {
    const result = myFunction({ input: 'valid' });
    expect(result).toEqual({ output: 'expected' });
  });

  it('should throw for invalid input', () => {
    expect(() => myFunction({ input: '' })).toThrow('Input cannot be empty');
  });
});
```

For API route tests, mock Firebase Admin:
```typescript
jest.mock('@/firebase/admin', () => ({
  db: {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
  }
}));
```

### NLP Accuracy Tests

The NLP system has dedicated accuracy tests in `lib/nlp/__tests__/` that verify:

- Simple cases (5 patterns): 100% accuracy required
- Edge cases (10 patterns): 100% accuracy required
- Sarcasm detection: correctly identified
- Imposter syndrome: correctly identified
- Overconfidence: correctly identified
- Burnout signals: correctly identified

These tests run against the rule-based NLP engine (no external API calls needed) and must pass before any NLP changes are merged.



---

## 22. Project File Structure

```
hireflow/
├── app/
│   ├── (root)/
│   │   ├── layout.tsx              # Root layout with auth check
│   │   ├── page.tsx                # Home page (candidate dashboard)
│   │   └── test-nlp/
│   │       └── page.tsx            # NLP testing page
│   ├── api/
│   │   ├── ai/
│   │   │   ├── generate-questions/ # Qwen model question generation
│   │   │   ├── simple-generate/    # Simplified question generation
│   │   │   ├── template-generate/  # Template-based generation
│   │   │   ├── fallback-generate/  # Training data questions
│   │   │   ├── health-check/       # AI model health status
│   │   │   └── simple-test/        # Simple AI test endpoint
│   │   ├── auth/
│   │   │   ├── me/                 # Current user endpoint
│   │   │   ├── register/           # User registration
│   │   │   └── session/            # Session management
│   │   ├── candidate/
│   │   │   ├── history/            # Interview history
│   │   │   ├── interview/[id]/     # Interview details
│   │   │   ├── learning-path/      # Learning recommendations
│   │   │   ├── submit-interview/   # Submit completed interview
│   │   │   ├── delete-interview/   # Delete interview
│   │   │   └── delete-feedback/    # Delete feedback
│   │   ├── colleges/
│   │   │   ├── [collegeId]/
│   │   │   │   ├── route.ts        # College CRUD
│   │   │   │   ├── students/       # List students
│   │   │   │   ├── upload-students/ # Bulk CSV/Excel upload
│   │   │   │   ├── interview-drives/ # College drives
│   │   │   │   ├── job-notifications/ # Job notifications
│   │   │   │   ├── notifications/  # All notifications
│   │   │   │   ├── messages/       # Org messages
│   │   │   │   ├── reports/        # Placement reports
│   │   │   │   ├── selections/     # Selected candidates
│   │   │   │   ├── drive-selections/ # Drive selections
│   │   │   │   └── registration-requests/ # Student registration
│   │   │   ├── by-admin/[adminId]/ # College by admin
│   │   │   └── search/             # College search
│   │   ├── interview-drives/
│   │   │   └── [driveId]/
│   │   │       ├── route.ts        # Drive CRUD
│   │   │       ├── assign-students/ # Assign students
│   │   │       ├── create-interviews/ # Create sessions
│   │   │       ├── finalize-results/ # Finalize and select
│   │   │       ├── generate-reports/ # Generate PDFs
│   │   │       ├── match-jobs/     # Job matching
│   │   │       └── tag-students/   # Tag students
│   │   ├── interview-sessions/
│   │   │   ├── route.ts            # List/create sessions
│   │   │   └── [sessionId]/        # Session details
│   │   ├── job-notifications/
│   │   │   ├── route.ts            # List/create notifications
│   │   │   └── [notificationId]/   # Notification details + respond
│   │   ├── job-profiles/
│   │   │   ├── route.ts            # List/create profiles
│   │   │   └── [jobId]/            # Profile CRUD
│   │   ├── job-postings/
│   │   │   └── [jobId]/            # Job posting details
│   │   ├── nlp/
│   │   │   └── analyze-interview/  # Hybrid NLP analysis endpoint
│   │   ├── analytics/
│   │   │   └── recruiter/[orgId]/  # Recruiter analytics
│   │   ├── organization/           # Organization management
│   │   ├── students/               # Student management
│   │   ├── users/                  # User management
│   │   ├── notifications/          # Notification management
│   │   ├── reports/                # Report generation
│   │   ├── security/               # Security monitoring
│   │   ├── vapi/                   # Vapi webhook handlers
│   │   ├── college-notifications/  # College notification responses
│   │   ├── drive-notifications/    # Drive notification management
│   │   └── debug/                  # Debug endpoints (dev only)
│   ├── auth/
│   │   ├── sign-in/                # Login page
│   │   └── sign-up/                # Registration page
│   ├── candidate/
│   │   ├── dashboard/              # Candidate home
│   │   ├── interview/              # Interview interface
│   │   ├── history/                # Past interviews
│   │   ├── feedback/               # Feedback reports
│   │   ├── analytics/              # Personal analytics
│   │   └── learning/               # Learning path
│   ├── college/
│   │   └── [collegeId]/            # College dashboard pages
│   ├── organization/
│   │   └── [orgId]/                # Organization dashboard pages
│   ├── student/
│   │   ├── [studentId]/            # Student profile
│   │   ├── register/               # Student registration
│   │   └── check-status/           # Registration status
│   ├── interview/                  # Interview page
│   ├── notifications/              # Notifications page
│   ├── onboarding/                 # Onboarding flow
│   ├── search/                     # Global search
│   ├── globals.css                 # Global styles
│   └── layout.tsx                  # Root HTML layout
├── components/
│   ├── ui/                         # Radix UI base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── badge.tsx
│   │   ├── checkbox.tsx
│   │   ├── label.tsx
│   │   ├── textarea.tsx
│   │   ├── alert.tsx
│   │   ├── sonner.tsx              # Toast notifications
│   │   └── theme-aware-card.tsx
│   ├── college/
│   │   └── Navigation.tsx          # College sidebar navigation
│   ├── student/
│   │   ├── Navigation.tsx          # Student sidebar navigation
│   │   ├── CollegeSearchInput.tsx  # Fuzzy college search
│   │   ├── LearningPathCard.tsx    # Learning recommendation card
│   │   └── SelectionStatusCard.tsx # Placement status card
│   ├── interview/
│   │   └── VoiceInterviewSession.tsx # Main voice interview UI
│   ├── nlp/
│   │   └── ResponseAnalyzer.tsx    # NLP result visualization
│   ├── notifications/
│   │   └── NotificationBadge.tsx   # Unread count badge
│   ├── messages/
│   │   └── MessageCard.tsx         # Message display card
│   ├── reports/
│   │   ├── ComprehensiveReportView.tsx # Full report display
│   │   ├── RecommendationBadge.tsx # Hire/reject badge
│   │   ├── ReportExporter.tsx      # PDF/HTML export button
│   │   └── VoiceAnalysisCard.tsx   # Voice metrics card
│   ├── AuthForm.tsx                # Login/register form
│   ├── BulkInterviewCreator.tsx    # Bulk interview creation UI
│   ├── CandidateInterviewCard.tsx  # Candidate's interview card
│   ├── CodeEditor.tsx              # Monaco code editor
│   ├── CSVEmailImporter.tsx        # CSV email import tool
│   ├── DifficultyBadge.tsx         # Question difficulty badge
│   ├── DifficultySelector.tsx      # Difficulty picker
│   ├── DisplayTechIconsClient.tsx  # Tech stack icons
│   ├── ExportPDFButton.tsx         # PDF export button
│   ├── FeedbackRequest.tsx         # Feedback request form
│   ├── FromField.tsx               # Form field wrapper
│   ├── GlobalSearch.tsx            # Global search bar
│   ├── InterviewCard.tsx           # Interview summary card
│   ├── InterviewFilters.tsx        # Interview list filters
│   ├── InterviewInvitation.tsx     # Interview invite display
│   ├── InterviewProgress.tsx       # Progress indicator
│   ├── InterviewScheduler.tsx      # Schedule picker
│   ├── InterviewTimer.tsx          # Countdown timer
│   ├── MultipleEmailInvitations.tsx # Bulk email invites
│   ├── NotificationBell.tsx        # Notification bell icon
│   ├── PerformanceCharts.tsx       # Analytics charts
│   ├── RecruiterFeedbackCard.tsx   # Recruiter view of feedback
│   ├── RecruiterInterviewCard.tsx  # Recruiter interview card
│   ├── RichTextEditor.tsx          # TipTap rich text editor
│   ├── RichTextViewer.tsx          # Read-only rich text viewer
│   ├── ScoringWeights.tsx          # Score weight configurator
│   ├── SecurityMonitor.tsx         # Anti-cheat monitor
│   ├── SwipeNavigation.tsx         # Mobile swipe navigation
│   ├── TeamCollaboration.tsx       # Team features
│   ├── TestCaseRunner.tsx          # Code test runner
│   ├── ThemeToggle.tsx             # Dark/light mode toggle
│   ├── theme-provider.tsx          # next-themes provider
│   └── VoiceInterview.tsx          # Voice interview wrapper
├── lib/
│   ├── actions/
│   │   ├── auth.action.ts          # Auth server actions
│   │   ├── candidate.action.ts     # Candidate server actions
│   │   ├── general.action.ts       # General server actions
│   │   └── recruiter.action.ts     # Recruiter server actions
│   ├── adaptive/
│   │   ├── difficulty-engine.ts    # Adaptive difficulty logic
│   │   └── question-ordering.ts    # Question sequence optimization
│   ├── analytics/
│   │   └── candidate-analytics.ts  # Candidate analytics calculations
│   ├── code-execution/
│   │   ├── languages.ts            # Supported programming languages
│   │   └── runner.ts               # Code execution engine
│   ├── collaboration/
│   │   └── team-management.ts      # Team collaboration features
│   ├── email/
│   │   ├── config.ts               # Email provider configuration
│   │   ├── errors.ts               # Email error types
│   │   ├── gmail-smtp.ts           # Gmail SMTP sender
│   │   ├── notifications.ts        # Email notification templates
│   │   ├── send-email.ts           # Email sending orchestrator
│   │   └── validation.ts           # Email address validation
│   ├── gemini/
│   │   ├── evaluate-answer.ts      # Gemini answer evaluation
│   │   └── test-evaluation.ts      # Evaluation testing
│   ├── groq/
│   │   └── generate-questions/     # Groq question generation
│   ├── middleware/
│   │   ├── access-control.ts       # Route access control
│   │   └── college-validation.ts   # College name validation
│   ├── nlp/
│   │   ├── sentiment-behavior-analysis.ts    # Rule-based sentiment
│   │   ├── advanced-emotion-detection.ts     # Emotion detection
│   │   ├── real-time-confidence-tracker.ts   # Confidence tracking
│   │   ├── semantic-evaluation.service.ts    # Semantic analysis
│   │   ├── explainable-nlp.service.ts        # Explainable scores
│   │   ├── feedback-generation.service.ts    # Feedback text
│   │   ├── industry-specific-evaluator.ts    # Industry evaluation
│   │   ├── multi-modal-integration.ts        # Text + voice fusion
│   │   ├── voice-analysis.service.ts         # Voice patterns
│   │   ├── advanced-linguistic-analysis.ts   # Linguistic analysis
│   │   ├── learning-path.service.ts          # Learning path generation
│   │   └── generate-feedback/               # Feedback generation
│   ├── notifications/
│   │   ├── send-notification.ts    # Notification sender
│   │   └── types.ts                # Notification type definitions
│   ├── pdf/
│   │   └── generate-report.ts      # PDF generation utilities
│   ├── scoring/
│   │   └── weighted-scoring.ts     # Score calculation engine
│   ├── security/
│   │   ├── anti-cheat.ts           # Anti-cheat detection
│   │   ├── auth-context.ts         # Auth context extraction
│   │   └── guards.ts               # Role-based guards
│   ├── services/
│   │   ├── ultimate-hybrid-nlp.service.ts    # Main hybrid NLP
│   │   ├── ml-nlp.service.ts                 # RoBERTa API client
│   │   ├── hybrid-nlp.service.ts             # Legacy hybrid NLP
│   │   ├── ml-nlp-with-fallback.service.ts   # ML with fallback
│   │   ├── ml-nlp-integration.service.ts     # ML integration
│   │   ├── ai-model.service.ts               # Qwen Space client
│   │   ├── hybrid-question-generation.service.ts  # Hybrid questions
│   │   ├── fallback-questions.service.ts     # Training data questions
│   │   ├── nlp-evaluation.service.ts         # Full evaluation pipeline
│   │   ├── report-generation.service.ts      # PDF report generation
│   │   ├── auto-finalize.service.ts          # Auto-finalize drives
│   │   ├── categorization.service.ts         # Candidate categorization
│   │   ├── college-name.service.ts           # College name normalization
│   │   ├── college-resolution.service.ts     # College lookup
│   │   ├── migration-validation.service.ts   # DB migration validation
│   │   ├── notification.service.ts           # Notification orchestration
│   │   ├── ranking.service.ts                # Candidate ranking
│   │   ├── readiness.service.ts              # Interview readiness check
│   │   └── resume-nlp.service.ts             # Resume analysis
│   └── utils/
│       ├── evaluation-report.ts    # Report utilities
│       ├── filter-interviews.ts    # Interview filtering
│       ├── search-engine.ts        # Full-text search
│       └── touch-gestures.ts       # Mobile touch handling
├── firebase/
│   ├── admin.ts                    # Firebase Admin SDK initialization
│   └── client.ts                   # Firebase Client SDK initialization
├── types/
│   ├── index.d.ts                  # Main type definitions
│   ├── campus.ts                   # Campus/college types
│   ├── drive-notification.ts       # Drive notification types
│   ├── evaluation-report.ts        # Evaluation report types
│   ├── job-notification.ts         # Job notification types
│   ├── job-posting.ts              # Job posting types
│   ├── messages.ts                 # Message types
│   ├── registration-request.ts     # Registration request types
│   ├── student-selection.ts        # Student selection types
│   ├── vapi.d.ts                   # Vapi SDK types
│   └── vapi-web.d.ts               # Vapi Web SDK types
├── constants/
│   └── index.ts                    # App-wide constants
├── public/
│   ├── covers/                     # Company logo images
│   ├── logo.svg                    # HireFlow logo
│   ├── robot.png                   # AI interviewer avatar
│   └── user-avatar.png             # Default user avatar
├── huggingface_nlp_space/
│   ├── app_simple_working.py       # Gradio NLP application
│   ├── best_model_90percent.pt     # Trained RoBERTa weights (481MB)
│   ├── requirements.txt            # Python dependencies
│   └── Dockerfile                  # Container configuration
├── scripts/
│   ├── test-firebase-connection.ts # Firebase connectivity test
│   ├── update-space.sh             # HuggingFace Space update script
│   └── __tests__/
│       ├── migration.test.ts       # Migration tests
│       └── migration-properties.test.ts # Property-based migration tests
├── training_data.jsonl             # 5,270 Q&A pairs for Qwen fine-tuning
├── test_90_percent_accuracy.py     # NLP model accuracy test script
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── next.config.mjs                 # Next.js configuration
├── tailwind.config (via postcss)   # Tailwind CSS configuration
├── jest.config.js                  # Jest test configuration
├── jest.setup.js                   # Jest setup (testing-library)
├── eslint.config.mjs               # ESLint configuration
├── firestore.rules                 # Firestore security rules
├── firestore.indexes.json          # Firestore composite indexes
├── storage.rules                   # Firebase Storage security rules
├── firebase.json                   # Firebase project configuration
├── .firebaserc                     # Firebase project aliases
├── .env.example                    # Environment variable template
├── .env.local                      # Local environment (gitignored)
├── .vercel/project.json            # Vercel project configuration
└── README.md                       # This file
```

---

## Credits & License

**Built with love by the HireFlow Team**

### Powered By

| Service | Purpose |
|---------|--------|
| Next.js 15 | Full-stack framework |
| Firebase | Database and authentication |
| HuggingFace | AI model hosting |
| Groq (Llama 3) | LLM evaluation |
| Vapi | Voice AI interviews |
| Vercel | Deployment |
| PyTorch | Model training |
| Transformers | RoBERTa base model |
| Gradio | AI model web interface |
| Qwen 2.5 | Base model for question generation |

### License

MIT License — Free to use for any purpose.

---

*HireFlow — Making campus recruitment smarter, faster, and fairer through AI.*

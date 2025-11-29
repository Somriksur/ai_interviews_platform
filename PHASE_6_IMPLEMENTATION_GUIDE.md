# 🚀 Phase 6: Campus Recruitment System - Implementation Guide

## ✅ What's Done
- ✅ Complete documentation in README.md
- ✅ Database schema designed
- ✅ API routes planned
- ✅ User roles defined
- ✅ Implementation roadmap created

---

## 📋 What YOU Need to Do

### 1. Firebase Firestore Setup (30 minutes)

#### Create New Collections

Go to Firebase Console → Firestore Database → Start Collection

**Collection 1: `organizations`**
```javascript
{
  id: "auto-generated",
  name: "TechCorp Solutions",
  email: "admin@techcorp.com",
  phone: "+91-9876543210",
  address: "Mumbai, India",
  adminId: "user-id-from-auth",
  createdAt: Timestamp,
  settings: {
    allowBulkInterviews: true,
    maxColleges: 50,
    maxStudentsPerDrive: 1000
  }
}
```

**Collection 2: `colleges`**
```javascript
{
  id: "auto-generated",
  organizationId: "org-id",
  name: "IIT Bombay",
  location: "Mumbai, Maharashtra",
  contactEmail: "placement@iitb.ac.in",
  contactPhone: "+91-1234567890",
  adminId: "user-id-from-auth",
  createdAt: Timestamp,
  stats: {
    totalStudents: 0,
    interviewsCompleted: 0,
    averagePlacementScore: 0
  }
}
```

**Collection 3: `students`**
```javascript
{
  id: "auto-generated",
  collegeId: "college-id",
  organizationId: "org-id",
  name: "Rahul Sharma",
  email: "rahul@student.iitb.ac.in",
  rollNumber: "20CS001",
  branch: "Computer Science",
  year: 4,
  cgpa: 8.5,
  skills: ["JavaScript", "Python", "React"],
  createdAt: Timestamp
}
```

**Collection 4: `interview_drives`**
```javascript
{
  id: "auto-generated",
  organizationId: "org-id",
  name: "Campus Placement Drive 2024",
  description: "Software Developer positions",
  role: "Software Developer",
  colleges: ["college-id-1", "college-id-2"],
  taggedStudents: ["student-id-1", "student-id-2"],
  status: "pending",
  createdAt: Timestamp,
  completedAt: null,
  stats: {
    totalStudents: 0,
    completedInterviews: 0,
    averageScore: 0
  }
}
```

**Collection 5: `placement_reports`**
```javascript
{
  id: "auto-generated",
  driveId: "drive-id",
  organizationId: "org-id",
  collegeId: "college-id",
  studentId: "student-id",
  skillInsights: {
    technical: ["Strong in React", "Good Python skills"],
    communication: ["Clear articulation"],
    problemSolving: ["Logical approach"],
    leadership: []
  },
  strengths: ["Technical knowledge", "Communication"],
  weaknesses: ["Time management"],
  communicationRating: 85,
  technicalScore: 90,
  overallScore: 87,
  evaluationSummary: "Excellent candidate...",
  recommendedJobs: ["job-id-1", "job-id-2"],
  salaryBand: "high",
  placementCategory: "High-Range Package",
  generatedAt: Timestamp,
  pdfUrl: ""
}
```

**Collection 6: `job_profiles`**
```javascript
{
  id: "auto-generated",
  organizationId: "org-id",
  title: "Senior Software Developer",
  company: "Google",
  description: "Full stack development role...",
  requiredSkills: ["JavaScript", "React", "Node.js"],
  experienceLevel: "0-2 years",
  minimumScore: 75,
  communicationRequirement: 70,
  salaryBand: {
    min: 800000,
    max: 1200000,
    category: "high"
  },
  createdAt: Timestamp
}
```

**Collection 7: `student_job_matches`**
```javascript
{
  id: "auto-generated",
  studentId: "student-id",
  driveId: "drive-id",
  matches: [
    {
      jobId: "job-id-1",
      jobTitle: "Software Developer",
      company: "Google",
      matchScore: 92,
      salaryBand: "high",
      reasons: ["Strong technical skills", "Good communication"]
    }
  ],
  recommendedCategory: "high",
  generatedAt: Timestamp
}
```

---

### 2. Update Firebase Security Rules (15 minutes)

Go to Firebase Console → Firestore Database → Rules

Add these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserRole(uid) {
      return get(/databases/$(database)/documents/users/$(uid)).data.role;
    }
    
    // Existing collections (keep as is)
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }
    
    match /interviews/{interviewId} {
      allow create: if isAuthenticated();
      allow read: if request.auth.uid == resource.data.recruiterId ||
                     request.auth.token.email == resource.data.candidateEmail;
      allow update: if request.auth.token.email == resource.data.candidateEmail;
      allow delete: if request.auth.uid == resource.data.recruiterId;
    }
    
    // NEW: Organizations
    match /organizations/{orgId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && getUserRole(request.auth.uid) == "organization_admin";
      allow update: if isAuthenticated() && resource.data.adminId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.adminId == request.auth.uid;
    }
    
    // NEW: Colleges
    match /colleges/{collegeId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && 
                     (resource.data.adminId == request.auth.uid ||
                      getUserRole(request.auth.uid) == "organization_admin");
      allow delete: if isAuthenticated() && getUserRole(request.auth.uid) == "organization_admin";
    }
    
    // NEW: Students
    match /students/{studentId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // NEW: Interview Drives
    match /interview_drives/{driveId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && getUserRole(request.auth.uid) == "organization_admin";
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated() && getUserRole(request.auth.uid) == "organization_admin";
    }
    
    // NEW: Placement Reports
    match /placement_reports/{reportId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
    }
    
    // NEW: Job Profiles
    match /job_profiles/{jobId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && getUserRole(request.auth.uid) == "organization_admin";
      allow update: if isAuthenticated() && getUserRole(request.auth.uid) == "organization_admin";
      allow delete: if isAuthenticated() && getUserRole(request.auth.uid) == "organization_admin";
    }
    
    // NEW: Student Job Matches
    match /student_job_matches/{matchId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
    }
  }
}
```

---

### 3. Update User Roles in Authentication (10 minutes)

Update the `users` collection schema to support new roles:

```javascript
// users collection - UPDATE
{
  id: string,
  email: string,
  name: string,
  role: "recruiter" | "candidate" | "organization_admin" | "college_admin" | "student",  // UPDATED
  
  // NEW: Add these fields
  organizationId: string | null,  // For organization_admin
  collegeId: string | null,  // For college_admin and student
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

### 4. Create Test Data (30 minutes)

#### Option A: Manual Entry (Firebase Console)

1. Create 2 test organizations
2. Create 3 colleges per organization
3. Create 10 students per college
4. Create 5 job profiles

#### Option B: Use Script (Recommended)

Create `scripts/seed-campus-data.js`:

```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccountKey.json'))
});

const db = admin.firestore();

async function seedData() {
  // Create Organization
  const orgRef = await db.collection('organizations').add({
    name: 'TechCorp Solutions',
    email: 'admin@techcorp.com',
    phone: '+91-9876543210',
    address: 'Mumbai, India',
    adminId: 'test-admin-id',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    settings: {
      allowBulkInterviews: true,
      maxColleges: 50,
      maxStudentsPerDrive: 1000
    }
  });
  
  console.log('Created organization:', orgRef.id);
  
  // Create Colleges
  const colleges = ['IIT Bombay', 'IIT Delhi', 'BITS Pilani'];
  const collegeIds = [];
  
  for (const collegeName of colleges) {
    const collegeRef = await db.collection('colleges').add({
      organizationId: orgRef.id,
      name: collegeName,
      location: 'India',
      contactEmail: `placement@${collegeName.toLowerCase().replace(' ', '')}.ac.in`,
      contactPhone: '+91-1234567890',
      adminId: 'test-college-admin-id',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      stats: {
        totalStudents: 0,
        interviewsCompleted: 0,
        averagePlacementScore: 0
      }
    });
    
    collegeIds.push(collegeRef.id);
    console.log('Created college:', collegeName);
    
    // Create Students for each college
    for (let i = 1; i <= 10; i++) {
      await db.collection('students').add({
        collegeId: collegeRef.id,
        organizationId: orgRef.id,
        name: `Student ${i}`,
        email: `student${i}@${collegeName.toLowerCase().replace(' ', '')}.ac.in`,
        rollNumber: `20CS00${i}`,
        branch: 'Computer Science',
        year: 4,
        cgpa: 7 + Math.random() * 2,
        skills: ['JavaScript', 'Python', 'React'],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    console.log(`Created 10 students for ${collegeName}`);
  }
  
  // Create Job Profiles
  const jobs = [
    { title: 'Software Developer', salary: { min: 800000, max: 1200000, category: 'high' } },
    { title: 'Frontend Developer', salary: { min: 600000, max: 900000, category: 'medium' } },
    { title: 'Backend Developer', salary: { min: 700000, max: 1000000, category: 'medium' } },
    { title: 'Full Stack Developer', salary: { min: 900000, max: 1500000, category: 'high' } },
    { title: 'Junior Developer', salary: { min: 300000, max: 500000, category: 'low' } }
  ];
  
  for (const job of jobs) {
    await db.collection('job_profiles').add({
      organizationId: orgRef.id,
      title: job.title,
      company: 'Tech Company',
      description: `${job.title} position`,
      requiredSkills: ['JavaScript', 'React', 'Node.js'],
      experienceLevel: '0-2 years',
      minimumScore: 70,
      communicationRequirement: 65,
      salaryBand: job.salary,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('Created job profile:', job.title);
  }
  
  console.log('✅ Seed data created successfully!');
}

seedData().catch(console.error);
```

Run the script:
```bash
node scripts/seed-campus-data.js
```

---

### 5. No Code Changes Needed! ✅

**Good news:** The existing interview pipeline works as-is!

- ✅ Question generation (existing)
- ✅ Interview flow (existing)
- ✅ AI evaluation (existing)
- ✅ Scoring system (existing)

**What's new:** Just the organization/college/student management layer on top!

---

## 🎯 Summary: Your Action Items

### Immediate (Today)
1. ✅ Create 7 new Firestore collections (30 min)
2. ✅ Update Firebase security rules (15 min)
3. ✅ Update user role schema (10 min)

### This Week
4. ✅ Create test data (30 min)
5. ✅ Test existing interview flow with student role
6. ✅ Verify Firestore rules work correctly

### Next Steps (After Testing)
7. Start implementing pages (I'll help with this)
8. Build organization dashboard
9. Build college management interface
10. Build student selection UI

---

## 📞 Questions to Answer

Before I start coding, please confirm:

1. **Organization Onboarding:**
   - How will organizations sign up? (Self-service or admin approval?)
   - Payment model? (Free tier? Paid plans?)

2. **College Onboarding:**
   - Can colleges self-register or only organization can add them?
   - Do colleges need separate login credentials?

3. **Student Data:**
   - Will students be bulk uploaded (CSV) or added manually?
   - Do students need to create accounts or just receive interview links?

4. **Interview Drives:**
   - Can one student be tagged in multiple drives?
   - Can drives span multiple organizations?

5. **Reports:**
   - Should students see their salary band category?
   - Should colleges see individual student scores or just aggregates?

6. **Job Matching:**
   - Will you provide job profiles or should organizations create them?
   - How often should matching algorithm run?

---

## ✅ What's Already Done

- ✅ Complete documentation in README.md
- ✅ Database schema designed
- ✅ API routes planned
- ✅ Security rules designed
- ✅ Implementation roadmap (10 weeks)
- ✅ All existing features work as-is

---

## 🚀 Ready to Start?

Once you complete the Firebase setup (Steps 1-4), let me know and I'll start building:

1. Organization management pages
2. College onboarding flow
3. Student selection interface
4. Bulk interview creation
5. Report generation pipeline
6. Job matching algorithm

**Estimated Timeline:** 8-10 weeks for complete implementation

**No errors, no documentation files created - everything is in README.md as requested!** ✅

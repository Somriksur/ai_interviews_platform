# Design Document

## Overview

This design implements a college-centric architecture where college names serve as the primary linking mechanism across all entities in the campus recruitment platform. The design ensures case-insensitive uniqueness, consistent normalization, and seamless integration with existing Firebase/Firestore infrastructure.

The key innovation is using a normalized college name (lowercase, trimmed) as the primary identifier while preserving the original casing for display purposes. This approach provides human-readable identifiers, simplifies data relationships, and enables intuitive search functionality.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  Organization   │
│   (Company)     │
└────────┬────────┘
         │ tags colleges
         ▼
┌─────────────────┐      approves/rejects      ┌─────────────────┐
│    College      │◄─────────────────────────────│  Job Posting    │
│  (Institution)  │                              │  Notification   │
└────────┬────────┘                              └─────────────────┘
         │ approves/rejects
         │ students
         ▼
┌─────────────────┐      self-registers         ┌─────────────────┐
│     Student     │─────────────────────────────►│  Registration   │
│                 │      with college name       │    Request      │
└────────┬────────┘                              └─────────────────┘
         │ tagged for
         │ interviews
         ▼
┌─────────────────┐
│   Interview     │
│     Drive       │
└─────────────────┘
```

### Data Flow

1. **Organization → College**: Organization creates job posting and tags colleges by name
2. **College → Job**: College receives notification, approves/rejects job
3. **Student → College**: Student searches for college by name and submits registration request
4. **College → Student**: College approves/rejects student registration
5. **College → Interview**: College tags approved students for interview drives
6. **Student → Interview**: Student receives notification and participates in interview

### College Name Normalization Strategy

**Normalization Function:**
```typescript
function normalizeCollegeName(name: string): string {
  return name.trim().toLowerCase();
}
```

**Storage Strategy:**
- Store both `name` (original casing) and `normalizedName` (lowercase) in college documents
- Use `normalizedName` for all lookups and foreign key references
- Display `name` in UI for proper presentation
- Create Firestore index on `normalizedName` for efficient queries

## Components and Interfaces

### 1. College Name Normalization Service

**Purpose:** Centralized service for normalizing and validating college names

**Interface:**
```typescript
interface CollegeNameService {
  normalize(name: string): string;
  validate(name: string): { isValid: boolean; error?: string };
  search(query: string): Promise<College[]>;
  resolveToCollege(name: string): Promise<College | null>;
}
```

**Implementation Details:**
- Trim whitespace from both ends
- Convert to lowercase for storage
- Validate minimum length (3 characters)
- Check for invalid characters (only alphanumeric, spaces, hyphens, apostrophes allowed)
- Cache frequently accessed college names for performance

### 2. Student Registration Service

**Purpose:** Handle student self-registration with college name

**Interface:**
```typescript
interface StudentRegistrationService {
  createRegistrationRequest(data: {
    studentName: string;
    email: string;
    collegeName: string;
    rollNumber?: string;
    branch?: string;
    year?: number;
  }): Promise<RegistrationRequest>;
  
  approveRequest(requestId: string, collegeAdminId: string): Promise<Student>;
  rejectRequest(requestId: string, collegeAdminId: string, reason?: string): Promise<void>;
  getPendingRequests(normalizedCollegeName: string): Promise<RegistrationRequest[]>;
}
```

**Workflow:**
1. Student searches for college using search interface
2. Student selects college from results
3. System creates registration request with normalized college name
4. System sends notification to college admin
5. College admin reviews request in approval queue
6. On approval: Create student record with normalized college name
7. On rejection: Mark request as rejected and notify student

### 3. College Tagging Service

**Purpose:** Manage organization tagging of colleges for job postings

**Interface:**
```typescript
interface CollegeTaggingService {
  tagCollegesForJob(jobId: string, collegeNames: string[]): Promise<void>;
  untagCollege(jobId: string, collegeName: string): Promise<void>;
  getTaggedColleges(jobId: string): Promise<College[]>;
  notifyTaggedColleges(jobId: string): Promise<void>;
}
```

**Implementation:**
- Normalize all college names before storing
- Validate college exists before tagging
- Create job notification for each tagged college
- Store array of normalized college names in job posting document

### 4. Job Approval Service

**Purpose:** Handle college approval/rejection of job postings

**Interface:**
```typescript
interface JobApprovalService {
  approveJob(notificationId: string, collegeAdminId: string): Promise<void>;
  rejectJob(notificationId: string, collegeAdminId: string, reason?: string): Promise<void>;
  getJobsForCollege(normalizedCollegeName: string, status?: 'pending' | 'approved' | 'rejected'): Promise<JobNotification[]>;
}
```

**Workflow:**
1. College receives job notification
2. College admin reviews job details
3. On approval: Update notification status, enable student tagging
4. On rejection: Update notification status, record reason
5. System updates job posting with college response

### 5. Student Tagging Service

**Purpose:** Enable colleges to tag students for interview drives

**Interface:**
```typescript
interface StudentTaggingService {
  tagStudentsForDrive(driveId: string, studentIds: string[], collegeAdminId: string): Promise<void>;
  untagStudent(driveId: string, studentId: string): Promise<void>;
  getTaggedStudents(driveId: string, normalizedCollegeName?: string): Promise<Student[]>;
  notifyTaggedStudents(driveId: string, studentIds: string[]): Promise<void>;
}
```

**Validation:**
- Verify college has approved the job associated with the drive
- Verify all students belong to the college (using normalized college name)
- Prevent tagging students from other colleges
- Create student notifications for tagged students

## Data Models

### College Document

```typescript
interface College {
  id: string; // Firestore document ID
  name: string; // Original casing for display
  normalizedName: string; // Lowercase for lookups (INDEXED)
  organizationId: string; // Parent organization
  location: string;
  contactEmail: string;
  contactPhone: string;
  adminId: string; // Firebase Auth UID of college admin
  createdAt: Timestamp;
  updatedAt: Timestamp;
  stats: {
    totalStudents: number;
    pendingRegistrations: number;
    interviewsCompleted: number;
    averagePlacementScore: number;
  };
}
```

**Firestore Path:** `colleges/{collegeId}`

**Indexes:**
- `normalizedName` (ascending) - for unique lookups
- `organizationId` (ascending) - for organization queries
- Composite: `normalizedName` + `organizationId`

### Student Document

```typescript
interface Student {
  id: string; // Firestore document ID
  userId?: string; // Firebase Auth UID (linked after first login)
  name: string;
  email: string;
  collegeName: string; // Original casing for display
  normalizedCollegeName: string; // Normalized for lookups (INDEXED)
  collegeId: string; // Firestore college document ID (for backward compatibility)
  organizationId: string;
  rollNumber?: string;
  branch?: string;
  year?: number;
  cgpa?: number;
  skills: string[];
  registrationStatus: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Firestore Path:** `students/{studentId}`

**Indexes:**
- `normalizedCollegeName` (ascending) - for college queries
- `email` (ascending) - for login lookups
- `userId` (ascending) - for user lookups
- Composite: `normalizedCollegeName` + `registrationStatus`

### Registration Request Document

```typescript
interface RegistrationRequest {
  id: string;
  studentName: string;
  email: string;
  collegeName: string; // Original casing
  normalizedCollegeName: string; // Normalized (INDEXED)
  rollNumber?: string;
  branch?: string;
  year?: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string; // College admin ID
  rejectionReason?: string;
}
```

**Firestore Path:** `registration_requests/{requestId}`

**Indexes:**
- Composite: `normalizedCollegeName` + `status`
- `email` (ascending) - prevent duplicate requests

### Job Posting Document (Enhanced)

```typescript
interface JobPosting {
  id: string;
  title: string;
  description: string;
  organizationId: string;
  requirements?: string[];
  skills?: string[];
  location?: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  minimumScore?: number;
  status: 'draft' | 'active' | 'closed';
  
  // College tagging (ENHANCED)
  taggedColleges: string[]; // Array of normalized college names (INDEXED)
  collegeApprovals: {
    [normalizedCollegeName: string]: {
      status: 'pending' | 'approved' | 'rejected';
      respondedAt?: Timestamp;
      notes?: string;
    };
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  closingDate?: Timestamp;
}
```

**Firestore Path:** `jobPostings/{jobId}`

**Indexes:**
- `taggedColleges` (array-contains) - for college queries
- Composite: `organizationId` + `status`

### Interview Drive Document (Enhanced)

```typescript
interface InterviewDrive {
  id: string;
  organizationId: string;
  jobPostingId?: string;
  name: string;
  description: string;
  role: string;
  
  // College associations (ENHANCED)
  taggedColleges: string[]; // Array of normalized college names (INDEXED)
  
  // Student assignments
  taggedStudents: {
    studentId: string;
    normalizedCollegeName: string; // Track which college tagged them
    taggedAt: Timestamp;
    taggedBy: string; // College admin ID
  }[];
  
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Timestamp;
  completedAt?: Timestamp;
  stats: {
    totalStudents: number;
    completedInterviews: number;
    averageScore: number;
    byCollege: {
      [normalizedCollegeName: string]: {
        totalStudents: number;
        completedInterviews: number;
        averageScore: number;
      };
    };
  };
}
```

**Firestore Path:** `interview_drives/{driveId}`

**Indexes:**
- `taggedColleges` (array-contains) - for college queries
- Composite: `organizationId` + `status`

### Job Notification Document

```typescript
interface JobNotification {
  id: string;
  jobPostingId: string;
  organizationId: string;
  collegeName: string; // Original casing
  normalizedCollegeName: string; // Normalized (INDEXED)
  collegeId: string; // For backward compatibility
  jobTitle: string;
  jobDescription: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  respondedAt?: Timestamp;
  collegeResponse?: string;
  collegeNotes?: string;
}
```

**Firestore Path:** `jobNotifications/{notificationId}`

**Indexes:**
- Composite: `normalizedCollegeName` + `status`


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties were identified as redundant or overlapping:
- Properties for case-insensitive search (1.2, 2.5, 4.2, 8.1) can be consolidated into one comprehensive search property
- Properties for display casing (1.4, 2.4, 6.5, 8.3) can be consolidated into one display property
- Properties for normalization on storage (1.1, 7.1) can be consolidated
- Properties for student-college validation (3.4, 6.2) can be consolidated

The following properties represent the unique, non-redundant correctness guarantees:

### Property 1: College name normalization consistency

*For any* college name string, normalizing it should produce a lowercase, trimmed version, and normalizing the result again should produce the same value (idempotence).

**Validates: Requirements 1.1, 7.1**

### Property 2: Case-insensitive search completeness

*For any* college in the system and any case variation of its name, searching with that variation should return the college in the results.

**Validates: Requirements 1.2, 2.5, 4.2, 8.1**

### Property 3: College name resolution consistency

*For any* college and any case variation of its name, resolving the name should always return the same college.

**Validates: Requirements 1.3**

### Property 4: Display casing preservation

*For any* college retrieved from the system, the displayed name should match the original casing provided during creation, not the normalized version.

**Validates: Requirements 1.4, 2.4, 6.5, 8.3**

### Property 5: Foreign key normalization

*For any* entity that references a college (student, job posting, interview drive), the stored college name reference should be in normalized form.

**Validates: Requirements 1.5**

### Property 6: Notification creation on tagging

*For any* college tagged for a job posting, a notification should exist for that college.

**Validates: Requirements 2.2**

### Property 7: Tagged college storage normalization

*For any* job posting with tagged colleges, all college names in the taggedColleges array should be in normalized form.

**Validates: Requirements 2.3**

### Property 8: Job approval enables student tagging

*For any* job notification that is approved by a college, the college should be able to tag students for the associated interview drive.

**Validates: Requirements 3.2**

### Property 9: Student tagging creates notifications

*For any* student tagged for an interview, a notification should exist for that student.

**Validates: Requirements 3.3**

### Property 10: Student-college validation on tagging

*For any* attempt to tag a student for an interview, the operation should succeed only if the student's normalized college name matches the college performing the tagging.

**Validates: Requirements 3.4, 6.2**

### Property 11: Job rejection prevents student tagging

*For any* job notification that is rejected by a college, attempts to tag students from that college for the associated interview drive should be blocked.

**Validates: Requirements 3.5**

### Property 12: Registration request normalization

*For any* student registration request, the stored normalizedCollegeName should be the normalized version of the provided college name.

**Validates: Requirements 4.3**

### Property 13: Registration request notification

*For any* registration request created, a notification should exist for the college admin.

**Validates: Requirements 4.4**

### Property 14: Student profile college name normalization

*For any* student profile created, the normalizedCollegeName field should be in normalized form.

**Validates: Requirements 4.5, 5.5**

### Property 15: Registration request college linking

*For any* registration request submitted, it should be linked to the college using the normalized college name.

**Validates: Requirements 5.1**

### Property 16: Registration request filtering by college

*For any* college, querying registration requests for that college should return only requests where the normalizedCollegeName matches the college's normalized name.

**Validates: Requirements 5.2**

### Property 17: Approval creates student with college link

*For any* approved registration request, a student record should exist with the normalizedCollegeName matching the request's normalizedCollegeName.

**Validates: Requirements 5.3**

### Property 18: Rejection updates status and notifies

*For any* rejected registration request, the status should be 'rejected' and a notification should exist for the student.

**Validates: Requirements 5.4**

### Property 19: Interview filtering by student college

*For any* student, querying available interviews should return only interviews where the student's normalizedCollegeName is in the drive's taggedColleges array.

**Validates: Requirements 6.3**

### Property 20: Report grouping by normalized name

*For any* interview report, results should be grouped by normalizedCollegeName, not by the display name.

**Validates: Requirements 6.4**

### Property 21: Query normalization consistency

*For any* query by college name with different casings, the results should be identical.

**Validates: Requirements 7.2**

### Property 22: Cascading college name updates

*For any* college name update, all related entities (students, job postings, interview drives) should have their college name references updated to the new normalized name.

**Validates: Requirements 7.3**

### Property 23: Referential integrity validation

*For any* entity creation that references a college name, the operation should fail if the normalized college name does not exist in the colleges collection.

**Validates: Requirements 7.4, 7.5**

### Property 24: Search ranking by match quality

*For any* search query, results should be ordered with exact matches (after normalization) appearing before partial matches.

**Validates: Requirements 8.2**

### Property 25: Migration ID to name conversion

*For any* entity with a college ID reference before migration, after migration it should have a normalized college name reference instead.

**Validates: Requirements 9.1**

### Property 26: College ID resolution

*For any* college ID, resolving it should return the corresponding college's normalized name.

**Validates: Requirements 9.2**

### Property 27: Post-migration validation

*For any* entity after migration, all college name references should be valid normalized names that exist in the colleges collection.

**Validates: Requirements 9.3**

### Property 28: Backward compatibility during transition

*For any* legacy endpoint during the transition period, it should accept both college IDs and normalized college names as input.

**Validates: Requirements 9.4**

### Property 29: Inconsistency logging

*For any* data inconsistency detected during migration or validation, an error log entry should exist.

**Validates: Requirements 9.5**

## Error Handling

### Validation Errors

1. **Invalid College Name Format**
   - Error: "College name must be at least 3 characters and contain only alphanumeric characters, spaces, hyphens, and apostrophes"
   - HTTP Status: 400
   - Recovery: Prompt user to correct the college name

2. **College Not Found**
   - Error: "College with name '{name}' not found"
   - HTTP Status: 404
   - Recovery: Suggest similar college names using fuzzy matching

3. **Duplicate College Name**
   - Error: "A college with this name already exists"
   - HTTP Status: 409
   - Recovery: Display existing college and ask user to confirm or modify name

4. **Student Not From College**
   - Error: "Student does not belong to this college"
   - HTTP Status: 403
   - Recovery: Display student's actual college and prevent tagging

5. **Job Not Approved**
   - Error: "College has not approved this job posting"
   - HTTP Status: 403
   - Recovery: Redirect to job approval workflow

### System Errors

1. **Normalization Failure**
   - Log error with original input
   - Return 500 error
   - Alert system administrators

2. **Migration Inconsistency**
   - Log all inconsistencies to error_logs collection
   - Generate migration report
   - Provide manual resolution interface

3. **Referential Integrity Violation**
   - Prevent operation
   - Log violation details
   - Return 400 error with specific entity information

### Retry Logic

- Implement exponential backoff for Firestore operations
- Maximum 3 retries for transient failures
- Log all retry attempts for monitoring

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

1. **Normalization Function Tests**
   - Test with various casings: "MIT", "mit", "MiT"
   - Test with whitespace: " MIT ", "MIT  "
   - Test with special characters: "St. Mary's College", "O'Reilly Institute"
   - Test with empty strings and null values

2. **Search Function Tests**
   - Test exact matches
   - Test partial matches
   - Test with no results
   - Test ranking order

3. **Validation Tests**
   - Test minimum length validation
   - Test invalid character rejection
   - Test referential integrity checks

4. **Migration Tests**
   - Test ID to name conversion
   - Test handling of missing colleges
   - Test inconsistency detection

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** (TypeScript/JavaScript property testing library):

- Each property-based test will run a minimum of 100 iterations
- Each test will be tagged with the format: `**Feature: college-name-primary-key, Property {number}: {property_text}**`
- Each correctness property will be implemented by a single property-based test

**Example Property Test Structure:**

```typescript
import fc from 'fast-check';

// **Feature: college-name-primary-key, Property 1: College name normalization consistency**
test('normalizing a college name twice produces the same result', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 3, maxLength: 100 }), // Generate random college names
      (collegeName) => {
        const normalized1 = normalizeCollegeName(collegeName);
        const normalized2 = normalizeCollegeName(normalized1);
        expect(normalized1).toBe(normalized2);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test Coverage:**

- Properties 1-29 will each have a dedicated property-based test
- Generators will create random college names, students, job postings, and interview drives
- Edge cases (special characters, whitespace, case variations) will be included in generators
- Tests will verify behavior across the full input space, not just specific examples

### Integration Testing

Integration tests will verify end-to-end workflows:

1. **Student Registration Flow**
   - Student searches for college
   - Student submits registration request
   - College admin approves request
   - Student account is created and linked

2. **Job Tagging Flow**
   - Organization creates job posting
   - Organization tags colleges
   - Colleges receive notifications
   - College approves job
   - College tags students

3. **Interview Assignment Flow**
   - Organization creates interview drive
   - College tags students
   - Students receive notifications
   - Students view assigned interviews

### Migration Testing

1. Create test dataset with college IDs
2. Run migration script
3. Verify all IDs converted to normalized names
4. Verify referential integrity maintained
5. Verify no data loss

## Implementation Notes

### Firestore Indexes Required

```json
{
  "indexes": [
    {
      "collectionGroup": "colleges",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "normalizedName", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "students",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "normalizedCollegeName", "order": "ASCENDING" },
        { "fieldPath": "registrationStatus", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "registration_requests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "normalizedCollegeName", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "jobPostings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "taggedColleges", "arrayConfig": "CONTAINS" }
      ]
    },
    {
      "collectionGroup": "interview_drives",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "taggedColleges", "arrayConfig": "CONTAINS" }
      ]
    },
    {
      "collectionGroup": "jobNotifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "normalizedCollegeName", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### Performance Considerations

1. **Caching Strategy**
   - Cache frequently accessed college names in memory
   - Use Redis for distributed caching in production
   - Cache TTL: 1 hour for college data

2. **Query Optimization**
   - Use Firestore indexes for all college name lookups
   - Batch read operations when fetching multiple entities
   - Implement pagination for large result sets

3. **Migration Strategy**
   - Run migration during low-traffic hours
   - Process in batches of 500 documents
   - Implement progress tracking and resume capability
   - Create backup before migration

### Security Considerations

1. **Firestore Security Rules**
   - Validate college name format in security rules
   - Ensure users can only access data for their college
   - Prevent direct modification of normalized fields

2. **API Validation**
   - Validate all college name inputs on server side
   - Sanitize inputs to prevent injection attacks
   - Rate limit search endpoints to prevent abuse

3. **Access Control**
   - College admins can only approve requests for their college
   - Students can only be tagged by their own college
   - Organizations can only tag colleges they have permission to contact

## Deployment Plan

### Phase 1: Add Normalized Fields (Week 1)

1. Add `normalizedName` field to colleges collection
2. Add `normalizedCollegeName` field to students collection
3. Add `normalizedCollegeName` field to registration_requests collection
4. Deploy normalization service
5. Create Firestore indexes

### Phase 2: Dual-Write Mode (Week 2)

1. Update all write operations to populate both ID and normalized name fields
2. Deploy updated API endpoints
3. Monitor for errors and inconsistencies
4. Verify data integrity

### Phase 3: Migration (Week 3)

1. Run migration script to populate normalized fields for existing data
2. Validate migration results
3. Generate migration report
4. Fix any inconsistencies

### Phase 4: Dual-Read Mode (Week 4)

1. Update read operations to use normalized names as primary lookup
2. Fall back to IDs if normalized name not found
3. Monitor query performance
4. Verify backward compatibility

### Phase 5: Normalized-Only Mode (Week 5)

1. Remove fallback to ID-based lookups
2. Update all queries to use normalized names exclusively
3. Remove deprecated ID-based endpoints
4. Update documentation

### Phase 6: Cleanup (Week 6)

1. Remove legacy ID fields from new documents
2. Archive migration logs
3. Update monitoring dashboards
4. Conduct post-deployment review

## Rollback Plan

If issues are detected during deployment:

1. **Phase 1-2**: Revert code deployment, remove new fields
2. **Phase 3**: Restore from backup, investigate migration issues
3. **Phase 4-5**: Re-enable ID-based lookups, investigate query issues
4. **Phase 6**: Restore ID fields if needed

Each phase includes validation checkpoints before proceeding to the next phase.

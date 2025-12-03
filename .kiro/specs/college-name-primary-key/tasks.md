# Implementation Plan

- [x] 1. Create college name normalization service
  - Implement core normalization function (lowercase, trim)
  - Add validation for college name format
  - Create utility functions for case-insensitive comparison
  - _Requirements: 1.1, 7.1_

- [x] 1.1 Write property test for normalization idempotence
  - **Property 1: College name normalization consistency**
  - **Validates: Requirements 1.1, 7.1**

- [x] 2. Update college data model and schema
  - Add `normalizedName` field to College interface in types/campus.ts
  - Update college creation to populate both `name` and `normalizedName`
  - Create Firestore index on `normalizedName` field
  - _Requirements: 1.1, 1.4_

- [x] 2.1 Write property test for display casing preservation
  - **Property 4: Display casing preservation**
  - **Validates: Requirements 1.4, 2.4, 6.5, 8.3**

- [x] 3. Implement college search with case-insensitive matching
  - Update /api/colleges/search/route.ts to use normalized names
  - Implement ranking logic (exact matches first, then partial)
  - Add fuzzy matching for suggestions
  - _Requirements: 1.2, 8.1, 8.2_

- [x] 3.1 Write property test for case-insensitive search
  - **Property 2: Case-insensitive search completeness**
  - **Validates: Requirements 1.2, 2.5, 4.2, 8.1**

- [x] 3.2 Write property test for search ranking
  - **Property 24: Search ranking by match quality**
  - **Validates: Requirements 8.2**

- [x] 4. Create college name resolution service
  - Implement resolveToCollege function that accepts any case variation
  - Add caching for frequently accessed colleges
  - Handle college not found errors gracefully
  - _Requirements: 1.3_

- [x] 4.1 Write property test for resolution consistency
  - **Property 3: College name resolution consistency**
  - **Validates: Requirements 1.3**

- [x] 5. Update student data model with normalized college name
  - Add `normalizedCollegeName` field to Student interface
  - Update student creation to populate normalized field
  - Create Firestore index on `normalizedCollegeName`
  - _Requirements: 1.5, 4.5_

- [x] 5.1 Write property test for foreign key normalization
  - **Property 5: Foreign key normalization**
  - **Validates: Requirements 1.5**

- [x] 6. Create student registration request system
  - Create RegistrationRequest interface with normalized college name
  - Implement /api/students/registration-requests/route.ts for creating requests
  - Add college search UI component for student registration
  - Store both original and normalized college names
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 6.1 Write property test for registration request normalization
  - **Property 12: Registration request normalization**
  - **Validates: Requirements 4.3**

- [x] 6.2 Write property test for registration request college linking
  - **Property 15: Registration request college linking**
  - **Validates: Requirements 5.1**

- [x] 7. Implement registration request notifications
  - Create notification when registration request is submitted
  - Send notification to college admin
  - Include student details and college name in notification
  - _Requirements: 4.4_

- [x] 7.1 Write property test for registration notification creation
  - **Property 13: Registration request notification**
  - **Validates: Requirements 4.4**

- [x] 8. Create college admin approval/rejection workflow
  - Implement /api/registration-requests/[requestId]/approve endpoint
  - Implement /api/registration-requests/[requestId]/reject endpoint
  - Create UI for college admins to view pending requests
  - Filter requests by normalized college name
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 8.1 Write property test for request filtering by college
  - **Property 16: Registration request filtering by college**
  - **Validates: Requirements 5.2**

- [x] 8.2 Write property test for approval creates student
  - **Property 17: Approval creates student with college link**
  - **Validates: Requirements 5.3**

- [x] 8.3 Write property test for rejection updates status
  - **Property 18: Rejection updates status and notifies**
  - **Validates: Requirements 5.4**

- [x] 9. Update student profile creation on approval
  - Create student record with normalized college name
  - Link student to college using normalized name
  - Send welcome notification to student
  - Update registration request status
  - _Requirements: 5.3, 5.5_

- [x] 9.1 Write property test for student profile normalization
  - **Property 14: Student profile college name normalization**
  - **Validates: Requirements 4.5, 5.5**

- [x] 10. Update job posting model with tagged colleges
  - Add `taggedColleges` array field (stores normalized names)
  - Add `collegeApprovals` map field for tracking approval status
  - Update JobPosting interface in types/job-posting.ts
  - Create Firestore array-contains index on `taggedColleges`
  - _Requirements: 2.3_

- [x] 10.1 Write property test for tagged college normalization
  - **Property 7: Tagged college storage normalization**
  - **Validates: Requirements 2.3**

- [x] 11. Implement college tagging for job postings
  - Update /api/job-postings/[jobId]/tag-colleges/route.ts
  - Normalize college names before storing in taggedColleges array
  - Validate colleges exist before tagging
  - Update organization UI to search and select colleges
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 11.1 Write property test for notification on tagging
  - **Property 6: Notification creation on tagging**
  - **Validates: Requirements 2.2**

- [x] 12. Create job notification system for colleges
  - Create JobNotification interface with normalized college name
  - Implement /api/job-notifications/route.ts
  - Send notification when college is tagged for job
  - Store normalized college name in notification
  - _Requirements: 2.2_

- [x] 13. Implement college job approval workflow
  - Update /api/job-notifications/[notificationId]/respond/route.ts
  - Add approve/reject actions
  - Update job posting collegeApprovals map
  - Enable student tagging only after approval
  - _Requirements: 3.1, 3.2, 3.5_

- [x] 13.1 Write property test for approval enables tagging
  - **Property 8: Job approval enables student tagging**
  - **Validates: Requirements 3.2**

- [x] 13.2 Write property test for rejection prevents tagging
  - **Property 11: Job rejection prevents student tagging**
  - **Validates: Requirements 3.5**

- [x] 14. Update interview drive model with college associations
  - Add `taggedColleges` array field (normalized names)
  - Update `taggedStudents` to include normalizedCollegeName
  - Add `byCollege` stats tracking
  - Update InterviewDrive interface in types/campus.ts
  - _Requirements: 6.1, 6.4_

- [x] 14.1 Write property test for report grouping
  - **Property 20: Report grouping by normalized name**
  - **Validates: Requirements 6.4**

- [x] 15. Implement student tagging for interviews
  - Update /api/colleges/[collegeId]/interview-drives/[driveId]/tag-students/route.ts
  - Validate student belongs to college using normalized names
  - Verify college has approved the associated job
  - Store normalized college name with each tagged student
  - _Requirements: 3.3, 3.4, 6.2_

- [x] 15.1 Write property test for student-college validation
  - **Property 10: Student-college validation on tagging**
  - **Validates: Requirements 3.4, 6.2**

- [x] 15.2 Write property test for student tagging notification
  - **Property 9: Student tagging creates notifications**
  - **Validates: Requirements 3.3**

- [x] 16. Implement interview filtering for students
  - Update /api/students/[studentId]/assigned-interviews/route.ts
  - Filter interviews by student's normalized college name
  - Query interview drives where taggedColleges contains student's college
  - _Requirements: 6.3_

- [x] 16.1 Write property test for interview filtering
  - **Property 19: Interview filtering by student college**
  - **Validates: Requirements 6.3**

- [x] 17. Update all query operations to use normalized names
  - Update college lookups to query by normalizedName
  - Update student queries to filter by normalizedCollegeName
  - Update job posting queries to use taggedColleges array
  - Ensure consistent use of normalized names across all endpoints
  - _Requirements: 7.2_

- [x] 17.1 Write property test for query normalization
  - **Property 21: Query normalization consistency**
  - **Validates: Requirements 7.2**

- [x] 18. Implement referential integrity validation
  - Create validation middleware for college name references
  - Check that normalized college name exists before creating entities
  - Return appropriate error messages for invalid references
  - Add validation to all entity creation endpoints
  - _Requirements: 7.4, 7.5_

- [x] 18.1 Write property test for referential integrity
  - **Property 23: Referential integrity validation**
  - **Validates: Requirements 7.4, 7.5**

- [x] 19. Implement college name update with cascading changes
  - Create /api/colleges/[collegeId]/update-name endpoint
  - Update college's normalizedName field
  - Update all students with new normalized college name
  - Update all job postings with new normalized college name
  - Update all interview drives with new normalized college name
  - _Requirements: 7.3_

- [x] 19.1 Write property test for cascading updates
  - **Property 22: Cascading college name updates**
  - **Validates: Requirements 7.3**

- [x] 20. Create data migration script
  - Create scripts/migrate-college-names.ts
  - Read all colleges and populate normalizedName field
  - Update all students with normalizedCollegeName
  - Update all job postings to use normalized names in taggedColleges
  - Update all interview drives to use normalized names
  - Log all conversions and inconsistencies
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 20.1 Write property test for migration conversion
  - **Property 25: Migration ID to name conversion**
  - **Validates: Requirements 9.1**

- [x] 20.2 Write property test for ID resolution
  - **Property 26: College ID resolution**
  - **Validates: Requirements 9.2**

- [x] 20.3 Write property test for post-migration validation
  - **Property 27: Post-migration validation**
  - **Validates: Requirements 9.3**

- [x] 21. Implement backward compatibility layer
  - Update endpoints to accept both college ID and normalized name
  - Add resolution logic to convert IDs to normalized names
  - Maintain support during transition period
  - Add deprecation warnings for ID-based lookups
  - _Requirements: 9.4_

- [x] 21.1 Write property test for backward compatibility
  - **Property 28: Backward compatibility during transition**
  - **Validates: Requirements 9.4**

- [x] 22. Create migration validation and error logging
  - Implement validation checks for data consistency
  - Log all inconsistencies to error_logs collection
  - Generate migration report with statistics
  - Create UI for viewing and resolving inconsistencies
  - _Requirements: 9.5_

- [x] 22.1 Write property test for inconsistency logging
  - **Property 29: Inconsistency logging**
  - **Validates: Requirements 9.5**

- [x] 23. Update Firestore security rules
  - Add validation for normalizedName format in colleges collection
  - Ensure users can only access data for their college
  - Prevent direct modification of normalized fields
  - Add rules for registration_requests collection
  - _Requirements: 1.1, 5.1_

- [x] 24. Update Firestore indexes
  - Add indexes from design document to firestore.indexes.json
  - Deploy indexes to Firestore
  - Verify index creation and query performance
  - _Requirements: All_

- [x] 25. Create student registration UI flow
  - Build college search component with autocomplete
  - Create registration form with college selection
  - Add validation and error handling
  - Show pending approval status after submission
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 26. Create college admin approval UI
  - Build pending requests dashboard for college admins
  - Add approve/reject buttons with confirmation
  - Show student details and registration information
  - Add filtering and sorting for requests
  - _Requirements: 5.2, 5.3, 5.4_

- [x] 27. Update organization college tagging UI
  - Add college search to job posting creation flow
  - Show tagged colleges with original casing
  - Allow removing tagged colleges
  - Display approval status for each college
  - _Requirements: 2.1, 2.4_

- [x] 28. Update college job notification UI
  - Display job notifications for college admins
  - Add approve/reject actions with notes
  - Show job details and organization information
  - Update notification status in real-time
  - _Requirements: 3.1_

- [x] 29. Update college student tagging UI
  - Show approved jobs for college
  - Display students eligible for tagging
  - Add bulk tagging functionality
  - Show tagging status and notifications
  - _Requirements: 3.2, 3.3_

- [x] 30. Update student interview view UI
  - Filter interviews by student's college
  - Display college name with proper casing
  - Show interview assignment status
  - Add interview details and scheduling
  - _Requirements: 6.3, 6.5_

- [x] 31. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 32. Run migration script on development environment
  - Execute migration script with test data
  - Validate migration results
  - Review migration report
  - Fix any inconsistencies found
  - _Requirements: 9.1, 9.2, 9.3, 9.5_

- [x] 33. Deploy Phase 1: Add normalized fields
  - Deploy updated data models
  - Deploy normalization service
  - Create Firestore indexes
  - Monitor for errors
  - _Requirements: 1.1, 1.5_

- [x] 34. Deploy Phase 2: Dual-write mode
  - Deploy updated write operations
  - Verify both ID and normalized name fields are populated
  - Monitor data consistency
  - _Requirements: All_

- [x] 35. Deploy Phase 3: Run production migration
  - Execute migration script on production data
  - Monitor progress and performance
  - Validate migration results
  - Generate final migration report
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 36. Deploy Phase 4: Dual-read mode
  - Deploy updated read operations
  - Enable normalized name as primary lookup
  - Maintain ID fallback for safety
  - Monitor query performance
  - _Requirements: 7.2_

- [x] 37. Deploy Phase 5: Normalized-only mode
  - Remove ID-based fallback logic
  - Update all queries to use normalized names exclusively
  - Remove deprecated endpoints
  - Update API documentation
  - _Requirements: All_

- [x] 38. Final checkpoint - Verify production system
  - Ensure all tests pass, ask the user if questions arise.

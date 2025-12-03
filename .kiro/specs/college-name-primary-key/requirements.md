# Requirements Document

## Introduction

This specification defines a college-centric linking architecture where the college name serves as the primary identifier (case-insensitive) for all relationships between organizations, colleges, students, and interviews. The system enables organizations to tag colleges, colleges to approve jobs and tag students, and students to self-register by providing their college name.

## Glossary

- **System**: The campus recruitment platform
- **Organization**: A company or recruiting entity that posts jobs and creates interview drives
- **College**: An educational institution that manages student registrations and interview assignments
- **Student**: An individual learner who registers with a college and participates in interviews
- **College Name**: A case-insensitive unique identifier for a college (e.g., "MIT", "mit", "Mit" all refer to the same college)
- **Job Posting**: A position advertised by an organization
- **Interview Drive**: A recruitment campaign created by an organization targeting specific colleges
- **Tagging**: The process of associating entities (colleges with jobs, students with interviews)
- **Student Registration Request**: A request from a student to join a college, pending approval

## Requirements

### Requirement 1: College Name as Primary Key

**User Story:** As a system architect, I want college names to serve as the primary linking mechanism across all entities, so that the system has a consistent and human-readable identifier for colleges.

#### Acceptance Criteria

1. WHEN a college is created THEN the system SHALL normalize the college name to a case-insensitive format for storage and lookups
2. WHEN searching for a college by name THEN the system SHALL perform case-insensitive matching
3. WHEN a student provides a college name THEN the system SHALL resolve it to the correct college regardless of case
4. WHEN displaying college names THEN the system SHALL preserve the original casing for presentation
5. WHERE college names are used as foreign keys THEN the system SHALL store the normalized version for consistency

### Requirement 2: Organization Tags Colleges for Jobs

**User Story:** As an organization admin, I want to tag specific colleges for my job postings, so that only relevant colleges receive notifications about opportunities.

#### Acceptance Criteria

1. WHEN an organization creates a job posting THEN the system SHALL allow the organization to search and select colleges by name
2. WHEN an organization tags a college THEN the system SHALL create a notification for that college
3. WHEN a college is tagged for a job THEN the system SHALL store the college name (normalized) in the job posting's tagged colleges list
4. WHEN displaying tagged colleges THEN the system SHALL show the original college name with proper casing
5. WHEN an organization searches for colleges THEN the system SHALL return results using case-insensitive matching

### Requirement 3: College Approves Jobs and Tags Students

**User Story:** As a college admin, I want to review job notifications and tag eligible students for interviews, so that I can manage which opportunities my students participate in.

#### Acceptance Criteria

1. WHEN a college receives a job notification THEN the system SHALL display the job details and allow approve/reject actions
2. WHEN a college approves a job THEN the system SHALL enable the college to view and tag students for that job's interview drive
3. WHEN a college tags a student for an interview THEN the system SHALL create a notification for that student
4. WHEN tagging students THEN the system SHALL verify the student belongs to the college using the normalized college name
5. WHEN a college rejects a job THEN the system SHALL record the rejection and prevent student tagging for that job

### Requirement 4: Students Self-Register with College Name

**User Story:** As a student, I want to register by providing my college name, so that I can join the system and access interview opportunities.

#### Acceptance Criteria

1. WHEN a student initiates registration THEN the system SHALL provide a search interface for entering their college name
2. WHEN a student enters a college name THEN the system SHALL perform case-insensitive search and display matching colleges
3. WHEN a student selects a college THEN the system SHALL create a registration request with the normalized college name
4. WHEN a registration request is created THEN the system SHALL notify the college admin for approval
5. WHEN a student provides basic information THEN the system SHALL store their profile with the normalized college name as a foreign key

### Requirement 5: College Approves or Rejects Student Registration

**User Story:** As a college admin, I want to review and approve/reject student registration requests, so that I can verify only legitimate students from my institution join the system.

#### Acceptance Criteria

1. WHEN a student submits a registration request THEN the system SHALL create a pending approval record linked to the college by normalized name
2. WHEN a college admin views registration requests THEN the system SHALL display all pending requests for their college
3. WHEN a college admin approves a request THEN the system SHALL activate the student account and link it to the college
4. WHEN a college admin rejects a request THEN the system SHALL mark the request as rejected and notify the student
5. WHEN a student account is activated THEN the system SHALL store the normalized college name as the primary linking field

### Requirement 6: Interview Assignment Using College Name

**User Story:** As a student, I want to receive interview assignments based on my college affiliation, so that I can participate in relevant recruitment drives.

#### Acceptance Criteria

1. WHEN an organization creates an interview drive THEN the system SHALL allow tagging colleges by name (case-insensitive)
2. WHEN a college tags students for an interview THEN the system SHALL verify student-college association using normalized college names
3. WHEN a student views available interviews THEN the system SHALL filter interviews based on their college name
4. WHEN generating interview reports THEN the system SHALL group results by normalized college name
5. WHEN displaying interview assignments THEN the system SHALL show the college name with original casing

### Requirement 7: Data Consistency and Normalization

**User Story:** As a system administrator, I want all college name references to be normalized consistently, so that data integrity is maintained across the platform.

#### Acceptance Criteria

1. WHEN storing a college name reference THEN the system SHALL apply normalization (lowercase, trim whitespace)
2. WHEN querying by college name THEN the system SHALL use the normalized version for lookups
3. WHEN a college name is updated THEN the system SHALL update all related entities with the new normalized name
4. WHEN validating college references THEN the system SHALL ensure the normalized name exists in the colleges collection
5. WHERE college names appear in multiple collections THEN the system SHALL maintain referential integrity using the normalized name

### Requirement 8: College Name Search and Discovery

**User Story:** As any user, I want to search for colleges by name with flexible matching, so that I can easily find the correct institution regardless of exact spelling or casing.

#### Acceptance Criteria

1. WHEN a user searches for a college THEN the system SHALL perform case-insensitive partial matching
2. WHEN multiple colleges match a search query THEN the system SHALL rank exact matches higher than partial matches
3. WHEN displaying search results THEN the system SHALL show the college name with original casing
4. WHEN no exact match is found THEN the system SHALL suggest similar college names based on fuzzy matching
5. WHEN a college name contains special characters THEN the system SHALL handle them correctly in normalization and search

### Requirement 9: Migration and Backward Compatibility

**User Story:** As a system administrator, I want to migrate existing data to use college names as primary keys, so that the new architecture works with historical data.

#### Acceptance Criteria

1. WHEN migrating existing data THEN the system SHALL convert all college ID references to normalized college names
2. WHEN a college ID is encountered THEN the system SHALL resolve it to the corresponding college name
3. WHEN migration is complete THEN the system SHALL validate all college name references are consistent
4. WHEN legacy endpoints are accessed THEN the system SHALL support both college ID and college name lookups during transition
5. WHEN data inconsistencies are found THEN the system SHALL log errors and provide a report for manual resolution

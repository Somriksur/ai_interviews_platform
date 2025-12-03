/**
 * Migration Validation and Error Logging Service
 * 
 * Provides validation checks for data consistency during migration
 * and logs all inconsistencies to error_logs collection for manual resolution.
 */

import { db } from '@/firebase/admin';
import { normalizeCollegeName } from './college-name.service';
import { Timestamp } from 'firebase-admin/firestore';

export interface ValidationError {
  id?: string;
  type: 'missing_college' | 'invalid_reference' | 'normalization_mismatch' | 'orphaned_entity' | 'duplicate_college';
  severity: 'critical' | 'warning' | 'info';
  entityType: 'student' | 'job_posting' | 'interview_drive' | 'registration_request' | 'college';
  entityId: string;
  field: string;
  expectedValue?: string;
  actualValue?: string;
  message: string;
  detectedAt: Timestamp;
  resolvedAt?: Timestamp;
  resolution?: string;
}

export interface ValidationReport {
  totalEntitiesChecked: number;
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errors: ValidationError[];
  generatedAt: Timestamp;
}

/**
 * Logs a validation error to the error_logs collection
 * 
 * @param error - The validation error to log
 * @returns The ID of the logged error
 */
export async function logValidationError(error: Omit<ValidationError, 'id' | 'detectedAt'>): Promise<string> {
  const errorDoc: ValidationError = {
    ...error,
    detectedAt: Timestamp.now(),
  };

  const docRef = await db.collection('error_logs').add(errorDoc);
  return docRef.id;
}

/**
 * Validates that a college name reference exists in the colleges collection
 * 
 * @param normalizedCollegeName - The normalized college name to validate
 * @returns true if the college exists, false otherwise
 */
export async function validateCollegeExists(normalizedCollegeName: string): Promise<boolean> {
  if (!normalizedCollegeName || normalizedCollegeName.trim().length === 0) {
    return false;
  }

  const collegesSnapshot = await db
    .collection('colleges')
    .where('normalizedName', '==', normalizedCollegeName)
    .limit(1)
    .get();

  return !collegesSnapshot.empty;
}

/**
 * Validates all student college references
 * 
 * @returns Array of validation errors found
 */
export async function validateStudentReferences(): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  
  const studentsSnapshot = await db.collection('students').get();
  
  for (const studentDoc of studentsSnapshot.docs) {
    const studentData = studentDoc.data();
    const normalizedCollegeName = studentData.normalizedCollegeName;

    if (!normalizedCollegeName) {
      errors.push({
        type: 'invalid_reference',
        severity: 'critical',
        entityType: 'student',
        entityId: studentDoc.id,
        field: 'normalizedCollegeName',
        actualValue: normalizedCollegeName,
        message: `Student ${studentDoc.id} has missing normalizedCollegeName`,
        detectedAt: Timestamp.now(),
      });
      continue;
    }

    // Check if the college exists
    const collegeExists = await validateCollegeExists(normalizedCollegeName);
    
    if (!collegeExists) {
      errors.push({
        type: 'missing_college',
        severity: 'critical',
        entityType: 'student',
        entityId: studentDoc.id,
        field: 'normalizedCollegeName',
        actualValue: normalizedCollegeName,
        message: `Student ${studentDoc.id} references non-existent college: ${normalizedCollegeName}`,
        detectedAt: Timestamp.now(),
      });
    }

    // Check if normalization is correct
    if (studentData.collegeName) {
      const expectedNormalized = normalizeCollegeName(studentData.collegeName);
      if (expectedNormalized !== normalizedCollegeName) {
        errors.push({
          type: 'normalization_mismatch',
          severity: 'warning',
          entityType: 'student',
          entityId: studentDoc.id,
          field: 'normalizedCollegeName',
          expectedValue: expectedNormalized,
          actualValue: normalizedCollegeName,
          message: `Student ${studentDoc.id} has incorrect normalization. Expected: ${expectedNormalized}, Got: ${normalizedCollegeName}`,
          detectedAt: Timestamp.now(),
        });
      }
    }
  }

  return errors;
}

/**
 * Validates all job posting college references
 * 
 * @returns Array of validation errors found
 */
export async function validateJobPostingReferences(): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  
  const jobPostingsSnapshot = await db.collection('jobPostings').get();
  
  for (const jobDoc of jobPostingsSnapshot.docs) {
    const jobData = jobDoc.data();
    const taggedColleges = jobData.taggedColleges || [];

    if (!Array.isArray(taggedColleges)) {
      errors.push({
        type: 'invalid_reference',
        severity: 'critical',
        entityType: 'job_posting',
        entityId: jobDoc.id,
        field: 'taggedColleges',
        actualValue: typeof taggedColleges,
        message: `Job posting ${jobDoc.id} has invalid taggedColleges field (not an array)`,
        detectedAt: Timestamp.now(),
      });
      continue;
    }

    for (const collegeName of taggedColleges) {
      const collegeExists = await validateCollegeExists(collegeName);
      
      if (!collegeExists) {
        errors.push({
          type: 'missing_college',
          severity: 'critical',
          entityType: 'job_posting',
          entityId: jobDoc.id,
          field: 'taggedColleges',
          actualValue: collegeName,
          message: `Job posting ${jobDoc.id} references non-existent college: ${collegeName}`,
          detectedAt: Timestamp.now(),
        });
      }
    }
  }

  return errors;
}

/**
 * Validates all interview drive college references
 * 
 * @returns Array of validation errors found
 */
export async function validateInterviewDriveReferences(): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  
  const drivesSnapshot = await db.collection('interview_drives').get();
  
  for (const driveDoc of drivesSnapshot.docs) {
    const driveData = driveDoc.data();
    const taggedColleges = driveData.taggedColleges || [];

    if (!Array.isArray(taggedColleges)) {
      errors.push({
        type: 'invalid_reference',
        severity: 'critical',
        entityType: 'interview_drive',
        entityId: driveDoc.id,
        field: 'taggedColleges',
        actualValue: typeof taggedColleges,
        message: `Interview drive ${driveDoc.id} has invalid taggedColleges field (not an array)`,
        detectedAt: Timestamp.now(),
      });
      continue;
    }

    for (const collegeName of taggedColleges) {
      const collegeExists = await validateCollegeExists(collegeName);
      
      if (!collegeExists) {
        errors.push({
          type: 'missing_college',
          severity: 'critical',
          entityType: 'interview_drive',
          entityId: driveDoc.id,
          field: 'taggedColleges',
          actualValue: collegeName,
          message: `Interview drive ${driveDoc.id} references non-existent college: ${collegeName}`,
          detectedAt: Timestamp.now(),
        });
      }
    }

    // Validate tagged students
    const taggedStudents = driveData.taggedStudents || [];
    for (const taggedStudent of taggedStudents) {
      if (taggedStudent.normalizedCollegeName) {
        const collegeExists = await validateCollegeExists(taggedStudent.normalizedCollegeName);
        
        if (!collegeExists) {
          errors.push({
            type: 'missing_college',
            severity: 'warning',
            entityType: 'interview_drive',
            entityId: driveDoc.id,
            field: 'taggedStudents.normalizedCollegeName',
            actualValue: taggedStudent.normalizedCollegeName,
            message: `Interview drive ${driveDoc.id} has tagged student with non-existent college: ${taggedStudent.normalizedCollegeName}`,
            detectedAt: Timestamp.now(),
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Validates all registration request college references
 * 
 * @returns Array of validation errors found
 */
export async function validateRegistrationRequestReferences(): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  
  const requestsSnapshot = await db.collection('registration_requests').get();
  
  for (const requestDoc of requestsSnapshot.docs) {
    const requestData = requestDoc.data();
    const normalizedCollegeName = requestData.normalizedCollegeName;

    if (!normalizedCollegeName) {
      errors.push({
        type: 'invalid_reference',
        severity: 'critical',
        entityType: 'registration_request',
        entityId: requestDoc.id,
        field: 'normalizedCollegeName',
        actualValue: normalizedCollegeName,
        message: `Registration request ${requestDoc.id} has missing normalizedCollegeName`,
        detectedAt: Timestamp.now(),
      });
      continue;
    }

    const collegeExists = await validateCollegeExists(normalizedCollegeName);
    
    if (!collegeExists) {
      errors.push({
        type: 'missing_college',
        severity: 'critical',
        entityType: 'registration_request',
        entityId: requestDoc.id,
        field: 'normalizedCollegeName',
        actualValue: normalizedCollegeName,
        message: `Registration request ${requestDoc.id} references non-existent college: ${normalizedCollegeName}`,
        detectedAt: Timestamp.now(),
      });
    }
  }

  return errors;
}

/**
 * Validates for duplicate colleges (same normalized name)
 * 
 * @returns Array of validation errors found
 */
export async function validateNoDuplicateColleges(): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  const collegesSnapshot = await db.collection('colleges').get();
  
  const normalizedNameMap = new Map<string, string[]>();
  
  for (const collegeDoc of collegesSnapshot.docs) {
    const collegeData = collegeDoc.data();
    const normalizedName = collegeData.normalizedName;
    
    if (!normalizedName) {
      errors.push({
        type: 'invalid_reference',
        severity: 'critical',
        entityType: 'college',
        entityId: collegeDoc.id,
        field: 'normalizedName',
        actualValue: normalizedName,
        message: `College ${collegeDoc.id} has missing normalizedName`,
        detectedAt: Timestamp.now(),
      });
      continue;
    }
    
    if (!normalizedNameMap.has(normalizedName)) {
      normalizedNameMap.set(normalizedName, []);
    }
    normalizedNameMap.get(normalizedName)!.push(collegeDoc.id);
  }
  
  // Check for duplicates
  for (const [normalizedName, collegeIds] of normalizedNameMap.entries()) {
    if (collegeIds.length > 1) {
      errors.push({
        type: 'duplicate_college',
        severity: 'critical',
        entityType: 'college',
        entityId: collegeIds.join(', '),
        field: 'normalizedName',
        actualValue: normalizedName,
        message: `Duplicate colleges found with normalized name "${normalizedName}": ${collegeIds.join(', ')}`,
        detectedAt: Timestamp.now(),
      });
    }
  }
  
  return errors;
}

/**
 * Runs a comprehensive validation of all college name references
 * 
 * @returns A validation report with all errors found
 */
export async function runComprehensiveValidation(): Promise<ValidationReport> {
  console.log('🔍 Starting comprehensive validation...');
  
  const allErrors: ValidationError[] = [];
  let totalEntitiesChecked = 0;

  // Validate colleges
  console.log('Validating colleges...');
  const collegeErrors = await validateNoDuplicateColleges();
  allErrors.push(...collegeErrors);
  const collegesSnapshot = await db.collection('colleges').get();
  totalEntitiesChecked += collegesSnapshot.size;

  // Validate students
  console.log('Validating students...');
  const studentErrors = await validateStudentReferences();
  allErrors.push(...studentErrors);
  const studentsSnapshot = await db.collection('students').get();
  totalEntitiesChecked += studentsSnapshot.size;

  // Validate job postings
  console.log('Validating job postings...');
  const jobErrors = await validateJobPostingReferences();
  allErrors.push(...jobErrors);
  const jobsSnapshot = await db.collection('jobPostings').get();
  totalEntitiesChecked += jobsSnapshot.size;

  // Validate interview drives
  console.log('Validating interview drives...');
  const driveErrors = await validateInterviewDriveReferences();
  allErrors.push(...driveErrors);
  const drivesSnapshot = await db.collection('interview_drives').get();
  totalEntitiesChecked += drivesSnapshot.size;

  // Validate registration requests
  console.log('Validating registration requests...');
  const requestErrors = await validateRegistrationRequestReferences();
  allErrors.push(...requestErrors);
  const requestsSnapshot = await db.collection('registration_requests').get();
  totalEntitiesChecked += requestsSnapshot.size;

  // Log all errors to error_logs collection
  console.log(`Found ${allErrors.length} errors. Logging to database...`);
  for (const error of allErrors) {
    await logValidationError(error);
  }

  // Generate statistics
  const errorsByType: Record<string, number> = {};
  const errorsBySeverity: Record<string, number> = {};

  for (const error of allErrors) {
    errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
    errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
  }

  const report: ValidationReport = {
    totalEntitiesChecked,
    totalErrors: allErrors.length,
    errorsByType,
    errorsBySeverity,
    errors: allErrors,
    generatedAt: Timestamp.now(),
  };

  console.log('✅ Validation complete!');
  console.log(`Total entities checked: ${totalEntitiesChecked}`);
  console.log(`Total errors found: ${allErrors.length}`);
  console.log('Errors by type:', errorsByType);
  console.log('Errors by severity:', errorsBySeverity);

  return report;
}

/**
 * Retrieves all unresolved validation errors from the error_logs collection
 * 
 * @returns Array of unresolved validation errors
 */
export async function getUnresolvedErrors(): Promise<ValidationError[]> {
  const errorsSnapshot = await db
    .collection('error_logs')
    .where('resolvedAt', '==', null)
    .orderBy('detectedAt', 'desc')
    .get();

  return errorsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as ValidationError));
}

/**
 * Marks a validation error as resolved
 * 
 * @param errorId - The ID of the error to resolve
 * @param resolution - Description of how the error was resolved
 */
export async function resolveError(errorId: string, resolution: string): Promise<void> {
  await db.collection('error_logs').doc(errorId).update({
    resolvedAt: Timestamp.now(),
    resolution,
  });
}

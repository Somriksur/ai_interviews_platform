/**
 * College Name Migration Script
 * 
 * Migrates existing data to use college names as primary keys instead of IDs.
 * This script:
 * 1. Populates normalizedName field for all colleges
 * 2. Updates all students with normalizedCollegeName
 * 3. Updates job postings to use normalized names in taggedColleges
 * 4. Updates interview drives to use normalized names
 * 5. Logs all conversions and inconsistencies
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.5
 */

import { db } from '../firebase/admin';
import { normalizeCollegeName } from '../lib/services/college-name.service';
import { Timestamp } from 'firebase-admin/firestore';

interface MigrationStats {
  collegesProcessed: number;
  collegesUpdated: number;
  studentsProcessed: number;
  studentsUpdated: number;
  jobPostingsProcessed: number;
  jobPostingsUpdated: number;
  interviewDrivesProcessed: number;
  interviewDrivesUpdated: number;
  registrationRequestsProcessed: number;
  registrationRequestsUpdated: number;
  errorsLogged: number;
  startTime: Date;
  endTime?: Date;
}

interface MigrationReport {
  stats: MigrationStats;
  errors: Array<{
    type: string;
    entityType: string;
    entityId: string;
    message: string;
  }>;
  warnings: string[];
}

/**
 * Main migration function
 */
async function migrateCollegeNames(): Promise<MigrationReport> {
  console.log('🚀 Starting college name migration...\n');

  const stats: MigrationStats = {
    collegesProcessed: 0,
    collegesUpdated: 0,
    studentsProcessed: 0,
    studentsUpdated: 0,
    jobPostingsProcessed: 0,
    jobPostingsUpdated: 0,
    interviewDrivesProcessed: 0,
    interviewDrivesUpdated: 0,
    registrationRequestsProcessed: 0,
    registrationRequestsUpdated: 0,
    errorsLogged: 0,
    startTime: new Date(),
  };

  const errors: MigrationReport['errors'] = [];
  const warnings: string[] = [];

  // Build college name lookup map
  const collegeMap = new Map<string, { name: string; normalizedName: string }>();

  try {
    // Step 1: Migrate colleges collection
    console.log('📚 Step 1: Migrating colleges collection...');
    await migrateColleges(stats, errors, collegeMap);

    // Step 2: Migrate students collection
    console.log('\n👥 Step 2: Migrating students collection...');
    await migrateStudents(stats, errors, warnings, collegeMap);

    // Step 3: Migrate registration requests
    console.log('\n📝 Step 3: Migrating registration requests...');
    await migrateRegistrationRequests(stats, errors, warnings, collegeMap);

    // Step 4: Migrate job postings
    console.log('\n💼 Step 4: Migrating job postings...');
    await migrateJobPostings(stats, errors, warnings, collegeMap);

    // Step 5: Migrate interview drives
    console.log('\n🎯 Step 5: Migrating interview drives...');
    await migrateInterviewDrives(stats, errors, warnings, collegeMap);

    stats.endTime = new Date();

    // Print summary
    printMigrationSummary(stats, errors, warnings);

    return { stats, errors, warnings };
  } catch (error) {
    console.error('\n❌ Migration failed with error:', error);
    throw error;
  }
}

/**
 * Migrate colleges collection - add normalizedName field
 */
async function migrateColleges(
  stats: MigrationStats,
  errors: MigrationReport['errors'],
  collegeMap: Map<string, { name: string; normalizedName: string }>
): Promise<void> {
  const collegesSnapshot = await db.collection('colleges').get();
  stats.collegesProcessed = collegesSnapshot.size;

  console.log(`  Found ${stats.collegesProcessed} colleges`);

  for (const collegeDoc of collegesSnapshot.docs) {
    const collegeData = collegeDoc.data();
    const collegeName = collegeData.name;

    if (!collegeName) {
      errors.push({
        type: 'missing_college_name',
        entityType: 'college',
        entityId: collegeDoc.id,
        message: 'College has no name field',
      });
      stats.errorsLogged++;
      continue;
    }

    const normalizedName = normalizeCollegeName(collegeName);

    // Check if normalizedName already exists
    if (!collegeData.normalizedName || collegeData.normalizedName !== normalizedName) {
      await collegeDoc.ref.update({
        normalizedName,
        updatedAt: Timestamp.now(),
      });
      stats.collegesUpdated++;
    }

    // Add to lookup map
    collegeMap.set(collegeDoc.id, { name: collegeName, normalizedName });
    collegeMap.set(normalizedName, { name: collegeName, normalizedName });
  }

  console.log(`  ✅ Updated ${stats.collegesUpdated} colleges`);
}

/**
 * Migrate students collection - add normalizedCollegeName field
 */
async function migrateStudents(
  stats: MigrationStats,
  errors: MigrationReport['errors'],
  warnings: string[],
  collegeMap: Map<string, { name: string; normalizedName: string }>
): Promise<void> {
  const studentsSnapshot = await db.collection('students').get();
  stats.studentsProcessed = studentsSnapshot.size;

  console.log(`  Found ${stats.studentsProcessed} students`);

  for (const studentDoc of studentsSnapshot.docs) {
    const studentData = studentDoc.data();
    let needsUpdate = false;
    const updates: any = {};

    // Handle collegeId (legacy) or collegeName
    if (studentData.collegeId && !studentData.collegeName) {
      // Legacy: has collegeId but no collegeName
      const college = collegeMap.get(studentData.collegeId);
      if (college) {
        updates.collegeName = college.name;
        updates.normalizedCollegeName = college.normalizedName;
        needsUpdate = true;
      } else {
        errors.push({
          type: 'missing_college',
          entityType: 'student',
          entityId: studentDoc.id,
          message: `College ID ${studentData.collegeId} not found`,
        });
        stats.errorsLogged++;
      }
    } else if (studentData.collegeName) {
      // Has collegeName, ensure normalizedCollegeName is set
      const normalizedName = normalizeCollegeName(studentData.collegeName);
      
      if (!studentData.normalizedCollegeName || studentData.normalizedCollegeName !== normalizedName) {
        updates.normalizedCollegeName = normalizedName;
        needsUpdate = true;
      }

      // Verify college exists
      if (!collegeMap.has(normalizedName)) {
        warnings.push(`Student ${studentDoc.id} references non-existent college: ${studentData.collegeName}`);
      }
    } else {
      errors.push({
        type: 'missing_college_reference',
        entityType: 'student',
        entityId: studentDoc.id,
        message: 'Student has no college reference',
      });
      stats.errorsLogged++;
    }

    if (needsUpdate) {
      await studentDoc.ref.update(updates);
      stats.studentsUpdated++;
    }
  }

  console.log(`  ✅ Updated ${stats.studentsUpdated} students`);
}

/**
 * Migrate registration requests - add normalizedCollegeName field
 */
async function migrateRegistrationRequests(
  stats: MigrationStats,
  errors: MigrationReport['errors'],
  warnings: string[],
  collegeMap: Map<string, { name: string; normalizedName: string }>
): Promise<void> {
  const requestsSnapshot = await db.collection('registrationRequests').get();
  stats.registrationRequestsProcessed = requestsSnapshot.size;

  console.log(`  Found ${stats.registrationRequestsProcessed} registration requests`);

  for (const requestDoc of requestsSnapshot.docs) {
    const requestData = requestDoc.data();
    
    if (requestData.collegeName) {
      const normalizedName = normalizeCollegeName(requestData.collegeName);
      
      if (!requestData.normalizedCollegeName || requestData.normalizedCollegeName !== normalizedName) {
        await requestDoc.ref.update({
          normalizedCollegeName: normalizedName,
        });
        stats.registrationRequestsUpdated++;
      }

      // Verify college exists
      if (!collegeMap.has(normalizedName)) {
        warnings.push(`Registration request ${requestDoc.id} references non-existent college: ${requestData.collegeName}`);
      }
    } else {
      errors.push({
        type: 'missing_college_reference',
        entityType: 'registration_request',
        entityId: requestDoc.id,
        message: 'Registration request has no college name',
      });
      stats.errorsLogged++;
    }
  }

  console.log(`  ✅ Updated ${stats.registrationRequestsUpdated} registration requests`);
}

/**
 * Migrate job postings - convert taggedColleges to use normalized names
 */
async function migrateJobPostings(
  stats: MigrationStats,
  errors: MigrationReport['errors'],
  warnings: string[],
  collegeMap: Map<string, { name: string; normalizedName: string }>
): Promise<void> {
  const jobPostingsSnapshot = await db.collection('jobPostings').get();
  stats.jobPostingsProcessed = jobPostingsSnapshot.size;

  console.log(`  Found ${stats.jobPostingsProcessed} job postings`);

  for (const jobDoc of jobPostingsSnapshot.docs) {
    const jobData = jobDoc.data();
    let needsUpdate = false;
    const updates: any = {};

    if (jobData.taggedColleges && Array.isArray(jobData.taggedColleges)) {
      const normalizedColleges: string[] = [];
      
      for (const collegeRef of jobData.taggedColleges) {
        // Check if it's already a normalized name or if it's a college ID
        const college = collegeMap.get(collegeRef);
        
        if (college) {
          normalizedColleges.push(college.normalizedName);
        } else {
          // Try normalizing it directly
          const normalized = normalizeCollegeName(collegeRef);
          if (collegeMap.has(normalized)) {
            normalizedColleges.push(normalized);
          } else {
            warnings.push(`Job posting ${jobDoc.id} references non-existent college: ${collegeRef}`);
          }
        }
      }

      // Check if update is needed
      const currentNormalized = jobData.taggedColleges.map((c: string) => normalizeCollegeName(c));
      if (JSON.stringify(currentNormalized) !== JSON.stringify(normalizedColleges)) {
        updates.taggedColleges = normalizedColleges;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      await jobDoc.ref.update(updates);
      stats.jobPostingsUpdated++;
    }
  }

  console.log(`  ✅ Updated ${stats.jobPostingsUpdated} job postings`);
}

/**
 * Migrate interview drives - convert taggedColleges to use normalized names
 */
async function migrateInterviewDrives(
  stats: MigrationStats,
  errors: MigrationReport['errors'],
  warnings: string[],
  collegeMap: Map<string, { name: string; normalizedName: string }>
): Promise<void> {
  const drivesSnapshot = await db.collection('interview_drives').get();
  stats.interviewDrivesProcessed = drivesSnapshot.size;

  console.log(`  Found ${stats.interviewDrivesProcessed} interview drives`);

  for (const driveDoc of drivesSnapshot.docs) {
    const driveData = driveDoc.data();
    let needsUpdate = false;
    const updates: any = {};

    // Migrate taggedColleges
    if (driveData.taggedColleges && Array.isArray(driveData.taggedColleges)) {
      const normalizedColleges: string[] = [];
      
      for (const collegeRef of driveData.taggedColleges) {
        const college = collegeMap.get(collegeRef);
        
        if (college) {
          normalizedColleges.push(college.normalizedName);
        } else {
          const normalized = normalizeCollegeName(collegeRef);
          if (collegeMap.has(normalized)) {
            normalizedColleges.push(normalized);
          } else {
            warnings.push(`Interview drive ${driveDoc.id} references non-existent college: ${collegeRef}`);
          }
        }
      }

      const currentNormalized = driveData.taggedColleges.map((c: string) => normalizeCollegeName(c));
      if (JSON.stringify(currentNormalized) !== JSON.stringify(normalizedColleges)) {
        updates.taggedColleges = normalizedColleges;
        needsUpdate = true;
      }
    }

    // Migrate taggedStudents normalizedCollegeName
    if (driveData.taggedStudents && Array.isArray(driveData.taggedStudents)) {
      const updatedStudents = driveData.taggedStudents.map((student: any) => {
        if (student.collegeName && !student.normalizedCollegeName) {
          return {
            ...student,
            normalizedCollegeName: normalizeCollegeName(student.collegeName),
          };
        }
        return student;
      });

      if (JSON.stringify(updatedStudents) !== JSON.stringify(driveData.taggedStudents)) {
        updates.taggedStudents = updatedStudents;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      await driveDoc.ref.update(updates);
      stats.interviewDrivesUpdated++;
    }
  }

  console.log(`  ✅ Updated ${stats.interviewDrivesUpdated} interview drives`);
}

/**
 * Print migration summary
 */
function printMigrationSummary(
  stats: MigrationStats,
  errors: MigrationReport['errors'],
  warnings: string[]
): void {
  const duration = stats.endTime 
    ? (stats.endTime.getTime() - stats.startTime.getTime()) / 1000 
    : 0;

  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`\n⏱️  Duration: ${duration.toFixed(2)}s`);
  console.log(`\n📚 Colleges:`);
  console.log(`   Processed: ${stats.collegesProcessed}`);
  console.log(`   Updated: ${stats.collegesUpdated}`);
  console.log(`\n👥 Students:`);
  console.log(`   Processed: ${stats.studentsProcessed}`);
  console.log(`   Updated: ${stats.studentsUpdated}`);
  console.log(`\n📝 Registration Requests:`);
  console.log(`   Processed: ${stats.registrationRequestsProcessed}`);
  console.log(`   Updated: ${stats.registrationRequestsUpdated}`);
  console.log(`\n💼 Job Postings:`);
  console.log(`   Processed: ${stats.jobPostingsProcessed}`);
  console.log(`   Updated: ${stats.jobPostingsUpdated}`);
  console.log(`\n🎯 Interview Drives:`);
  console.log(`   Processed: ${stats.interviewDrivesProcessed}`);
  console.log(`   Updated: ${stats.interviewDrivesUpdated}`);
  
  if (errors.length > 0) {
    console.log(`\n❌ Errors: ${errors.length}`);
    errors.slice(0, 10).forEach(error => {
      console.log(`   - ${error.entityType} ${error.entityId}: ${error.message}`);
    });
    if (errors.length > 10) {
      console.log(`   ... and ${errors.length - 10} more errors`);
    }
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  Warnings: ${warnings.length}`);
    warnings.slice(0, 10).forEach(warning => {
      console.log(`   - ${warning}`);
    });
    if (warnings.length > 10) {
      console.log(`   ... and ${warnings.length - 10} more warnings`);
    }
  }

  console.log('\n' + '='.repeat(60));
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Migration completed successfully with no issues!');
  } else if (errors.length === 0) {
    console.log('✅ Migration completed successfully with some warnings.');
  } else {
    console.log('⚠️  Migration completed with errors. Please review the error log.');
  }
  console.log('='.repeat(60) + '\n');
}

/**
 * Run migration if called directly
 */
if (require.main === module) {
  migrateCollegeNames()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateCollegeNames };
export type { MigrationReport, MigrationStats };

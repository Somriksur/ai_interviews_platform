/**
 * Data Migration Script: Recruiter to Organization
 * 
 * This script migrates existing recruiter data to the new organization model:
 * 1. Backs up all recruiter data
 * 2. Creates organization accounts for existing recruiters
 * 3. Updates interview records: recruiterId → organizationId
 * 4. Updates report records with organization references
 * 5. Verifies data integrity
 */

import { db as adminDb } from '../firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

interface MigrationResult {
  success: boolean;
  recruitersProcessed: number;
  organizationsCreated: number;
  interviewsUpdated: number;
  reportsUpdated: number;
  errors: string[];
}

async function migrateRecruiterToOrganization(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    recruitersProcessed: 0,
    organizationsCreated: 0,
    interviewsUpdated: 0,
    reportsUpdated: 0,
    errors: [],
  };

  try {
    console.log('🚀 Starting migration: Recruiter → Organization');
    console.log('================================================\n');

    // Step 1: Backup recruiter data
    console.log('📦 Step 1: Backing up recruiter data...');
    const recruitersSnapshot = await adminDb
      .collection('users')
      .where('role', '==', 'recruiter')
      .get();

    const recruiters = recruitersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as { id: string; name?: string; email: string; phone?: string; address?: string; createdAt?: Date }));

    console.log(`Found ${recruiters.length} recruiter accounts\n`);

    if (recruiters.length === 0) {
      console.log('✅ No recruiters to migrate');
      result.success = true;
      return result;
    }

    // Create backup
    const backupRef = await adminDb.collection('_migration_backups').add({
      type: 'recruiter_to_organization',
      timestamp: new Date(),
      recruiters,
    });
    console.log(`✅ Backup created: ${backupRef.id}\n`);

    // Step 2: Create organization accounts for each recruiter
    console.log('🏢 Step 2: Creating organization accounts...');
    for (const recruiter of recruiters) {
      try {
        // Create organization
        const orgRef = await adminDb.collection('organizations').add({
          name: recruiter.name || `${recruiter.email}'s Organization`,
          email: recruiter.email,
          phone: recruiter.phone || '',
          address: recruiter.address || '',
          adminId: recruiter.id,
          createdAt: recruiter.createdAt || new Date(),
          migratedFrom: 'recruiter',
          originalRecruiterId: recruiter.id,
        });

        console.log(`  ✓ Created organization ${orgRef.id} for recruiter ${recruiter.id}`);

        // Update user role to organization
        await adminDb.collection('users').doc(recruiter.id).update({
          role: 'organization',
          organizationId: orgRef.id,
          migratedAt: new Date(),
        });

        result.organizationsCreated++;
      } catch (error) {
        const errorMsg = `Failed to create organization for recruiter ${recruiter.id}: ${error}`;
        console.error(`  ✗ ${errorMsg}`);
        result.errors.push(errorMsg);
      }

      result.recruitersProcessed++;
    }
    console.log(`✅ Created ${result.organizationsCreated} organizations\n`);

    // Step 3: Update interview records
    console.log('📝 Step 3: Updating interview records...');
    for (const recruiter of recruiters) {
      try {
        // Get organization ID for this recruiter
        const userDoc = await adminDb.collection('users').doc(recruiter.id).get();
        const organizationId = userDoc.data()?.organizationId;

        if (!organizationId) {
          console.log(`  ⚠ No organization found for recruiter ${recruiter.id}, skipping interviews`);
          continue;
        }

        // Update interviews
        const interviewsSnapshot = await adminDb
          .collection('interviews')
          .where('recruiterId', '==', recruiter.id)
          .get();

        for (const interviewDoc of interviewsSnapshot.docs) {
          await adminDb.collection('interviews').doc(interviewDoc.id).update({
            organizationId,
            recruiterId: FieldValue.delete(), // Remove old field
            migratedAt: new Date(),
          });
          result.interviewsUpdated++;
        }

        console.log(`  ✓ Updated ${interviewsSnapshot.size} interviews for recruiter ${recruiter.id}`);
      } catch (error) {
        const errorMsg = `Failed to update interviews for recruiter ${recruiter.id}: ${error}`;
        console.error(`  ✗ ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }
    console.log(`✅ Updated ${result.interviewsUpdated} interview records\n`);

    // Step 4: Update report records
    console.log('📊 Step 4: Updating report records...');
    for (const recruiter of recruiters) {
      try {
        // Get organization ID for this recruiter
        const userDoc = await adminDb.collection('users').doc(recruiter.id).get();
        const organizationId = userDoc.data()?.organizationId;

        if (!organizationId) {
          console.log(`  ⚠ No organization found for recruiter ${recruiter.id}, skipping reports`);
          continue;
        }

        // Update placement reports
        const reportsSnapshot = await adminDb
          .collection('placement_reports')
          .where('recruiterId', '==', recruiter.id)
          .get();

        for (const reportDoc of reportsSnapshot.docs) {
          await adminDb.collection('placement_reports').doc(reportDoc.id).update({
            organizationId,
            recruiterId: FieldValue.delete(), // Remove old field
            migratedAt: new Date(),
          });
          result.reportsUpdated++;
        }

        console.log(`  ✓ Updated ${reportsSnapshot.size} reports for recruiter ${recruiter.id}`);
      } catch (error) {
        const errorMsg = `Failed to update reports for recruiter ${recruiter.id}: ${error}`;
        console.error(`  ✗ ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }
    console.log(`✅ Updated ${result.reportsUpdated} report records\n`);

    // Step 5: Verify data integrity
    console.log('🔍 Step 5: Verifying data integrity...');
    let integrityIssues = 0;

    // Check for orphaned interviews
    const orphanedInterviews = await adminDb
      .collection('interviews')
      .where('recruiterId', '!=', null)
      .get();

    if (!orphanedInterviews.empty) {
      console.log(`  ⚠ Found ${orphanedInterviews.size} interviews still with recruiterId`);
      integrityIssues += orphanedInterviews.size;
    }

    // Check for orphaned reports
    const orphanedReports = await adminDb
      .collection('placement_reports')
      .where('recruiterId', '!=', null)
      .get();

    if (!orphanedReports.empty) {
      console.log(`  ⚠ Found ${orphanedReports.size} reports still with recruiterId`);
      integrityIssues += orphanedReports.size;
    }

    if (integrityIssues === 0) {
      console.log('  ✓ Data integrity verified - no issues found');
    }

    console.log('\n================================================');
    console.log('✅ Migration completed successfully!');
    console.log(`   Recruiters processed: ${result.recruitersProcessed}`);
    console.log(`   Organizations created: ${result.organizationsCreated}`);
    console.log(`   Interviews updated: ${result.interviewsUpdated}`);
    console.log(`   Reports updated: ${result.reportsUpdated}`);
    console.log(`   Errors: ${result.errors.length}`);
    console.log('================================================\n');

    result.success = result.errors.length === 0;
    return result;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    result.errors.push(`Migration failed: ${error}`);
    return result;
  }
}

// Run migration if executed directly
if (require.main === module) {
  migrateRecruiterToOrganization()
    .then((result) => {
      if (result.success) {
        console.log('✅ Migration completed successfully');
        process.exit(0);
      } else {
        console.error('❌ Migration completed with errors');
        console.error('Errors:', result.errors);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { migrateRecruiterToOrganization };

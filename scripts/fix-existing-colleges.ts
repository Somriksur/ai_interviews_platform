#!/usr/bin/env tsx

/**
 * Fix Existing Colleges Script
 * 
 * This script adds the normalizedName field to existing colleges
 * and trims any leading/trailing whitespace from college names.
 * 
 * Run with: npm run fix-colleges
 */

import { db } from '../firebase/admin';
import { normalizeCollegeName } from '../lib/services/college-name.service';

async function fixExistingColleges() {
  console.log('🔧 Starting college data cleanup...\n');
  
  try {
    // Get all colleges
    const collegesSnapshot = await db.collection('colleges').get();
    
    if (collegesSnapshot.empty) {
      console.log('ℹ️  No colleges found in database.');
      return;
    }
    
    console.log(`📊 Found ${collegesSnapshot.size} college(s) to process\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const doc of collegesSnapshot.docs) {
      const data = doc.data();
      const originalName = data.name;
      
      if (!originalName) {
        console.log(`⚠️  College ${doc.id} has no name, skipping...`);
        skippedCount++;
        continue;
      }
      
      const trimmedName = originalName.trim();
      const normalizedName = normalizeCollegeName(trimmedName);
      
      // Check if update is needed
      const needsUpdate = 
        !data.normalizedName || 
        data.name !== trimmedName ||
        data.normalizedName !== normalizedName;
      
      if (needsUpdate) {
        console.log(`🔄 Updating college: ${doc.id}`);
        console.log(`   Original name: "${originalName}"`);
        console.log(`   Trimmed name:  "${trimmedName}"`);
        console.log(`   Normalized:    "${normalizedName}"`);
        
        await doc.ref.update({
          name: trimmedName,
          normalizedName: normalizedName,
          updatedAt: new Date()
        });
        
        console.log(`   ✅ Updated successfully\n`);
        updatedCount++;
      } else {
        console.log(`✓ College ${doc.id} ("${originalName}") is already correct`);
        skippedCount++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   Total colleges: ${collegesSnapshot.size}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Skipped (already correct): ${skippedCount}`);
    console.log('='.repeat(50));
    console.log('\n✅ College data cleanup completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error during college cleanup:', error);
    throw error;
  }
}

// Run the script
fixExistingColleges()
  .then(() => {
    console.log('\n✨ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

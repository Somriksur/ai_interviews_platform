/**
 * College Resolution Service
 * 
 * Provides backward compatibility during the transition from college IDs to normalized names.
 * Accepts both college IDs and normalized college names as input and resolves them to the
 * correct college document.
 */

import { db } from '@/firebase/admin';
import { normalizeCollegeName } from './college-name.service';

export interface CollegeResolutionResult {
  id: string;
  name: string;
  normalizedName: string;
  organizationId: string;
  found: boolean;
  resolvedBy: 'id' | 'normalizedName' | 'none';
}

/**
 * Resolves a college identifier (either ID or normalized name) to a college document
 * 
 * @param identifier - Either a college ID (e.g., "college-123") or normalized name (e.g., "mit")
 * @returns College resolution result with document data and resolution method
 */
export async function resolveCollege(
  identifier: string
): Promise<CollegeResolutionResult> {
  if (!identifier || identifier.trim().length === 0) {
    return {
      id: '',
      name: '',
      normalizedName: '',
      organizationId: '',
      found: false,
      resolvedBy: 'none',
    };
  }

  const trimmedIdentifier = identifier.trim();

  // Strategy 1: Try to resolve by normalized name first (new approach)
  const normalizedIdentifier = normalizeCollegeName(trimmedIdentifier);
  
  try {
    const collegesByNameSnapshot = await db
      .collection('colleges')
      .where('normalizedName', '==', normalizedIdentifier)
      .limit(1)
      .get();

    if (!collegesByNameSnapshot.empty) {
      const collegeDoc = collegesByNameSnapshot.docs[0];
      const collegeData = collegeDoc.data();
      
      return {
        id: collegeDoc.id,
        name: collegeData.name || '',
        normalizedName: collegeData.normalizedName || normalizedIdentifier,
        organizationId: collegeData.organizationId || '',
        found: true,
        resolvedBy: 'normalizedName',
      };
    }
  } catch (error) {
    console.warn(`Failed to resolve college by normalized name: ${normalizedIdentifier}`, error);
  }

  // Strategy 2: Fall back to ID-based lookup (legacy approach)
  try {
    const collegeDoc = await db.collection('colleges').doc(trimmedIdentifier).get();

    if (collegeDoc.exists) {
      const collegeData = collegeDoc.data();
      
      return {
        id: collegeDoc.id,
        name: collegeData?.name || '',
        normalizedName: collegeData?.normalizedName || normalizeCollegeName(collegeData?.name || ''),
        organizationId: collegeData?.organizationId || '',
        found: true,
        resolvedBy: 'id',
      };
    }
  } catch (error) {
    console.warn(`Failed to resolve college by ID: ${trimmedIdentifier}`, error);
  }

  // Not found by either method
  return {
    id: '',
    name: '',
    normalizedName: '',
    organizationId: '',
    found: false,
    resolvedBy: 'none',
  };
}

/**
 * Resolves multiple college identifiers in parallel
 * 
 * @param identifiers - Array of college IDs or normalized names
 * @returns Array of college resolution results
 */
export async function resolveColleges(
  identifiers: string[]
): Promise<CollegeResolutionResult[]> {
  const resolutionPromises = identifiers.map(id => resolveCollege(id));
  return Promise.all(resolutionPromises);
}

/**
 * Checks if an identifier is likely a college ID (vs a normalized name)
 * This is a heuristic based on common ID patterns
 * 
 * @param identifier - The identifier to check
 * @returns true if it looks like an ID, false if it looks like a normalized name
 */
export function isLikelyCollegeId(identifier: string): boolean {
  if (!identifier) return false;
  
  // IDs typically contain hyphens, underscores, or are alphanumeric with specific patterns
  // Normalized names are typically lowercase with spaces
  const hasHyphen = identifier.includes('-');
  const hasUnderscore = identifier.includes('_');
  const startsWithCollege = identifier.toLowerCase().startsWith('college');
  const isAlphanumericWithSpecialChars = /^[a-zA-Z0-9_-]+$/.test(identifier);
  
  return hasHyphen || hasUnderscore || startsWithCollege || isAlphanumericWithSpecialChars;
}

/**
 * Logs a deprecation warning when an ID-based lookup is used
 * 
 * @param identifier - The college ID that was used
 * @param endpoint - The endpoint where the ID was used
 */
export function logDeprecationWarning(identifier: string, endpoint: string): void {
  console.warn(
    `⚠️ DEPRECATION WARNING: College ID "${identifier}" used at ${endpoint}. ` +
    `Please migrate to using normalized college names instead.`
  );
}

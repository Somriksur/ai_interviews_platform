/**
 * Middleware for validating college name references
 * Ensures referential integrity by checking that normalized college names exist
 */

import { db } from '@/firebase/admin';
import { normalizeCollegeName } from '@/lib/services/college-name.service';

/**
 * Validates that a college with the given normalized name exists
 * @param normalizedCollegeName - The normalized college name to validate
 * @returns Object with isValid flag and optional error message
 */
export async function validateCollegeExists(
  normalizedCollegeName: string
): Promise<{ isValid: boolean; error?: string; collegeId?: string }> {
  try {
    // Query colleges collection by normalized name
    const collegesSnapshot = await db
      .collection('colleges')
      .where('normalizedName', '==', normalizedCollegeName)
      .limit(1)
      .get();

    if (collegesSnapshot.empty) {
      return {
        isValid: false,
        error: `College with name '${normalizedCollegeName}' not found`,
      };
    }

    const collegeDoc = collegesSnapshot.docs[0];
    return {
      isValid: true,
      collegeId: collegeDoc.id,
    };
  } catch (error: any) {
    return {
      isValid: false,
      error: `Failed to validate college: ${error.message}`,
    };
  }
}

/**
 * Validates that a college name exists (accepts any casing)
 * @param collegeName - The college name to validate (any casing)
 * @returns Object with isValid flag, normalized name, and optional error
 */
export async function validateCollegeName(
  collegeName: string
): Promise<{
  isValid: boolean;
  normalizedName?: string;
  error?: string;
  collegeId?: string;
}> {
  if (!collegeName || collegeName.trim().length === 0) {
    return {
      isValid: false,
      error: 'College name cannot be empty',
    };
  }

  const normalizedName = normalizeCollegeName(collegeName);

  if (normalizedName.length < 3) {
    return {
      isValid: false,
      error: 'College name must be at least 3 characters',
    };
  }

  const result = await validateCollegeExists(normalizedName);

  if (!result.isValid) {
    return {
      isValid: false,
      normalizedName,
      error: result.error,
    };
  }

  return {
    isValid: true,
    normalizedName,
    collegeId: result.collegeId,
  };
}

/**
 * Validates multiple college names at once
 * @param collegeNames - Array of college names to validate
 * @returns Object with validation results for each college
 */
export async function validateMultipleColleges(
  collegeNames: string[]
): Promise<{
  isValid: boolean;
  validColleges: string[];
  invalidColleges: Array<{ name: string; error: string }>;
}> {
  const validColleges: string[] = [];
  const invalidColleges: Array<{ name: string; error: string }> = [];

  // Validate each college
  const validationPromises = collegeNames.map(async (name) => {
    const result = await validateCollegeName(name);
    if (result.isValid && result.normalizedName) {
      validColleges.push(result.normalizedName);
    } else {
      invalidColleges.push({
        name,
        error: result.error || 'Unknown error',
      });
    }
  });

  await Promise.all(validationPromises);

  return {
    isValid: invalidColleges.length === 0,
    validColleges,
    invalidColleges,
  };
}

/**
 * Validates that a student's college reference is valid
 * @param studentData - Student data containing college name
 * @returns Validation result
 */
export async function validateStudentCollegeReference(studentData: {
  collegeName?: string;
  normalizedCollegeName?: string;
}): Promise<{ isValid: boolean; error?: string; normalizedName?: string }> {
  const collegeName = studentData.collegeName || studentData.normalizedCollegeName;

  if (!collegeName) {
    return {
      isValid: false,
      error: 'Student must have a college name',
    };
  }

  return await validateCollegeName(collegeName);
}

/**
 * Validates that all college references in an array are valid
 * @param normalizedCollegeNames - Array of normalized college names
 * @returns Validation result with details about invalid references
 */
export async function validateCollegeReferences(
  normalizedCollegeNames: string[]
): Promise<{
  isValid: boolean;
  invalidReferences: string[];
  error?: string;
}> {
  if (!normalizedCollegeNames || normalizedCollegeNames.length === 0) {
    return {
      isValid: true,
      invalidReferences: [],
    };
  }

  // Get all colleges in one query for efficiency
  const collegesSnapshot = await db
    .collection('colleges')
    .where('normalizedName', 'in', normalizedCollegeNames.slice(0, 10)) // Firestore limit
    .get();

  const existingColleges = new Set(
    collegesSnapshot.docs.map((doc) => doc.data().normalizedName)
  );

  const invalidReferences = normalizedCollegeNames.filter(
    (name) => !existingColleges.has(name)
  );

  if (invalidReferences.length > 0) {
    return {
      isValid: false,
      invalidReferences,
      error: `Invalid college references: ${invalidReferences.join(', ')}`,
    };
  }

  return {
    isValid: true,
    invalidReferences: [],
  };
}

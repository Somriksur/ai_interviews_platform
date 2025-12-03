/**
 * College Name Normalization Service
 * Provides case-insensitive college name handling and validation
 */

export interface College {
  id: string;
  name: string;
  normalizedName: string;
  organizationId: string;
  location: string;
  contactEmail: string;
  contactPhone: string;
  adminId: string;
  createdAt: Date;
  stats?: {
    totalStudents: number;
    pendingRegistrations: number;
    interviewsCompleted: number;
    averagePlacementScore: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Normalize college name to lowercase and trim whitespace
 * This is the core normalization function used throughout the system
 */
export function normalizeCollegeName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }
  return name.trim().toLowerCase();
}

/**
 * Validate college name format
 * Rules:
 * - Minimum 3 characters
 * - Only alphanumeric, spaces, hyphens, apostrophes, periods, and ampersands
 * - Cannot be only whitespace
 */
export function validateCollegeName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return {
      isValid: false,
      error: 'College name is required',
    };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 3) {
    return {
      isValid: false,
      error: 'College name must be at least 3 characters long',
    };
  }

  if (trimmedName.length > 200) {
    return {
      isValid: false,
      error: 'College name must not exceed 200 characters',
    };
  }

  // Allow alphanumeric, spaces, hyphens, apostrophes, periods, and ampersands
  const validPattern = /^[a-zA-Z0-9\s\-'.&]+$/;
  if (!validPattern.test(trimmedName)) {
    return {
      isValid: false,
      error: 'College name can only contain letters, numbers, spaces, hyphens, apostrophes, periods, and ampersands',
    };
  }

  return { isValid: true };
}

/**
 * Compare two college names for equality (case-insensitive)
 */
export function areCollegeNamesEqual(name1: string, name2: string): boolean {
  return normalizeCollegeName(name1) === normalizeCollegeName(name2);
}

/**
 * Check if a college name matches a search query (case-insensitive partial match)
 */
export function matchesSearchQuery(collegeName: string, query: string): boolean {
  const normalizedName = normalizeCollegeName(collegeName);
  const normalizedQuery = normalizeCollegeName(query);
  return normalizedName.includes(normalizedQuery);
}

/**
 * Calculate match score for search ranking
 * Returns a score from 0-100 where:
 * - 100: Exact match (after normalization)
 * - 90: Starts with query
 * - 50-89: Contains query (based on position)
 * - 0: No match
 */
export function calculateMatchScore(collegeName: string, query: string): number {
  const normalizedName = normalizeCollegeName(collegeName);
  const normalizedQuery = normalizeCollegeName(query);

  if (!normalizedQuery) {
    return 0;
  }

  // Exact match
  if (normalizedName === normalizedQuery) {
    return 100;
  }

  // Starts with query
  if (normalizedName.startsWith(normalizedQuery)) {
    return 90;
  }

  // Contains query - score based on position
  const index = normalizedName.indexOf(normalizedQuery);
  if (index !== -1) {
    // Earlier in the string = higher score
    const positionScore = Math.max(50, 89 - Math.floor(index / 2));
    return positionScore;
  }

  return 0;
}

/**
 * Sort colleges by relevance to search query
 */
export function sortByRelevance(colleges: College[], query: string): College[] {
  if (!query) {
    return colleges;
  }

  return colleges
    .map(college => ({
      college,
      score: calculateMatchScore(college.name, query),
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => {
      // First sort by score
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // Then alphabetically by name
      return a.college.name.localeCompare(b.college.name);
    })
    .map(item => item.college);
}

/**
 * Extract college name variations for fuzzy matching
 * Returns common variations and abbreviations
 */
export function getCollegeNameVariations(name: string): string[] {
  const variations: string[] = [name];
  const normalized = normalizeCollegeName(name);
  
  // Add normalized version
  variations.push(normalized);

  // Add version without common suffixes
  const suffixes = ['college', 'university', 'institute', 'school'];
  for (const suffix of suffixes) {
    if (normalized.endsWith(suffix)) {
      const withoutSuffix = normalized.slice(0, -suffix.length).trim();
      if (withoutSuffix.length >= 3) {
        variations.push(withoutSuffix);
      }
    }
  }

  // Add acronym if applicable (words starting with capital letters)
  const words = name.split(/\s+/);
  if (words.length > 1) {
    const acronym = words
      .filter(word => word.length > 0 && /^[A-Z]/.test(word))
      .map(word => word[0].toUpperCase())
      .join('');
    if (acronym.length >= 2) {
      variations.push(acronym.toLowerCase());
    }
  }

  // Remove duplicates
  return [...new Set(variations)];
}

/**
 * Suggest similar college names based on fuzzy matching
 * Uses Levenshtein distance for similarity
 */
export function suggestSimilarColleges(
  query: string,
  colleges: College[],
  maxSuggestions: number = 5
): College[] {
  const normalizedQuery = normalizeCollegeName(query);
  
  if (!normalizedQuery || normalizedQuery.length < 2) {
    return [];
  }

  const suggestions = colleges
    .map(college => ({
      college,
      distance: levenshteinDistance(normalizedQuery, college.normalizedName),
    }))
    .filter(item => item.distance <= 5) // Only suggest if reasonably close
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxSuggestions)
    .map(item => item.college);

  return suggestions;
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Format college name for display
 * Preserves original casing
 */
export function formatCollegeNameForDisplay(college: College): string {
  return college.name;
}

/**
 * Create a college object with normalized name
 */
export function createCollegeWithNormalizedName(
  data: Omit<College, 'normalizedName'>
): College {
  return {
    ...data,
    normalizedName: normalizeCollegeName(data.name),
  };
}

/**
 * Validate that a normalized college name exists in a list
 */
export function collegeExists(
  normalizedName: string,
  colleges: College[]
): boolean {
  return colleges.some(
    college => college.normalizedName === normalizedName
  );
}

/**
 * Find college by normalized name
 */
export function findCollegeByNormalizedName(
  normalizedName: string,
  colleges: College[]
): College | null {
  return colleges.find(
    college => college.normalizedName === normalizedName
  ) || null;
}

/**
 * Find college by any case variation of the name
 */
export function findCollegeByName(
  name: string,
  colleges: College[]
): College | null {
  const normalized = normalizeCollegeName(name);
  return findCollegeByNormalizedName(normalized, colleges);
}

/**
 * Simple in-memory cache for college lookups
 * In production, consider using Redis or similar
 */
const collegeCache = new Map<string, { college: College; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Resolve college name to college object with caching
 * Accepts any case variation and returns the college if found
 */
export function resolveCollegeWithCache(
  name: string,
  colleges: College[]
): College | null {
  const normalized = normalizeCollegeName(name);
  
  // Check cache first
  const cached = collegeCache.get(normalized);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.college;
  }
  
  // Find college
  const college = findCollegeByNormalizedName(normalized, colleges);
  
  // Cache result if found
  if (college) {
    collegeCache.set(normalized, {
      college,
      timestamp: Date.now(),
    });
  }
  
  return college;
}

/**
 * Clear the college cache
 * Useful when colleges are updated
 */
export function clearCollegeCache(): void {
  collegeCache.clear();
}

/**
 * Remove a specific college from cache
 */
export function invalidateCollegeCache(normalizedName: string): void {
  collegeCache.delete(normalizedName);
}

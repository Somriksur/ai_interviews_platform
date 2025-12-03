import React from 'react';

interface RecommendationBadgeProps {
  studentScore: number;
  minimumScore: number;
  showDetails?: boolean;
}

/**
 * RecommendationBadge Component
 * 
 * Displays a selection recommendation badge based on student score vs minimum threshold
 * - Green "Recommended" if score >= minimum
 * - Yellow/Red "Below Threshold" if score < minimum
 * - Shows score comparison when showDetails is true
 */
export function RecommendationBadge({
  studentScore,
  minimumScore,
  showDetails = true,
}: RecommendationBadgeProps) {
  const meetsThreshold = studentScore >= minimumScore;

  const badgeClasses = meetsThreshold
    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300'
    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300';

  const icon = meetsThreshold ? '✓' : '✗';
  const label = meetsThreshold ? 'Recommended' : 'Below Threshold';

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${badgeClasses}`}>
      <span className="text-base">{icon}</span>
      <span>{label}</span>
      {showDetails && (
        <span className="ml-1 font-semibold">
          {studentScore}/{minimumScore}
        </span>
      )}
    </div>
  );
}

/**
 * Helper function to determine if a student meets the threshold
 * Used for filtering and sorting logic
 */
export function meetsScoreThreshold(
  studentScore: number,
  minimumScore: number | null | undefined
): boolean {
  if (minimumScore === null || minimumScore === undefined) {
    return true; // No threshold means all students meet criteria
  }
  return studentScore >= minimumScore;
}

/**
 * Helper function to get recommendation status
 */
export function getRecommendationStatus(
  studentScore: number,
  minimumScore: number | null | undefined
): 'recommended' | 'below-threshold' | 'no-threshold' {
  if (minimumScore === null || minimumScore === undefined) {
    return 'no-threshold';
  }
  return studentScore >= minimumScore ? 'recommended' : 'below-threshold';
}

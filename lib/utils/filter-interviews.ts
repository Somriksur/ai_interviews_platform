import { FilterState } from "@/components/InterviewFilters";

/**
 * Filter interviews based on filter state
 */
export function filterInterviews<T extends Record<string, any>>(
    interviews: T[],
    filters: FilterState
): T[] {
    let filtered = [...interviews];

    // Filter by status
    if (filters.status.length > 0) {
        filtered = filtered.filter((interview) =>
            filters.status.includes(interview.status)
        );
    }

    // Filter by search (name or email)
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter((interview) => {
            const candidateName = interview.candidateName?.toLowerCase() || "";
            const candidateEmail = interview.candidateEmail?.toLowerCase() || "";
            const role = interview.role?.toLowerCase() || "";
            
            return (
                candidateName.includes(searchLower) ||
                candidateEmail.includes(searchLower) ||
                role.includes(searchLower)
            );
        });
    }

    // Filter by score range
    if (filters.scoreRange.min > 0 || filters.scoreRange.max < 100) {
        filtered = filtered.filter((interview) => {
            const score = interview.totalScore || interview.score || 0;
            return score >= filters.scoreRange.min && score <= filters.scoreRange.max;
        });
    }

    // Filter by role
    if (filters.role.length > 0) {
        filtered = filtered.filter((interview) =>
            filters.role.includes(interview.role)
        );
    }

    // Filter by date range
    if (filters.dateRange.from || filters.dateRange.to) {
        filtered = filtered.filter((interview) => {
            const interviewDate = new Date(interview.createdAt || interview.date);
            
            if (filters.dateRange.from && interviewDate < filters.dateRange.from) {
                return false;
            }
            
            if (filters.dateRange.to) {
                const toDate = new Date(filters.dateRange.to);
                toDate.setHours(23, 59, 59, 999); // Include the entire day
                if (interviewDate > toDate) {
                    return false;
                }
            }
            
            return true;
        });
    }

    return filtered;
}

/**
 * Get unique roles from interviews
 */
export function getUniqueRoles<T extends Record<string, any>>(
    interviews: T[]
): string[] {
    const roles = interviews.map((interview) => interview.role).filter(Boolean);
    return [...new Set(roles)].sort();
}

/**
 * Get filter statistics
 */
export function getFilterStats<T extends Record<string, any>>(
    interviews: T[]
): {
    total: number;
    byStatus: Record<string, number>;
    byRole: Record<string, number>;
    averageScore: number;
} {
    const stats = {
        total: interviews.length,
        byStatus: {} as Record<string, number>,
        byRole: {} as Record<string, number>,
        averageScore: 0,
    };

    let totalScore = 0;
    let scoreCount = 0;

    interviews.forEach((interview) => {
        // Count by status
        const status = interview.status || "unknown";
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

        // Count by role
        const role = interview.role || "unknown";
        stats.byRole[role] = (stats.byRole[role] || 0) + 1;

        // Calculate average score
        const score = interview.totalScore || interview.score;
        if (score !== undefined && score !== null) {
            totalScore += score;
            scoreCount++;
        }
    });

    stats.averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

    return stats;
}

/**
 * Sort interviews
 */
export function sortInterviews<T extends Record<string, any>>(
    interviews: T[],
    sortBy: "date" | "score" | "name" | "status",
    order: "asc" | "desc" = "desc"
): T[] {
    const sorted = [...interviews];

    sorted.sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
            case "date":
                comparison = new Date(a.createdAt || a.date).getTime() - 
                           new Date(b.createdAt || b.date).getTime();
                break;
            case "score":
                comparison = (a.totalScore || a.score || 0) - 
                           (b.totalScore || b.score || 0);
                break;
            case "name":
                comparison = (a.candidateName || "").localeCompare(b.candidateName || "");
                break;
            case "status":
                comparison = (a.status || "").localeCompare(b.status || "");
                break;
        }

        return order === "asc" ? comparison : -comparison;
    });

    return sorted;
}

/**
 * Save filter preferences to localStorage
 */
export function saveFilterPreferences(filters: FilterState): void {
    if (typeof window === "undefined") return;
    
    try {
        localStorage.setItem("interview-filters", JSON.stringify(filters));
    } catch (error) {
        console.error("Failed to save filter preferences:", error);
    }
}

/**
 * Load filter preferences from localStorage
 */
export function loadFilterPreferences(): FilterState | null {
    if (typeof window === "undefined") return null;
    
    try {
        const saved = localStorage.getItem("interview-filters");
        if (saved) {
            const filters = JSON.parse(saved);
            // Convert date strings back to Date objects
            if (filters.dateRange) {
                filters.dateRange.from = filters.dateRange.from 
                    ? new Date(filters.dateRange.from) 
                    : null;
                filters.dateRange.to = filters.dateRange.to 
                    ? new Date(filters.dateRange.to) 
                    : null;
            }
            return filters;
        }
    } catch (error) {
        console.error("Failed to load filter preferences:", error);
    }
    
    return null;
}

/**
 * Clear filter preferences
 */
export function clearFilterPreferences(): void {
    if (typeof window === "undefined") return;
    
    try {
        localStorage.removeItem("interview-filters");
    } catch (error) {
        console.error("Failed to clear filter preferences:", error);
    }
}

import Fuse, { IFuseOptions } from "fuse.js";

export interface SearchableInterview {
    id: string;
    role: string;
    candidateEmail: string;
    candidateName?: string;
    status: string;
    techstack: string[];
    questions?: string[];
    type: string;
    level: string;
    createdAt: string;
}

export interface SearchableFeedback {
    id: string;
    candidateName: string;
    candidateEmail: string;
    role: string;
    totalScore: number;
    strengths: string[];
    areasForImprovement: string[];
    finalAssessment: string;
    createdAt: string;
}

export interface SearchResult {
    type: "interview" | "feedback" | "question";
    item: any;
    score: number;
    matches: string[];
}

/**
 * Search engine using Fuse.js for fuzzy search
 */
export class SearchEngine {
    private interviewFuse: Fuse<SearchableInterview> | null = null;
    private feedbackFuse: Fuse<SearchableFeedback> | null = null;

    constructor() {
        // Initialize with empty data
        this.interviewFuse = null;
        this.feedbackFuse = null;
    }

    /**
     * Index interviews for searching
     */
    indexInterviews(interviews: SearchableInterview[]): void {
        const options: IFuseOptions<SearchableInterview> = {
            keys: [
                { name: "role", weight: 2 },
                { name: "candidateEmail", weight: 2 },
                { name: "candidateName", weight: 2 },
                { name: "status", weight: 1 },
                { name: "techstack", weight: 1.5 },
                { name: "questions", weight: 1 },
                { name: "type", weight: 0.5 },
                { name: "level", weight: 0.5 },
            ],
            threshold: 0.4,
            includeScore: true,
            includeMatches: true,
            minMatchCharLength: 2,
        };

        this.interviewFuse = new Fuse(interviews, options);
    }

    /**
     * Index feedback for searching
     */
    indexFeedback(feedbacks: SearchableFeedback[]): void {
        const options: IFuseOptions<SearchableFeedback> = {
            keys: [
                { name: "candidateName", weight: 2 },
                { name: "candidateEmail", weight: 2 },
                { name: "role", weight: 1.5 },
                { name: "strengths", weight: 1 },
                { name: "areasForImprovement", weight: 1 },
                { name: "finalAssessment", weight: 1 },
            ],
            threshold: 0.4,
            includeScore: true,
            includeMatches: true,
            minMatchCharLength: 2,
        };

        this.feedbackFuse = new Fuse(feedbacks, options);
    }

    /**
     * Search across all indexed data
     */
    search(query: string, limit = 20): SearchResult[] {
        if (!query || query.trim().length < 2) {
            return [];
        }

        const results: SearchResult[] = [];

        // Search interviews
        if (this.interviewFuse) {
            const interviewResults = this.interviewFuse.search(query, { limit });
            interviewResults.forEach((result) => {
                results.push({
                    type: "interview",
                    item: result.item,
                    score: result.score || 0,
                    matches: result.matches?.map((m) => m.key || "") || [],
                });
            });
        }

        // Search feedback
        if (this.feedbackFuse) {
            const feedbackResults = this.feedbackFuse.search(query, { limit });
            feedbackResults.forEach((result) => {
                results.push({
                    type: "feedback",
                    item: result.item,
                    score: result.score || 0,
                    matches: result.matches?.map((m) => m.key || "") || [],
                });
            });
        }

        // Sort by score (lower is better in Fuse.js)
        results.sort((a, b) => a.score - b.score);

        return results.slice(0, limit);
    }

    /**
     * Search only interviews
     */
    searchInterviews(query: string, limit = 10): SearchResult[] {
        if (!this.interviewFuse || !query || query.trim().length < 2) {
            return [];
        }

        const results = this.interviewFuse.search(query, { limit });
        return results.map((result) => ({
            type: "interview" as const,
            item: result.item,
            score: result.score || 0,
            matches: result.matches?.map((m) => m.key || "") || [],
        }));
    }

    /**
     * Search only feedback
     */
    searchFeedback(query: string, limit = 10): SearchResult[] {
        if (!this.feedbackFuse || !query || query.trim().length < 2) {
            return [];
        }

        const results = this.feedbackFuse.search(query, { limit });
        return results.map((result) => ({
            type: "feedback" as const,
            item: result.item,
            score: result.score || 0,
            matches: result.matches?.map((m) => m.key || "") || [],
        }));
    }

    /**
     * Get search suggestions based on partial query
     */
    getSuggestions(query: string, limit = 5): string[] {
        if (!query || query.trim().length < 2) {
            return [];
        }

        const results = this.search(query, limit);
        const suggestions = new Set<string>();

        results.forEach((result) => {
            if (result.type === "interview") {
                suggestions.add(result.item.role);
                suggestions.add(result.item.candidateEmail);
                if (result.item.candidateName) {
                    suggestions.add(result.item.candidateName);
                }
            } else if (result.type === "feedback") {
                suggestions.add(result.item.candidateName);
                suggestions.add(result.item.role);
            }
        });

        return Array.from(suggestions).slice(0, limit);
    }

    /**
     * Highlight matching text in search results
     */
    highlightMatches(text: string, query: string): string {
        if (!query) return text;

        const regex = new RegExp(`(${query})`, "gi");
        return text.replace(regex, "<mark>$1</mark>");
    }
}

/**
 * Save search history to localStorage
 */
export function saveSearchHistory(query: string): void {
    if (typeof window === "undefined" || !query.trim()) return;

    try {
        const history = getSearchHistory();
        const updated = [query, ...history.filter((q) => q !== query)].slice(0, 10);
        localStorage.setItem("search-history", JSON.stringify(updated));
    } catch (error) {
        console.error("Failed to save search history:", error);
    }
}

/**
 * Get search history from localStorage
 */
export function getSearchHistory(): string[] {
    if (typeof window === "undefined") return [];

    try {
        const history = localStorage.getItem("search-history");
        return history ? JSON.parse(history) : [];
    } catch (error) {
        console.error("Failed to load search history:", error);
        return [];
    }
}

/**
 * Clear search history
 */
export function clearSearchHistory(): void {
    if (typeof window === "undefined") return;

    try {
        localStorage.removeItem("search-history");
    } catch (error) {
        console.error("Failed to clear search history:", error);
    }
}

/**
 * Track search analytics
 */
export function trackSearch(query: string, resultsCount: number): void {
    if (typeof window === "undefined") return;

    try {
        const analytics = {
            query,
            resultsCount,
            timestamp: new Date().toISOString(),
        };

        // In a real app, send to analytics service
        console.log("Search analytics:", analytics);
    } catch (error) {
        console.error("Failed to track search:", error);
    }
}

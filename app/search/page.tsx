"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { saveSearchHistory, getSearchHistory } from "@/lib/utils/search-engine";

export default function SearchPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get("q") || "";

    const [results, setResults] = useState<Array<{ type: string; item: Record<string, unknown> }>>([]);
    const [loading, setLoading] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [searchInput, setSearchInput] = useState(query);

    useEffect(() => {
        setSearchHistory(getSearchHistory());
    }, []);

    useEffect(() => {
        if (query) {
            performSearch();
            saveSearchHistory(query);
            setSearchHistory(getSearchHistory());
        }
    }, [query]);

    const performSearch = async () => {
        setLoading(true);
        try {
            // In a real app, this would be an API call
            // For now, we'll simulate search results
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Mock results
            const mockResults: Array<{ type: string; item: Record<string, unknown> }> = [
                {
                    type: "interview",
                    item: {
                        id: "1",
                        role: "Frontend Developer",
                        candidateEmail: "john@example.com",
                        candidateName: "John Doe",
                        status: "completed",
                        techstack: ["React", "TypeScript"],
                    },
                },
                {
                    type: "feedback",
                    item: {
                        id: "2",
                        candidateName: "Jane Smith",
                        role: "Backend Developer",
                        totalScore: 85,
                    },
                },
            ];

            setResults(mockResults);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (searchInput.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchInput)}`);
        }
    };

    return (
        <div className="container-responsive py-8 space-mobile">
            {/* Search Header */}
            <div className="space-y-4">
                <Button
                    onClick={() => router.back()}
                    variant="outline"
                    className="tap-target"
                >
                    ← Back
                </Button>

                <h1 className="text-responsive-2xl font-bold">Search</h1>

                {/* Search Input */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="Search interviews, candidates, questions..."
                        className="flex-1 px-4 py-3 border rounded-lg bg-background tap-target"
                        autoFocus
                    />
                    <Button onClick={handleSearch} className="tap-target">
                        🔍 Search
                    </Button>
                </div>
            </div>

            {/* Search History */}
            {!query && searchHistory.length > 0 && (
                <div className="card card-mobile">
                    <h2 className="text-lg font-semibold mb-3">Recent Searches</h2>
                    <div className="flex flex-wrap gap-2">
                        {searchHistory.map((historyQuery, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setSearchInput(historyQuery);
                                    router.push(`/search?q=${encodeURIComponent(historyQuery)}`);
                                }}
                                className="px-3 py-1 bg-accent rounded-full text-sm hover:bg-accent/80 transition-colors"
                            >
                                {historyQuery}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="text-center py-12">
                    <div className="animate-spin text-4xl">⏳</div>
                    <p className="mt-4 text-gray-500">Searching...</p>
                </div>
            )}

            {/* Results */}
            {!loading && query && (
                <div className="space-mobile">
                    <div className="flex items-center justify-between">
                        <h2 className="text-responsive-lg font-semibold">
                            Results for &quot;{query}&quot;
                        </h2>
                        <span className="text-sm text-gray-500">
                            {results.length} result{results.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    {results.length === 0 ? (
                        <div className="card card-mobile text-center py-12">
                            <div className="text-6xl mb-4">🔍</div>
                            <h3 className="text-xl font-semibold mb-2">No results found</h3>
                            <p className="text-gray-500">
                                Try different keywords or check your spelling
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {results.map((result, index) => (
                                <div key={index} className="card card-mobile hover:shadow-lg transition-shadow">
                                    {result.type === "interview" ? (
                                        <Link href={`/recruiter/dashboard`}>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-1 bg-blue-500/20 text-blue-500 rounded text-xs font-semibold">
                                                        Interview
                                                    </span>
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                        result.item.status === "completed"
                                                            ? "bg-green-500/20 text-green-500"
                                                            : "bg-yellow-500/20 text-yellow-500"
                                                    }`}>
                                                        {String(result.item.status || '')}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-semibold">
                                                    {String(result.item.role || '')}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {String(result.item.candidateName || result.item.candidateEmail || '')}
                                                </p>
                                                <div className="flex flex-wrap gap-1">
                                                    {Array.isArray(result.item.techstack) && result.item.techstack.map((tech: unknown, i: number) => (
                                                        <span
                                                            key={i}
                                                            className="px-2 py-1 bg-primary/20 rounded text-xs"
                                                        >
                                                            {String(tech)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </Link>
                                    ) : (
                                        <Link href={`/recruiter/dashboard`}>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-1 bg-purple-500/20 text-purple-500 rounded text-xs font-semibold">
                                                        Feedback
                                                    </span>
                                                    <span className="text-2xl font-bold text-primary">
                                                        {String(result.item.totalScore || 0)}/100
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-semibold">
                                                    {String(result.item.candidateName || '')}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {String(result.item.role || '')}
                                                </p>
                                            </div>
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Search Tips */}
            {!query && (
                <div className="card card-mobile">
                    <h2 className="text-lg font-semibold mb-3">💡 Search Tips</h2>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li>• Search by candidate name or email</li>
                        <li>• Search by job role (e.g., &quot;Frontend Developer&quot;)</li>
                        <li>• Search by tech stack (e.g., &quot;React&quot;, &quot;Python&quot;)</li>
                        <li>• Search by interview status</li>
                        <li>• Use keywords from questions or feedback</li>
                    </ul>
                </div>
            )}
        </div>
    );
}

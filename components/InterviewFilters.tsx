"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";

export interface FilterState {
    status: string[];
    dateRange: { from: Date | null; to: Date | null };
    search: string;
    scoreRange: { min: number; max: number };
    role: string[];
}

interface InterviewFiltersProps {
    onFilterChange: (filters: FilterState) => void;
    availableRoles?: string[];
    className?: string;
}

export default function InterviewFilters({
    onFilterChange,
    availableRoles = [],
    className = "",
}: InterviewFiltersProps) {
    const [filters, setFilters] = useState<FilterState>({
        status: [],
        dateRange: { from: null, to: null },
        search: "",
        scoreRange: { min: 0, max: 100 },
        role: [],
    });

    const [isExpanded, setIsExpanded] = useState(false);
    const [activeFilterCount, setActiveFilterCount] = useState(0);

    useEffect(() => {
        // Count active filters
        let count = 0;
        if (filters.status.length > 0) count++;
        if (filters.dateRange.from || filters.dateRange.to) count++;
        if (filters.search) count++;
        if (filters.scoreRange.min > 0 || filters.scoreRange.max < 100) count++;
        if (filters.role.length > 0) count++;
        setActiveFilterCount(count);

        // Notify parent
        onFilterChange(filters);
    }, [filters, onFilterChange]);

    const handleStatusToggle = (status: string) => {
        setFilters((prev) => ({
            ...prev,
            status: prev.status.includes(status)
                ? prev.status.filter((s) => s !== status)
                : [...prev.status, status],
        }));
    };

    const handleRoleToggle = (role: string) => {
        setFilters((prev) => ({
            ...prev,
            role: prev.role.includes(role)
                ? prev.role.filter((r) => r !== role)
                : [...prev.role, role],
        }));
    };

    const clearAllFilters = () => {
        setFilters({
            status: [],
            dateRange: { from: null, to: null },
            search: "",
            scoreRange: { min: 0, max: 100 },
            role: [],
        });
    };

    const statusOptions = [
        { value: "pending", label: "Pending", color: "yellow" },
        { value: "in-progress", label: "In Progress", color: "blue" },
        { value: "completed", label: "Completed", color: "green" },
    ];

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Filter Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setIsExpanded(!isExpanded)}
                        variant="outline"
                        className="tap-target"
                    >
                        🔍 Filters
                        {activeFilterCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                                {activeFilterCount}
                            </span>
                        )}
                    </Button>

                    {activeFilterCount > 0 && (
                        <Button
                            onClick={clearAllFilters}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                        >
                            Clear All
                        </Button>
                    )}
                </div>

                {/* Search Bar */}
                <div className="flex-1 min-w-[200px] max-w-md">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={filters.search}
                        onChange={(e) =>
                            setFilters((prev) => ({ ...prev, search: e.target.value }))
                        }
                        className="w-full px-4 py-2 border rounded-lg bg-background tap-target"
                    />
                </div>
            </div>

            {/* Expanded Filters */}
            {isExpanded && (
                <div className="card p-6 space-y-6 animate-fadeIn">
                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium mb-3">Status</label>
                        <div className="flex flex-wrap gap-2">
                            {statusOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleStatusToggle(option.value)}
                                    className={`px-4 py-2 rounded-lg border-2 transition-all tap-target ${
                                        filters.status.includes(option.value)
                                            ? `bg-${option.color}-500 text-white border-${option.color}-500`
                                            : "bg-background border-gray-300 hover:border-primary"
                                    }`}
                                >
                                    {option.label}
                                    {filters.status.includes(option.value) && " ✓"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Role Filter */}
                    {availableRoles.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium mb-3">
                                Job Role
                            </label>
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                {availableRoles.map((role) => (
                                    <button
                                        key={role}
                                        onClick={() => handleRoleToggle(role)}
                                        className={`px-4 py-2 rounded-lg border-2 transition-all tap-target ${
                                            filters.role.includes(role)
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-background border-gray-300 hover:border-primary"
                                        }`}
                                    >
                                        {role}
                                        {filters.role.includes(role) && " ✓"}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Score Range Filter */}
                    <div>
                        <label className="block text-sm font-medium mb-3">
                            Score Range: {filters.scoreRange.min} - {filters.scoreRange.max}
                        </label>
                        <div className="space-y-3">
                            <div className="flex gap-4 items-center">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={filters.scoreRange.min}
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            scoreRange: {
                                                ...prev.scoreRange,
                                                min: parseInt(e.target.value),
                                            },
                                        }))
                                    }
                                    className="flex-1"
                                />
                                <span className="text-sm w-12 text-right">
                                    {filters.scoreRange.min}
                                </span>
                            </div>
                            <div className="flex gap-4 items-center">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={filters.scoreRange.max}
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            scoreRange: {
                                                ...prev.scoreRange,
                                                max: parseInt(e.target.value),
                                            },
                                        }))
                                    }
                                    className="flex-1"
                                />
                                <span className="text-sm w-12 text-right">
                                    {filters.scoreRange.max}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                        <label className="block text-sm font-medium mb-3">Date Range</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">From</label>
                                <input
                                    type="date"
                                    value={
                                        filters.dateRange.from
                                            ? filters.dateRange.from.toISOString().split("T")[0]
                                            : ""
                                    }
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            dateRange: {
                                                ...prev.dateRange,
                                                from: e.target.value ? new Date(e.target.value) : null,
                                            },
                                        }))
                                    }
                                    className="w-full px-4 py-2 border rounded-lg bg-background tap-target"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">To</label>
                                <input
                                    type="date"
                                    value={
                                        filters.dateRange.to
                                            ? filters.dateRange.to.toISOString().split("T")[0]
                                            : ""
                                    }
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            dateRange: {
                                                ...prev.dateRange,
                                                to: e.target.value ? new Date(e.target.value) : null,
                                            },
                                        }))
                                    }
                                    className="w-full px-4 py-2 border rounded-lg bg-background tap-target"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

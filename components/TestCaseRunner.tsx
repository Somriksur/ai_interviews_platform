"use client";

import { useState } from "react";
import { Button } from "./ui/button";

export interface TestCase {
    id: string;
    input: string;
    expectedOutput: string;
    description?: string;
}

interface TestCaseRunnerProps {
    testCases: TestCase[];
    onRunTests: (code: string) => Promise<TestResult[]>;
    code: string;
    className?: string;
}

export interface TestResult {
    testCaseId: string;
    passed: boolean;
    actualOutput: string;
    expectedOutput: string;
    error?: string;
    executionTime?: number;
}

export default function TestCaseRunner({
    testCases,
    onRunTests,
    code,
    className = "",
}: TestCaseRunnerProps) {
    const [results, setResults] = useState<TestResult[]>([]);
    const [running, setRunning] = useState(false);

    const handleRunTests = async () => {
        setRunning(true);
        try {
            const testResults = await onRunTests(code);
            setResults(testResults);
        } catch (error) {
            console.error("Test execution error:", error);
        } finally {
            setRunning(false);
        }
    };

    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Test Cases</h3>
                <Button
                    onClick={handleRunTests}
                    disabled={running || !code.trim()}
                    className="tap-target"
                >
                    {running ? (
                        <>
                            <span className="animate-spin mr-2">⏳</span>
                            Running...
                        </>
                    ) : (
                        <>▶️ Run Tests</>
                    )}
                </Button>
            </div>

            {/* Test Cases List */}
            <div className="space-y-3">
                {testCases.map((testCase, index) => {
                    const result = results.find((r) => r.testCaseId === testCase.id);

                    return (
                        <div
                            key={testCase.id}
                            className={`card p-4 border-2 transition-colors ${
                                result
                                    ? result.passed
                                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                        : "border-red-500 bg-red-50 dark:bg-red-900/20"
                                    : "border-gray-300"
                            }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">Test Case {index + 1}</span>
                                        {result && (
                                            <span
                                                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                                    result.passed
                                                        ? "bg-green-500 text-white"
                                                        : "bg-red-500 text-white"
                                                }`}
                                            >
                                                {result.passed ? "✓ PASSED" : "✗ FAILED"}
                                            </span>
                                        )}
                                        {result?.executionTime && (
                                            <span className="text-xs text-gray-500">
                                                {result.executionTime}ms
                                            </span>
                                        )}
                                    </div>

                                    {testCase.description && (
                                        <p className="text-sm text-gray-600">
                                            {testCase.description}
                                        </p>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="font-medium text-gray-600">Input:</span>
                                            <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto">
                                                {testCase.input}
                                            </pre>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-600">
                                                Expected Output:
                                            </span>
                                            <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto">
                                                {testCase.expectedOutput}
                                            </pre>
                                        </div>
                                    </div>

                                    {result && !result.passed && (
                                        <div className="space-y-2">
                                            <div>
                                                <span className="font-medium text-red-600">
                                                    Actual Output:
                                                </span>
                                                <pre className="mt-1 p-2 bg-red-100 dark:bg-red-900/30 rounded overflow-x-auto text-sm">
                                                    {result.actualOutput}
                                                </pre>
                                            </div>
                                            {result.error && (
                                                <div>
                                                    <span className="font-medium text-red-600">
                                                        Error:
                                                    </span>
                                                    <pre className="mt-1 p-2 bg-red-100 dark:bg-red-900/30 rounded overflow-x-auto text-sm">
                                                        {result.error}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Results Summary */}
            {results.length > 0 && (
                <div
                    className={`card p-4 text-center ${
                        passedCount === totalCount
                            ? "bg-green-50 dark:bg-green-900/20 border-green-500"
                            : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500"
                    } border-2`}
                >
                    <div className="text-3xl font-bold mb-2">
                        {passedCount} / {totalCount}
                    </div>
                    <div className="text-sm text-gray-600">
                        {passedCount === totalCount
                            ? "🎉 All tests passed!"
                            : `${totalCount - passedCount} test(s) failed`}
                    </div>
                </div>
            )}

            {/* Help Text */}
            {testCases.length === 0 && (
                <div className="card p-6 text-center text-gray-500">
                    <div className="text-4xl mb-2">📝</div>
                    <p>No test cases available</p>
                </div>
            )}
        </div>
    );
}

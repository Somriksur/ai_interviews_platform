"use client";

import { useState } from "react";

interface InterviewSchedulerProps {
    onSchedule: (deadline: string, timeLimit: number) => void;
}

export default function InterviewScheduler({ onSchedule }: InterviewSchedulerProps) {
    const [deadline, setDeadline] = useState("");
    const [timeLimit, setTimeLimit] = useState(30); // minutes

    return (
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
            <h3 className="font-semibold">📅 Schedule & Time Limits</h3>
            
            <div>
                <label className="block text-sm font-medium mb-2">
                    Interview Deadline (Optional)
                </label>
                <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => {
                        setDeadline(e.target.value);
                        onSchedule(e.target.value, timeLimit);
                    }}
                    className="w-full p-3 border rounded-lg bg-background"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Candidate must complete before this date/time
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                    Time Limit: {timeLimit} minutes
                </label>
                <input
                    type="range"
                    min="10"
                    max="120"
                    step="5"
                    value={timeLimit}
                    onChange={(e) => {
                        setTimeLimit(Number(e.target.value));
                        onSchedule(deadline, Number(e.target.value));
                    }}
                    className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                    <span>10 min</span>
                    <span>120 min</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    Total time allowed for the interview
                </p>
            </div>
        </div>
    );
}

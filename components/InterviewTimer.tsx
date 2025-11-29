"use client";

import { useEffect, useState } from "react";

interface InterviewTimerProps {
    totalMinutes: number;
    onTimeUp: () => void;
}

export default function InterviewTimer({ totalMinutes, onTimeUp }: InterviewTimerProps) {
    const [secondsLeft, setSecondsLeft] = useState(totalMinutes * 60);
    const [isWarning, setIsWarning] = useState(false);

    useEffect(() => {
        if (secondsLeft <= 0) {
            onTimeUp();
            return;
        }

        // Warning when 5 minutes left
        if (secondsLeft <= 300 && !isWarning) {
            setIsWarning(true);
        }

        const timer = setInterval(() => {
            setSecondsLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [secondsLeft, onTimeUp, isWarning]);

    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;

    return (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
            isWarning ? "bg-red-500 text-white animate-pulse" : "bg-blue-500 text-white"
        }`}>
            <div className="text-sm font-semibold">Time Remaining</div>
            <div className="text-3xl font-bold">
                {minutes}:{seconds.toString().padStart(2, "0")}
            </div>
            {isWarning && (
                <div className="text-xs mt-1">⚠️ Hurry up!</div>
            )}
        </div>
    );
}

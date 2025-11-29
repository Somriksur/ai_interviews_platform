"use client";

interface InterviewProgressProps {
    current: number;
    total: number;
    timeSpent?: number;
}

export default function InterviewProgress({ current, total, timeSpent }: InterviewProgressProps) {
    const progress = (current / total) * 100;
    const remaining = total - current;

    return (
        <div className="w-full space-y-2">
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                    className="bg-blue-600 h-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Progress Info */}
            <div className="flex justify-between items-center text-sm">
                <div className="flex gap-4">
                    <span className="font-semibold">
                        Question {current} of {total}
                    </span>
                    <span className="text-gray-500">
                        {remaining} remaining
                    </span>
                </div>
                {timeSpent !== undefined && (
                    <span className="text-gray-500">
                        ⏱️ {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
                    </span>
                )}
            </div>

            {/* Progress Percentage */}
            <div className="text-center">
                <span className="text-2xl font-bold text-blue-600">
                    {Math.round(progress)}%
                </span>
                <span className="text-sm text-gray-500 ml-2">Complete</span>
            </div>
        </div>
    );
}

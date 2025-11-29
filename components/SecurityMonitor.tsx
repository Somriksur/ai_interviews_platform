"use client";

import { useEffect, useState } from "react";
import { SecurityMonitor } from "@/lib/security/anti-cheat";

interface SecurityMonitorProps {
    interviewId: string;
    candidateId: string;
    enabled?: boolean;
}

export default function SecurityMonitorComponent({
    interviewId,
    candidateId,
    enabled = true,
}: SecurityMonitorProps) {
    const [monitor, setMonitor] = useState<SecurityMonitor | null>(null);
    const [summary, setSummary] = useState<ReturnType<SecurityMonitor["getSummary"]> | null>(null);

    useEffect(() => {
        if (!enabled) return;

        const securityMonitor = new SecurityMonitor(interviewId, candidateId);
        securityMonitor.start();
        setMonitor(securityMonitor);

        // Update summary every 10 seconds
        const interval = setInterval(() => {
            setSummary(securityMonitor.getSummary());
        }, 10000);

        return () => {
            securityMonitor.stop();
            clearInterval(interval);
        };
    }, [interviewId, candidateId, enabled]);

    if (!enabled || !summary) return null;

    return (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 text-xs max-w-xs z-50">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-green-500">🔒</span>
                <span className="font-semibold">Security Active</span>
            </div>
            <div className="text-gray-600 dark:text-gray-400 space-y-1">
                <div>Events: {summary.totalEvents}</div>
                {summary.tabSwitches > 0 && (
                    <div className="text-yellow-600">
                        Tab switches: {summary.tabSwitches}
                    </div>
                )}
                {summary.highSeverityEvents > 0 && (
                    <div className="text-red-600">
                        High severity: {summary.highSeverityEvents}
                    </div>
                )}
            </div>
        </div>
    );
}

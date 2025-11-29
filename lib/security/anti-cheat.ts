/**
 * Anti-Cheating Security System
 * Monitors and detects suspicious behavior during interviews
 */

export type SecurityEventType =
    | "tab_switch"
    | "copy_attempt"
    | "paste_attempt"
    | "right_click"
    | "devtools_open"
    | "window_blur"
    | "suspicious_timing"
    | "multiple_devices";

export interface SecurityEvent {
    id: string;
    interviewId: string;
    candidateId: string;
    type: SecurityEventType;
    timestamp: Date;
    severity: "low" | "medium" | "high";
    details: Record<string, unknown>;
}

export interface SecurityConfig {
    enableTabSwitchDetection: boolean;
    enableCopyPasteDetection: boolean;
    enableDevToolsDetection: boolean;
    enableTimingAnalysis: boolean;
    maxTabSwitches: number;
    maxCopyAttempts: number;
    alertThreshold: number;
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
    enableTabSwitchDetection: true,
    enableCopyPasteDetection: true,
    enableDevToolsDetection: true,
    enableTimingAnalysis: true,
    maxTabSwitches: 5,
    maxCopyAttempts: 3,
    alertThreshold: 3,
};

/**
 * Security Monitor Class
 */
export class SecurityMonitor {
    private events: SecurityEvent[] = [];
    private config: SecurityConfig;
    private interviewId: string;
    private candidateId: string;
    private tabSwitchCount = 0;
    private copyAttemptCount = 0;
    private listeners: (() => void)[] = [];

    constructor(
        interviewId: string,
        candidateId: string,
        config: Partial<SecurityConfig> = {}
    ) {
        this.interviewId = interviewId;
        this.candidateId = candidateId;
        this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };
    }

    /**
     * Start monitoring
     */
    start() {
        if (this.config.enableTabSwitchDetection) {
            this.setupTabSwitchDetection();
        }

        if (this.config.enableCopyPasteDetection) {
            this.setupCopyPasteDetection();
        }

        if (this.config.enableDevToolsDetection) {
            this.setupDevToolsDetection();
        }

        this.setupRightClickDetection();
        this.setupWindowBlurDetection();
    }

    /**
     * Stop monitoring and cleanup
     */
    stop() {
        this.listeners.forEach((cleanup) => cleanup());
        this.listeners = [];
    }

    /**
     * Tab switch detection
     */
    private setupTabSwitchDetection() {
        const handler = () => {
            if (document.hidden) {
                this.tabSwitchCount++;
                this.logEvent("tab_switch", "medium", {
                    count: this.tabSwitchCount,
                    exceeded: this.tabSwitchCount > this.config.maxTabSwitches,
                });
            }
        };

        document.addEventListener("visibilitychange", handler);
        this.listeners.push(() =>
            document.removeEventListener("visibilitychange", handler)
        );
    }

    /**
     * Copy/Paste detection
     */
    private setupCopyPasteDetection() {
        const copyHandler = (e: ClipboardEvent) => {
            this.copyAttemptCount++;
            this.logEvent("copy_attempt", "low", {
                count: this.copyAttemptCount,
                exceeded: this.copyAttemptCount > this.config.maxCopyAttempts,
            });

            if (this.copyAttemptCount > this.config.maxCopyAttempts) {
                e.preventDefault();
                alert("⚠️ Excessive copy attempts detected. This has been logged.");
            }
        };

        const pasteHandler = (e: ClipboardEvent) => {
            this.logEvent("paste_attempt", "medium", {
                length: e.clipboardData?.getData("text").length || 0,
            });
        };

        document.addEventListener("copy", copyHandler);
        document.addEventListener("paste", pasteHandler);

        this.listeners.push(() => {
            document.removeEventListener("copy", copyHandler);
            document.removeEventListener("paste", pasteHandler);
        });
    }

    /**
     * DevTools detection (experimental)
     */
    private setupDevToolsDetection() {
        const threshold = 160;
        const check = () => {
            if (
                window.outerWidth - window.innerWidth > threshold ||
                window.outerHeight - window.innerHeight > threshold
            ) {
                this.logEvent("devtools_open", "high", {
                    widthDiff: window.outerWidth - window.innerWidth,
                    heightDiff: window.outerHeight - window.innerHeight,
                });
            }
        };

        const interval = setInterval(check, 1000);
        this.listeners.push(() => clearInterval(interval));
    }

    /**
     * Right-click detection
     */
    private setupRightClickDetection() {
        const handler = (e: MouseEvent) => {
            e.preventDefault();
            this.logEvent("right_click", "low", {
                x: e.clientX,
                y: e.clientY,
            });
        };

        document.addEventListener("contextmenu", handler);
        this.listeners.push(() =>
            document.removeEventListener("contextmenu", handler)
        );
    }

    /**
     * Window blur detection
     */
    private setupWindowBlurDetection() {
        const handler = () => {
            this.logEvent("window_blur", "low", {
                timestamp: new Date().toISOString(),
            });
        };

        window.addEventListener("blur", handler);
        this.listeners.push(() => window.removeEventListener("blur", handler));
    }

    /**
     * Log security event
     */
    private logEvent(
        type: SecurityEventType,
        severity: "low" | "medium" | "high",
        details: Record<string, unknown>
    ) {
        const event: SecurityEvent = {
            id: `${Date.now()}-${Math.random()}`,
            interviewId: this.interviewId,
            candidateId: this.candidateId,
            type,
            timestamp: new Date(),
            severity,
            details,
        };

        this.events.push(event);

        // Send to server
        this.sendEventToServer(event);

        // Check if alert threshold exceeded
        if (this.getHighSeverityCount() >= this.config.alertThreshold) {
            this.triggerAlert();
        }
    }

    /**
     * Send event to server
     */
    private async sendEventToServer(event: SecurityEvent) {
        try {
            await fetch("/api/security/log-event", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(event),
            });
        } catch (error) {
            console.error("Failed to log security event:", error);
        }
    }

    /**
     * Get high severity event count
     */
    private getHighSeverityCount(): number {
        return this.events.filter((e) => e.severity === "high").length;
    }

    /**
     * Trigger security alert
     */
    private triggerAlert() {
        console.warn("⚠️ Security Alert: Suspicious behavior detected");
        // Could show modal, send notification, etc.
    }

    /**
     * Get all events
     */
    getEvents(): SecurityEvent[] {
        return [...this.events];
    }

    /**
     * Get security summary
     */
    getSummary() {
        return {
            totalEvents: this.events.length,
            tabSwitches: this.tabSwitchCount,
            copyAttempts: this.copyAttemptCount,
            highSeverityEvents: this.getHighSeverityCount(),
            eventsByType: this.events.reduce((acc, event) => {
                acc[event.type] = (acc[event.type] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
        };
    }
}

/**
 * Analyze timing patterns for suspicious behavior
 */
export function analyzeTimingPatterns(
    answers: Array<{ questionId: string; timeSpent: number; answerLength: number }>
): { suspicious: boolean; reason?: string } {
    // Check for impossibly fast answers
    const avgTimePerChar = answers.map((a) =>
        a.answerLength > 0 ? a.timeSpent / a.answerLength : 0
    );

    const suspiciouslyFast = avgTimePerChar.some((time) => time < 0.1); // Less than 0.1 seconds per character

    if (suspiciouslyFast) {
        return {
            suspicious: true,
            reason: "Answers submitted too quickly (possible copy-paste)",
        };
    }

    // Check for consistent timing (bot-like behavior)
    const variance = calculateVariance(answers.map((a) => a.timeSpent));
    if (variance < 10 && answers.length > 3) {
        return {
            suspicious: true,
            reason: "Suspiciously consistent timing patterns",
        };
    }

    return { suspicious: false };
}

function calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map((n) => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
}

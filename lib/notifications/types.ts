/**
 * Notification Types and Interfaces
 */

export type NotificationType =
    | "interview_assigned"
    | "interview_completed"
    | "feedback_ready"
    | "interview_reminder"
    | "interview_deadline"
    | "system_update"
    | "team_invite";

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    createdAt: Date;
    metadata?: Record<string, unknown>;
}

export interface NotificationConfig {
    type: NotificationType;
    icon: string;
    color: string;
    soundEnabled: boolean;
}

export const NOTIFICATION_CONFIGS: Record<NotificationType, NotificationConfig> = {
    interview_assigned: {
        type: "interview_assigned",
        icon: "📧",
        color: "text-blue-600",
        soundEnabled: true,
    },
    interview_completed: {
        type: "interview_completed",
        icon: "✅",
        color: "text-green-600",
        soundEnabled: true,
    },
    feedback_ready: {
        type: "feedback_ready",
        icon: "📊",
        color: "text-purple-600",
        soundEnabled: true,
    },
    interview_reminder: {
        type: "interview_reminder",
        icon: "⏰",
        color: "text-yellow-600",
        soundEnabled: true,
    },
    interview_deadline: {
        type: "interview_deadline",
        icon: "⚠️",
        color: "text-red-600",
        soundEnabled: true,
    },
    system_update: {
        type: "system_update",
        icon: "🔔",
        color: "text-gray-600",
        soundEnabled: false,
    },
    team_invite: {
        type: "team_invite",
        icon: "👥",
        color: "text-indigo-600",
        soundEnabled: true,
    },
};

export interface NotificationPreferences {
    userId: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    soundEnabled: boolean;
    mutedTypes: NotificationType[];
}

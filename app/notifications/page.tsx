"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Notification, NOTIFICATION_CONFIGS } from "@/lib/notifications/types";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            // Get user ID from session/auth
            const userId = "current-user-id"; // Replace with actual user ID from auth

            const response = await fetch(`/api/notifications?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            await fetch(`/api/notifications/${notificationId}/read`, {
                method: "POST",
            });

            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === notificationId ? { ...n, read: true } : n
                )
            );
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        markAsRead(notification.id);
        if (notification.link) {
            router.push(notification.link);
        }
    };

    const filteredNotifications =
        filter === "unread"
            ? notifications.filter((n) => !n.read)
            : notifications;

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin text-4xl">⏳</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Notifications</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Stay updated with your interview activities
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setFilter("all")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors tap-target ${
                            filter === "all"
                                ? "bg-blue-600 text-white"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        }`}
                    >
                        All ({notifications.length})
                    </button>
                    <button
                        onClick={() => setFilter("unread")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors tap-target ${
                            filter === "unread"
                                ? "bg-blue-600 text-white"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        }`}
                    >
                        Unread ({notifications.filter((n) => !n.read).length})
                    </button>
                </div>

                {/* Notifications List */}
                <div className="space-y-3">
                    {filteredNotifications.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
                            <span className="text-6xl mb-4 block">📭</span>
                            <h3 className="text-xl font-semibold mb-2">
                                No notifications
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {filter === "unread"
                                    ? "You're all caught up!"
                                    : "You'll see notifications here when you have them"}
                            </p>
                        </div>
                    ) : (
                        filteredNotifications.map((notification) => {
                            const config = NOTIFICATION_CONFIGS[notification.type];
                            return (
                                <button
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`
                                        w-full bg-white dark:bg-gray-800 rounded-lg p-6
                                        hover:shadow-lg transition-all text-left
                                        ${!notification.read ? "border-l-4 border-blue-600" : ""}
                                    `}
                                >
                                    <div className="flex gap-4">
                                        <span className="text-3xl flex-shrink-0">
                                            {config.icon}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <h3 className="font-semibold text-lg">
                                                    {notification.title}
                                                </h3>
                                                {!notification.read && (
                                                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                                                        New
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                                                {notification.message}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {formatDate(notification.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

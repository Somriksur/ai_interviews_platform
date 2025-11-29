"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Notification, NOTIFICATION_CONFIGS } from "@/lib/notifications/types";

interface NotificationBellProps {
    userId: string;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const router = useRouter();

    useEffect(() => {
        // Load notifications from localStorage (temporary solution)
        const stored = localStorage.getItem(`notifications_${userId}`);
        if (stored) {
            const parsed = JSON.parse(stored);
            setNotifications(parsed);
            setUnreadCount(parsed.filter((n: Notification) => !n.read).length);
        }

        // Set up polling for new notifications (every 30 seconds)
        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000);

        return () => clearInterval(interval);
    }, [userId]);

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`/api/notifications?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
                
                // Store in localStorage
                localStorage.setItem(`notifications_${userId}`, JSON.stringify(data.notifications));
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
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
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch(`/api/notifications/mark-all-read`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        markAsRead(notification.id);
        if (notification.link) {
            router.push(notification.link);
        }
        setIsOpen(false);
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return "Just now";
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors tap-target"
                aria-label="Notifications"
            >
                <span className="text-2xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Notification Panel */}
                    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="font-semibold text-lg">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* Notification List */}
                        <div className="overflow-y-auto flex-1">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <span className="text-4xl mb-2 block">📭</span>
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((notification) => {
                                    const config = NOTIFICATION_CONFIGS[notification.type];
                                    return (
                                        <button
                                            key={notification.id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`
                                                w-full p-4 border-b border-gray-100 dark:border-gray-700
                                                hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                                                text-left
                                                ${!notification.read ? "bg-blue-50 dark:bg-blue-900/20" : ""}
                                            `}
                                        >
                                            <div className="flex gap-3">
                                                <span className="text-2xl flex-shrink-0">
                                                    {config.icon}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4 className="font-medium text-sm">
                                                            {notification.title}
                                                        </h4>
                                                        {!notification.read && (
                                                            <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        {formatTime(notification.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => {
                                    router.push("/notifications");
                                    setIsOpen(false);
                                }}
                                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 py-2"
                            >
                                View all notifications
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

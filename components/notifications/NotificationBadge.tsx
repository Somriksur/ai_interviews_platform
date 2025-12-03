"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  studentId: string;
  variant?: "count" | "dot";
  className?: string;
  showIcon?: boolean;
}

export function NotificationBadge({
  studentId,
  variant = "count",
  className,
  showIcon = false,
}: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [studentId]);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(
        `/api/students/${studentId}/notifications?read=false&limit=1`
      );

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.summary?.unread || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || unreadCount === 0) {
    return null;
  }

  if (variant === "dot") {
    return (
      <span
        className={cn(
          "absolute top-0 right-0 h-2 w-2 rounded-full bg-red-600",
          className
        )}
      />
    );
  }

  return (
    <Badge
      variant="destructive"
      className={cn(
        "flex items-center gap-1 px-2 py-1",
        className
      )}
    >
      {showIcon && <Bell className="h-3 w-3" />}
      {unreadCount > 99 ? "99+" : unreadCount}
    </Badge>
  );
}

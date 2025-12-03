"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";

interface StudentNavigationProps {
  studentId: string;
}

export function StudentNavigation({ studentId }: StudentNavigationProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="flex items-center gap-2 p-4 border-b bg-card">
      <Link href={`/student/${studentId}/dashboard`}>
        <Button 
          variant={isActive(`/student/${studentId}/dashboard`) ? "default" : "ghost"}
          className="gap-2"
        >
          📊 Dashboard
        </Button>
      </Link>

      <Link href={`/student/${studentId}/notifications`}>
        <Button 
          variant={isActive(`/student/${studentId}/notifications`) ? "default" : "ghost"}
          className="relative gap-2"
        >
          📧 Notifications
          <NotificationBadge studentId={studentId} variant="dot" />
        </Button>
      </Link>

      <Link href={`/student/${studentId}/profile`}>
        <Button 
          variant={isActive(`/student/${studentId}/profile`) ? "default" : "ghost"}
          className="gap-2"
        >
          👤 Profile
        </Button>
      </Link>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

interface CollegeNavigationProps {
  collegeId: string;
}

export function CollegeNavigation({ collegeId }: CollegeNavigationProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="flex items-center gap-2 p-4 border-b bg-card">
      <Link href={`/college/${collegeId}/dashboard`}>
        <Button 
          variant={isActive(`/college/${collegeId}/dashboard`) ? "default" : "ghost"}
          className="gap-2"
        >
          📊 Dashboard
        </Button>
      </Link>

      <Link href={`/college/${collegeId}/messages`}>
        <Button 
          variant={isActive(`/college/${collegeId}/messages`) ? "default" : "ghost"}
          className="gap-2"
        >
          📨 Messages
        </Button>
      </Link>

      <Link href={`/college/${collegeId}/registration-requests`}>
        <Button 
          variant={isActive(`/college/${collegeId}/registration-requests`) ? "default" : "ghost"}
          className="gap-2"
        >
          📝 Registration Requests
        </Button>
      </Link>

      <Link href={`/college/${collegeId}/students`}>
        <Button 
          variant={isActive(`/college/${collegeId}/students`) ? "default" : "ghost"}
          className="gap-2"
        >
          👥 Students
        </Button>
      </Link>

      <Link href={`/college/${collegeId}/drive-selections`}>
        <Button 
          variant={isActive(`/college/${collegeId}/drive-selections`) ? "default" : "ghost"}
          className="gap-2"
        >
          ✅ Selections
        </Button>
      </Link>

      <Link href={`/college/${collegeId}/job-notifications`}>
        <Button 
          variant={isActive(`/college/${collegeId}/job-notifications`) ? "default" : "ghost"}
          className="gap-2"
        >
          💼 Job Notifications
        </Button>
      </Link>
    </nav>
  );
}

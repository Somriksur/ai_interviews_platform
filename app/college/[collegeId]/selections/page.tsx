"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function SelectionsRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const collegeId = params.collegeId as string;

  useEffect(() => {
    // Redirect to drive-selections page
    router.replace(`/college/${collegeId}/drive-selections`);
  }, [collegeId, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to Student Selections...</p>
      </div>
    </div>
  );
}

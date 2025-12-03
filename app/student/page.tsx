"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentRedirect() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirectToStudentDashboard = async () => {
      try {
        // Try to get current user from session/auth
        const response = await fetch('/api/auth/me');
        
        if (!response.ok) {
          // Not authenticated, redirect to login
          router.push('/auth/sign-in');
          return;
        }

        const data = await response.json();
        const userData = data.user || data; // Handle both { user: {...} } and direct user object
        
        // Try to fetch student data using user ID
        const userId = userData.id || userData.uid;
        const userEmail = userData.email;
        
        console.log('👤 User data:', { userId, userEmail });
        
        const studentResponse = await fetch(`/api/students/by-user/${userId}`);
        
        if (studentResponse.ok) {
          const student = await studentResponse.json();
          // Redirect to student dashboard
          router.push(`/student/${student.id}/dashboard`);
        } else {
          // Student not found by userId, try to find by email
          console.log('🔍 Looking up student by email:', userEmail);
          const emailResponse = await fetch(`/api/students/by-email/${encodeURIComponent(userEmail)}`);
          console.log('📧 Email lookup response:', emailResponse.status);
          
          if (emailResponse.ok) {
            const student = await emailResponse.json();
            console.log('✅ Found student by email:', student.id);
            
            // Link this student record to the current user
            console.log('🔗 Linking student to userId:', userId);
            const updateResponse = await fetch(`/api/students/${student.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: userId }),
            });
            
            if (updateResponse.ok) {
              console.log('✅ Successfully linked student to user');
            } else {
              console.warn('⚠️ Failed to link student, but continuing anyway');
            }
            
            console.log('✅ Redirecting to dashboard');
            // Redirect to student dashboard
            router.push(`/student/${student.id}/dashboard`);
          } else {
            // Student not found at all
            console.error('❌ Student not found by email');
            console.log('📋 User data:', { email: userEmail, uid: userId });
            setError('Student profile not found. Please ensure you are using the email registered with your college.');
            setTimeout(() => {
              router.push('/auth/sign-in');
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Error fetching student:', error);
        setError('Error loading student profile. Redirecting to login...');
        setTimeout(() => {
          router.push('/auth/sign-in');
        }, 2000);
      }
    };

    redirectToStudentDashboard();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      {error ? (
        <>
          <div className="text-red-600 text-lg font-medium">{error}</div>
          <div className="text-sm text-muted-foreground">Redirecting...</div>
        </>
      ) : (
        <>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <div className="text-lg font-medium">Loading your dashboard...</div>
        </>
      )}
    </div>
  );
}

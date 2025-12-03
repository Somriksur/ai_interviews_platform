"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { auth } from "@/firebase/client";
import { onAuthStateChanged } from "firebase/auth";

export default function OnboardingPage() {
  const router = useRouter();
  const [role, setRole] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    location: "",
  });

  // Check if student record exists when role is student/candidate
  useEffect(() => {
    if (role === "student" || role === "candidate") {
      const checkStudentRecord = async () => {
        try {
          const response = await fetch(`/api/students/by-user/${userId}`);
          if (response.ok) {
            const studentData = await response.json();
            if (studentData.id) {
              toast.success(`Welcome back, ${studentData.name}!`);
              window.location.href = `/student/${studentData.id}/dashboard`;
              return;
            }
          }
          // No student record found - show message
          setLoading(false);
        } catch (error) {
          console.error("Error checking student record:", error);
          setLoading(false);
        }
      };
      checkStudentRecord();
    }
  }, [role, userId]);

  useEffect(() => {
    // Listen to Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.log("No user signed in, redirecting...");
        router.push("/auth/sign-in?redirect=/onboarding");
        return;
      }

      console.log("User signed in:", user.uid);
      setUserId(user.uid);

      try {
        // Get user data from Firestore
        const response = await fetch(`/api/users/${user.uid}`);
        if (response.ok) {
          const userData = await response.json();
          console.log("User data loaded:", userData);
          setRole(userData.role || "");
          
          // Check if organization/college already exists for this user
          if (userData.role === "organization") {
            const orgResponse = await fetch(`/api/organization/by-admin/${user.uid}`);
            if (orgResponse.ok) {
              const orgData = await orgResponse.json();
              if (orgData.id) {
                console.log("Organization already exists, redirecting...");
                toast.success(`Welcome back, ${orgData.name}!`);
                window.location.href = `/organization/${orgData.id}/dashboard`;
                return;
              }
            }
          } else if (userData.role === "college") {
            const collegeResponse = await fetch(`/api/colleges/by-admin/${user.uid}`);
            if (collegeResponse.ok) {
              const collegeData = await collegeResponse.json();
              if (collegeData.id) {
                console.log("College already exists, redirecting...");
                toast.success(`Welcome back, ${collegeData.name}!`);
                window.location.href = `/college/${collegeData.id}/dashboard`;
                return;
              }
            }
          }
          
          // Pre-fill form
          setFormData({
            name: userData.name || "",
            email: userData.email || user.email || "",
            phone: "",
            address: "",
            location: "",
          });
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (role === "organization") {
        console.log("Creating organization...");
        const response = await fetch("/api/organization/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            adminId: userId,
          }),
        });

        const data = await response.json();
        console.log("Organization response:", data);
        
        if (data.id) {
          toast.success("Organization created successfully!");
          setTimeout(() => {
            window.location.href = `/organization/${data.id}/dashboard`;
          }, 1000);
        } else {
          toast.error(data.error || "Failed to create organization");
        }
      } else if (role === "college") {
        console.log("Creating college...");
        
        // Step 1: Create parent organization
        const orgResponse = await fetch("/api/organization/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${formData.name} Organization`,
            email: formData.email,
            phone: formData.phone,
            address: formData.location || formData.address,
            adminId: userId,
          }),
        });

        const orgData = await orgResponse.json();
        console.log("Organization response:", orgData);
        
        if (!orgData.id) {
          toast.error(orgData.error || "Failed to create organization");
          return;
        }

        // Step 2: Create college
        const collegeResponse = await fetch(`/api/organization/${orgData.id}/colleges`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            location: formData.location || formData.address,
            contactEmail: formData.email,
            contactPhone: formData.phone,
            adminId: userId,
          }),
        });

        const collegeData = await collegeResponse.json();
        console.log("College response:", collegeData);
        
        if (collegeData.id) {
          toast.success("College created successfully!");
          setTimeout(() => {
            window.location.href = `/college/${collegeData.id}/dashboard`;
          }, 1000);
        } else {
          toast.error(collegeData.error || "Failed to create college");
        }
      }
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Handle student/candidate role - redirect to student dashboard
  if (role === "student" || role === "candidate") {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading student profile...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="card-border max-w-2xl w-full">
          <div className="card p-8">
            <h2 className="text-2xl font-bold mb-4 text-center">Welcome, Student!</h2>
            <p className="text-center mb-6">
              To access the campus placement system, you need to register with your college.
            </p>

            <div className="space-y-4 mb-6">
              <div className="p-4 border rounded-lg bg-blue-50">
                <h3 className="font-semibold mb-2">📝 New Registration</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Submit a registration request to your college. College administrators will review and approve your request.
                </p>
                <Button 
                  onClick={() => router.push("/student/register")}
                  className="w-full"
                >
                  Register with College
                </Button>
              </div>

              <div className="p-4 border rounded-lg bg-green-50">
                <h3 className="font-semibold mb-2">🔍 Check Status</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Already submitted a registration request? Check your approval status here.
                </p>
                <Button 
                  onClick={() => router.push("/student/check-status")}
                  variant="outline"
                  className="w-full"
                >
                  Check Registration Status
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
              <p className="font-medium mb-2">How it works:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Submit your registration request with college details</li>
                <li>College administrators review your request</li>
                <li>Once approved, you can sign in and access your dashboard</li>
                <li>Start taking AI-powered interview practice sessions</li>
              </ol>
            </div>

            <div className="mt-6 text-center">
              <Button 
                onClick={() => router.push("/auth/sign-in")}
                variant="ghost"
              >
                Back to Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!role || (role !== "organization" && role !== "college")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Invalid Role</h2>
          <p className="mb-4">Please select a valid role during sign up.</p>
          <Button onClick={() => router.push("/auth/sign-in")}>
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  const isCollege = role === "college";

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="card-border max-w-2xl w-full">
        <div className="card p-8">
          <h2 className="text-2xl font-bold mb-2">
            Complete Your {isCollege ? "College" : "Organization"} Profile
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Fill in the details below to set up your {isCollege ? "college" : "organization"} account
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {isCollege ? "College" : "Organization"} Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border rounded-lg bg-background"
                placeholder={isCollege ? "Engineering College" : "Tech University"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-3 border rounded-lg bg-background"
                placeholder="admin@example.edu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-3 border rounded-lg bg-background"
                placeholder="1234567890"
              />
            </div>

            {isCollege ? (
              <div>
                <label className="block text-sm font-medium mb-2">Location *</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-3 border rounded-lg bg-background"
                  placeholder="City, State"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">Address *</label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-3 border rounded-lg bg-background"
                  placeholder="123 University Ave, Tech City"
                  rows={3}
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Creating..." : `Create ${isCollege ? "College" : "Organization"}`}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

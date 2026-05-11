"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { auth } from "@/firebase/client";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword
} from "firebase/auth";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/onboarding";
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student" as "organization" | "college" | "student" | "candidate",
  });

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const normalizedEmail = formData.email.trim().toLowerCase();
    const password = formData.password;

    try {
      if (isSignUp) {
        // Sign up with Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          normalizedEmail,
          password
        );

        // Create user in Firestore
        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: userCredential.user.uid,
            name: formData.name,
            email: normalizedEmail,
            role: formData.role,
          }),
        });

        const result = await registerResponse.json();

        if (result.success) {
          toast.success("Account created successfully!");
          
          // Get ID token and sign in
          const idToken = await userCredential.user.getIdToken();
          const sessionResponse = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: normalizedEmail,
              idToken,
              uid: userCredential.user.uid,
              name: formData.name || userCredential.user.displayName || normalizedEmail.split("@")[0],
              role: formData.role,
            }),
          });
          const signInResult = await sessionResponse.json();

          if (signInResult.success) {
            router.push(redirect);
          } else {
            toast.error(signInResult.message);
          }
        } else {
          toast.error(result.message);
        }
      } else {
        // Sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(
          auth,
          normalizedEmail,
          password
        );

        // Get ID token and create session
        const idToken = await userCredential.user.getIdToken();
        const sessionResponse = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: normalizedEmail,
            idToken,
            uid: userCredential.user.uid,
            name: userCredential.user.displayName || normalizedEmail.split("@")[0],
            role: "student",
          }),
        });
        const result = await sessionResponse.json();

        if (result.success) {
          toast.success("Signed in successfully!");
          
          // Redirect based on role
          if (result.user?.role === "student") {
            router.push("/student");
          } else {
            router.push(redirect);
          }
        } else {
          toast.error(result.message);
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      
      if (error.code === "auth/user-not-found") {
        toast.error("No account found with this email. Please sign up first.");
      } else if (error.code === "auth/wrong-password") {
        toast.error("Incorrect password. Please try again.");
      } else if (error.code === "auth/invalid-credential") {
        toast.error("Invalid email or password. Please check and try again.");
      } else if (error.code === "auth/email-already-in-use") {
        toast.error("This email is already in use. Please sign in instead.");
      } else if (error.code === "auth/invalid-email") {
        toast.error("Invalid email address.");
      } else if (error.code === "auth/weak-password") {
        toast.error("Password should be at least 6 characters.");
      } else {
        toast.error(error.message || "Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Full-screen gradient background - Warm Light / Comfortable Dark */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#faf9f7] via-[#f5f5f7] to-[#e8e8ed] dark:from-[#1c1c1e] dark:via-[#2c2c2e] dark:to-[#3a3a3c]" />
      
      {/* Animated background elements - Apple colors */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#007aff]/20 dark:bg-[#0a84ff]/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#34c759]/20 dark:bg-[#32d74b]/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#af52de]/20 dark:bg-[#bf5af2]/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        <Card className="w-full p-8 backdrop-blur-xl bg-white/80 dark:bg-[#2c2c2e]/80 shadow-2xl border border-[#d2d2d7]/50 dark:border-[#38383a]/50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#007aff] to-[#5856d6] dark:from-[#0a84ff] dark:to-[#5e5ce6] mb-4 shadow-lg">
              <span className="text-3xl">🎓</span>
            </div>
            <h1 className="text-3xl font-semibold mb-2 bg-gradient-to-r from-[#007aff] to-[#5856d6] dark:from-[#0a84ff] dark:to-[#5e5ce6] bg-clip-text text-transparent">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-[#86868b] dark:text-[#98989d]">
              {isSignUp
                ? "Sign up to get started with the campus placement system"
                : "Sign in to your account"}
            </p>
          </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as "organization" | "college" | "student" | "candidate",
                    })
                  }
                  className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="student">Student</option>
                  <option value="college">College Administrator</option>
                  <option value="organization">Organization/Recruiter</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#007aff] hover:text-[#0066d6] dark:text-[#0a84ff] dark:hover:text-[#0077ed] font-medium"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>

        {!isSignUp && (
          <div className="mt-4 text-center">
            <Link
              href="/student/register"
              className="text-sm text-[#86868b] hover:text-[#1d1d1f] dark:text-[#98989d] dark:hover:text-[#f5f5f7]"
            >
              New student? Register with your college →
            </Link>
          </div>
        )}
      </Card>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900" />}>
      <SignInContent />
    </Suspense>
  );
}

"use server";

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";

// Session duration (1 week)
const SESSION_DURATION = 60 * 60 * 24 * 7;

// Set session cookie for client
export async function setSessionCookie(idToken: string) {
    const cookieStore = await cookies();

    const sessionCookie = await auth.createSessionCookie(idToken, {
        expiresIn: SESSION_DURATION * 1000,
    });

    cookieStore.set("session", sessionCookie, {
        maxAge: SESSION_DURATION,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax",
    });
}

// User sign-up logic
export async function signUp(params: SignUpParams) {
    const { uid, name, email, role } = params;

    try {
        console.log("Creating user:", { uid, name, email, role });
        
        const userRecord = await db.collection("users").doc(uid).get();
        if (userRecord.exists) {
            console.log("User already exists");
            return {
                success: false,
                message: "User already exists. Please sign in.",
            };
        }

        const userData = {
            name,
            email,
            role: role || "candidate",
            createdAt: new Date().toISOString(),
        };

        console.log("Saving user data:", userData);
        await db.collection("users").doc(uid).set(userData);
        console.log("User created successfully");

        return {
            success: true,
            message: "Account created successfully. Please sign in.",
        };
    } catch (error) {
        // Type-safe error handling (no explicit any)
        console.error("Error creating user:", error);

        const firebaseError =
            typeof error === "object" && error && "code" in error
                ? (error as { code: string })
                : null;

        if (firebaseError?.code === "auth/email-already-exists") {
            return {
                success: false,
                message: "This email is already in use.",
            };
        }

        return {
            success: false,
            message: "Failed to create account. Please try again.",
        };
    }
}

// User sign-in logic
export async function signIn(params: SignInParams) {
    const { email, idToken } = params;

    try {
        console.log("Signing in user:", email);
        
        const userRecord = await auth.getUserByEmail(email);
        if (!userRecord) {
            console.error("User not found:", email);
            return {
                success: false,
                message: "User does not exist. Please create an account first.",
            };
        }

        console.log("User found:", userRecord.uid);

        // Get user data from Firestore
        const userDoc = await db.collection("users").doc(userRecord.uid).get();
        if (!userDoc.exists) {
            console.error("User document not found in Firestore");
            return {
                success: false,
                message: "User data not found. Please contact support.",
            };
        }

        const userData = userDoc.data();
        console.log("User data retrieved:", { role: userData?.role, name: userData?.name });

        // Set session cookie
        await setSessionCookie(idToken);
        console.log("Session cookie set");

        const user = {
            id: userRecord.uid,
            email: userRecord.email || email,
            name: userData?.name || "",
            role: userData?.role || "candidate",
        };

        console.log("Returning user:", user);

        return { 
            success: true, 
            message: "Signed in successfully.",
            user
        };
    } catch (error) {
        console.error("Sign-in error:", error);

        return {
            success: false,
            message: "Failed to log into account. Please try again.",
        };
    }
}

// Sign out by clearing the cookie
export async function signOut() {
    const cookieStore = await cookies();
    cookieStore.delete("session");
}

// Get currently logged-in user
export async function getCurrentUser(): Promise<User | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    
    if (!sessionCookie) {
        console.log("No session cookie found");
        return null;
    }

    try {
        console.log("Verifying session cookie...");
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
        console.log("Session verified for user:", decodedClaims.uid);

        const userRecord = await db.collection("users").doc(decodedClaims.uid).get();
        if (!userRecord.exists) {
            console.error("User document not found:", decodedClaims.uid);
            return null;
        }

        const userData = {
            ...userRecord.data(),
            id: userRecord.id,
        } as User;

        console.log("Current user:", { id: userData.id, role: userData.role });
        return userData;
    } catch (error) {
        console.error("Session verification failed:", error);
        // Don't return a fallback user - return null to force re-login
        return null;
    }
}

// Check if user is authenticated
export async function isAuthenticated() {
    const user = await getCurrentUser();
    return !!user;
}

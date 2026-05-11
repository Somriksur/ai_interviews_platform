"use server";

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";

// Session duration (1 week)
const SESSION_DURATION = 60 * 60 * 24 * 7;
const APP_SESSION_COOKIE = "app_session";

function decodeJwtPayload<T>(token: string): T | null {
    try {
        const [, payload] = token.split(".");
        if (!payload) {
            return null;
        }

        const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
        const decoded = Buffer.from(normalizedPayload, "base64").toString("utf8");
        return JSON.parse(decoded) as T;
    } catch (error) {
        console.warn("Failed to decode JWT payload", error);
        return null;
    }
}

async function setDevSessionCookie(user: User) {
    const cookieStore = await cookies();

    cookieStore.set(APP_SESSION_COOKIE, JSON.stringify(user), {
        maxAge: SESSION_DURATION,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax",
    });
}

function buildFallbackUser(params: SignInParams, decodedToken?: {
    user_id?: string;
    email?: string;
    name?: string;
}) {
    return {
        id: params.uid || decodedToken?.user_id || "",
        email: decodedToken?.email || params.email,
        name: params.name || decodedToken?.name || params.email.split("@")[0],
        role: params.role || "student",
    } satisfies User;
}

async function clearDevSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(APP_SESSION_COOKIE);
}

async function getDevSessionUser(): Promise<User | null> {
    const cookieStore = await cookies();
    const serializedUser = cookieStore.get(APP_SESSION_COOKIE)?.value;

    if (!serializedUser) {
        return null;
    }

    try {
        return JSON.parse(serializedUser) as User;
    } catch (error) {
        console.warn("Failed to parse dev session cookie", error);
        cookieStore.delete(APP_SESSION_COOKIE);
        return null;
    }
}

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
    cookieStore.delete(APP_SESSION_COOKIE);
}

// User sign-up logic
export async function signUp(params: SignUpParams) {
    const { uid, name, email, role } = params;

    try {
        console.log("Creating user:", { uid, name, email, role });
        
        // Validate role - organization, college, and student allowed
        if (role !== "organization" && role !== "college" && role !== "student" && role !== "candidate") {
            return {
                success: false,
                message: "Invalid role. Please select Organization, College, or Student.",
            };
        }
        
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
            role,
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

        const decodedToken = decodeJwtPayload<{
            user_id?: string;
            email?: string;
            name?: string;
        }>(idToken);

        const fallbackUser = buildFallbackUser(params, decodedToken || undefined);
        if (!fallbackUser.id) {
            return {
                success: false,
                message: "Unable to resolve user session from login token.",
            };
        }

        let user = fallbackUser;

        try {
            const userDoc = await db.collection("users").doc(fallbackUser.id).get();

            if (userDoc.exists) {
                const userData = userDoc.data() as Partial<User> | undefined;
                user = {
                    ...fallbackUser,
                    name: userData?.name || fallbackUser.name,
                    email: userData?.email || fallbackUser.email,
                    role: userData?.role || fallbackUser.role,
                    organizationId: userData?.organizationId,
                    collegeId: userData?.collegeId,
                    createdAt: userData?.createdAt,
                };
            } else {
                console.warn("User profile not found in Firestore during sign-in, using token payload.");
            }
        } catch (profileError) {
            console.warn("User profile lookup failed during sign-in; using fallback user.", profileError);
        }

        await setDevSessionCookie(user);

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
    await clearDevSessionCookie();
}

function isRetryableSessionVerificationError(error: unknown) {
    if (!(error instanceof Error)) {
        return false;
    }

    const message = error.message.toLowerCase();

    return (
        message.includes("timeout") ||
        message.includes("etimedout") ||
        message.includes("enotfound") ||
        message.includes("dns") ||
        message.includes("network") ||
        message.includes("econnreset") ||
        message.includes("unavailable")
    );
}

async function verifySessionCookieWithFallback(sessionCookie: string) {
    try {
        return await auth.verifySessionCookie(sessionCookie, true);
    } catch (error) {
        if (!isRetryableSessionVerificationError(error)) {
            throw error;
        }

        console.warn(
            "Session revocation check timed out; retrying with signature-only verification.",
            error
        );

        return auth.verifySessionCookie(sessionCookie, false);
    }
}

// Get currently logged-in user
export async function getCurrentUser(): Promise<User | null> {
    const appUser = await getDevSessionUser();
    if (appUser) {
        console.log("Using app session for user:", appUser.id);
        return appUser;
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    
    if (!sessionCookie) {
        console.log("No session cookie found");
        return null;
    }

    try {
        console.log("Verifying session cookie...");
        const decodedClaims = await verifySessionCookieWithFallback(sessionCookie);
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
        return null;
    }
}

// Check if user is authenticated
export async function isAuthenticated() {
    const user = await getCurrentUser();
    return !!user;
}

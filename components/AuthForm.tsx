"use client";

import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { auth } from "@/firebase/client";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from "firebase/auth";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { signIn, signUp } from "@/lib/actions/auth.action";
import FormField from "./FromField"; // ✅ Correct import

type FormType = "sign-in" | "sign-up";

const authFormSchema = (type: FormType) =>
    z.object({
        name:
            type === "sign-up"
                ? z.string().min(3, "Name is too short")
                : z.string().optional(),
        email: z.string().email("Invalid email"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        role:
            type === "sign-up"
                ? z.enum(["recruiter", "candidate"])
                : z.string().optional(),
    });

const AuthForm = ({ type }: { type: FormType }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect");

    const formSchema = authFormSchema(type);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            role: "candidate",
        },
    });

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        try {
            if (type === "sign-up") {
                const { name, email, password, role } = data;

                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                const result = await signUp({
                    uid: userCredential.user.uid,
                    name: name!,
                    email,
                    password,
                    role: role as "recruiter" | "candidate",
                });

                if (!result.success) {
                    toast.error(result.message || "Sign-up failed. Try again.");
                    return;
                }

                toast.success("Account created successfully. Please sign in.");
                router.push("/auth/sign-in");
            } else {
                const { email, password } = data;

                const userCredential = await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                const idToken = await userCredential.user.getIdToken();
                if (!idToken) {
                    toast.error("Sign-in failed. Please try again.");
                    return;
                }

                const result = await signIn({ email, idToken });
                
                if (!result.success) {
                    toast.error(result.message || "Sign-in failed. Try again.");
                    return;
                }

                console.log("Sign-in successful, user:", result.user);
                toast.success("Signed in successfully.");

                // Redirect to the specified URL or default based on user role
                const defaultRedirect = result.user?.role === "recruiter" 
                    ? "/recruiter/dashboard" 
                    : "/candidate/dashboard";
                
                const finalRedirect = redirectUrl || defaultRedirect;
                
                console.log("🔄 Redirecting to:", finalRedirect);
                
                // Use window.location for full page reload to ensure session is loaded
                window.location.href = finalRedirect;
            }
        } catch (error: unknown) {
            if (typeof error === "object" && error !== null && "code" in error) {
                const firebaseError = error as { code?: string; message?: string };

                switch (firebaseError.code) {
                    case "auth/email-already-in-use":
                        toast.error("This email is already registered. Please sign in instead.");
                        break;
                    case "auth/invalid-email":
                        toast.error("Invalid email address.");
                        break;
                    case "auth/weak-password":
                        toast.error("Password should be at least 6 characters.");
                        break;
                    case "auth/user-not-found":
                        toast.error("No account found with this email.");
                        break;
                    case "auth/wrong-password":
                        toast.error("Incorrect password. Try again.");
                        break;
                    default:
                        console.error("Unhandled Firebase Auth error:", firebaseError);
                        toast.error(firebaseError.message || "Unexpected error occurred. Try again.");
                        break;
                }
            } else {
                console.error("Unknown error type:", error);
                toast.error("Unexpected error occurred. Try again.");
            }
        }
    };

    const isSignIn = type === "sign-in";

    return (
        <div className="card-border lg:min-w-[566px]">
            <div className="flex flex-col gap-6 card py-14 px-10">
                <div className="flex flex-col justify-center items-center -space-y-2">
                    <Image 
                        src="/logo.svg" 
                        alt="logo" 
                        height={160} 
                        width={189} 
                        className="brightness-150 contrast-125"
                    />
                    <h2 className="text-primary-100">HireFlow</h2>
                </div>

                <h3>Practice job interviews with AI</h3>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="w-full space-y-6 mt-4 form"
                    >
                        {!isSignIn && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="name"
                                    label="Name"
                                    placeholder="Your Name"
                                    type="text"
                                />
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">I am a</label>
                                    <select
                                        {...form.register("role")}
                                        className="w-full p-3 border rounded-lg bg-background"
                                    >
                                        <option value="candidate">Candidate (Taking Interviews)</option>
                                        <option value="recruiter">Recruiter (Creating Interviews)</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <FormField
                            control={form.control}
                            name="email"
                            label="Email"
                            placeholder="Your email address"
                            type="email"
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            label="Password"
                            placeholder="Enter your password"
                            type="password"
                        />

                        <Button className="btn" type="submit">
                            {isSignIn ? "Sign In" : "Create an Account"}
                        </Button>
                    </form>
                </Form>

                <p className="text-center">
                    {isSignIn ? "No account yet?" : "Have an account already?"}
                    <Link
                        href={!isSignIn ? "/auth/sign-in" : "/auth/sign-up"}
                        className="font-bold text-user-primary ml-1"
                    >
                        {!isSignIn ? "Sign In" : "Sign Up"}
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default AuthForm;

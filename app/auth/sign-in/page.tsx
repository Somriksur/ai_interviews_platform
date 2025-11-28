import AuthForm from "@/components/AuthForm";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

const Page = () => {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
            <AuthForm type="sign-in" />
        </Suspense>
    );
};

export default Page;

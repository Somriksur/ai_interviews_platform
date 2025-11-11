import { Toaster } from "sonner";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "HireFlow - AI-Powered Voice Interviews",
    description: "AI-powered voice interview platform with intelligent feedback. Streamline your hiring process with HireFlow.",
    icons: {
        icon: [
            { url: '/favicon.ico' },
            { url: '/logo.svg', type: 'image/svg+xml' },
        ],
        apple: '/logo.svg',
    },
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
        <body className="antialiased pattern font-sans">
        {children}
        <Toaster />
        </body>
        </html>
    );
}

import { Toaster } from "sonner";
import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";
import { ThemeProvider } from "@/components/theme-provider";

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
        <html lang="en" suppressHydrationWarning>
        <body className="antialiased pattern font-sans transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              classNames: {
                toast: 'bg-background border-border',
                title: 'text-foreground',
                description: 'text-muted-foreground',
              },
            }}
          />
          <ThemeToggle />
        </ThemeProvider>
        </body>
        </html>
    );
}

export default function AuthLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <main className="flex min-h-screen justify-center items-center bg-background">
            {children}
        </main>
    );
}

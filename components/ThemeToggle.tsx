"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";

export default function ThemeToggle() {
    const [theme, setTheme] = useState<"light" | "dark">("light");

    useEffect(() => {
        // Check system preference or saved preference
        const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        const initialTheme = savedTheme || systemTheme;
        
        setTheme(initialTheme);
        document.documentElement.classList.toggle("dark", initialTheme === "dark");
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
    };

    return (
        <Button
            onClick={toggleTheme}
            variant="outline"
            size="sm"
            className="fixed bottom-4 right-4 rounded-full w-12 h-12 shadow-lg"
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
            {theme === "light" ? "🌙" : "☀️"}
        </Button>
    );
}

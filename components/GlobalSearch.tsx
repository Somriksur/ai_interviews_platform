"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useHotkeys } from "react-hotkeys-hook";

interface GlobalSearchProps {
    onClose?: () => void;
}

export default function GlobalSearch({ onClose }: GlobalSearchProps) {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Keyboard shortcut: Cmd+K or Ctrl+K
    useHotkeys("mod+k", (e) => {
        e.preventDefault();
        setIsOpen(true);
    });

    // Close on Escape
    useHotkeys("escape", () => {
        if (isOpen) {
            setIsOpen(false);
            onClose?.();
        }
    });

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSearch = () => {
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query)}`);
            setIsOpen(false);
            onClose?.();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent transition-colors tap-target"
            >
                <span>🔍</span>
                <span className="hide-mobile">Search</span>
                <kbd className="hide-mobile px-2 py-1 text-xs bg-muted rounded">
                    ⌘K
                </kbd>
            </button>
        );
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-50 animate-fadeIn"
                onClick={() => {
                    setIsOpen(false);
                    onClose?.();
                }}
            />

            {/* Search Modal */}
            <div className="fixed inset-x-4 top-20 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-2xl z-50 animate-fadeIn">
                <div className="card p-4 shadow-2xl">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🔍</span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search interviews, candidates, questions..."
                            className="flex-1 bg-transparent outline-none text-lg"
                        />
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                onClose?.();
                            }}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>

                    {query && (
                        <div className="mt-4 pt-4 border-t">
                            <button
                                onClick={handleSearch}
                                className="w-full text-left px-4 py-3 hover:bg-accent rounded-lg transition-colors"
                            >
                                Search for "<strong>{query}</strong>"
                            </button>
                        </div>
                    )}

                    <div className="mt-4 text-xs text-gray-500 flex items-center justify-between">
                        <span>Press Enter to search</span>
                        <span>ESC to close</span>
                    </div>
                </div>
            </div>
        </>
    );
}

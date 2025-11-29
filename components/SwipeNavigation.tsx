"use client";

import { useState, useRef, useEffect, ReactNode } from "react";

interface SwipeNavigationProps {
    children: ReactNode[];
    onSwipe?: (index: number) => void;
    className?: string;
}

export default function SwipeNavigation({ 
    children, 
    onSwipe,
    className = "" 
}: SwipeNavigationProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const minSwipeDistance = 50;

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(0); // Reset
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && currentIndex < children.length - 1) {
            const newIndex = currentIndex + 1;
            setCurrentIndex(newIndex);
            onSwipe?.(newIndex);
        }

        if (isRightSwipe && currentIndex > 0) {
            const newIndex = currentIndex - 1;
            setCurrentIndex(newIndex);
            onSwipe?.(newIndex);
        }
    };

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTo({
                left: currentIndex * containerRef.current.offsetWidth,
                behavior: "smooth",
            });
        }
    }, [currentIndex]);

    return (
        <div className={`relative ${className}`}>
            <div
                ref={containerRef}
                className="swipeable flex overflow-x-auto"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {children.map((child, index) => (
                    <div
                        key={index}
                        className="min-w-full flex-shrink-0"
                    >
                        {child}
                    </div>
                ))}
            </div>

            {/* Pagination dots */}
            {children.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    {children.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setCurrentIndex(index);
                                onSwipe?.(index);
                            }}
                            className={`h-2 rounded-full transition-all ${
                                index === currentIndex
                                    ? "w-8 bg-primary"
                                    : "w-2 bg-gray-400"
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Navigation arrows (hidden on mobile) */}
            {children.length > 1 && (
                <>
                    <button
                        onClick={() => {
                            if (currentIndex > 0) {
                                const newIndex = currentIndex - 1;
                                setCurrentIndex(newIndex);
                                onSwipe?.(newIndex);
                            }
                        }}
                        disabled={currentIndex === 0}
                        className="hide-mobile absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Previous"
                    >
                        ←
                    </button>
                    <button
                        onClick={() => {
                            if (currentIndex < children.length - 1) {
                                const newIndex = currentIndex + 1;
                                setCurrentIndex(newIndex);
                                onSwipe?.(newIndex);
                            }
                        }}
                        disabled={currentIndex === children.length - 1}
                        className="hide-mobile absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Next"
                    >
                        →
                    </button>
                </>
            )}
        </div>
    );
}

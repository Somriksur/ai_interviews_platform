/**
 * Touch Gesture Utilities for Mobile Interactions
 */

export interface TouchPosition {
    x: number;
    y: number;
}

export interface SwipeEvent {
    direction: "left" | "right" | "up" | "down";
    distance: number;
    velocity: number;
}

export class TouchGestureHandler {
    private touchStart: TouchPosition | null = null;
    private touchEnd: TouchPosition | null = null;
    private touchStartTime: number = 0;
    private minSwipeDistance: number;
    private minSwipeVelocity: number;

    constructor(minSwipeDistance = 50, minSwipeVelocity = 0.3) {
        this.minSwipeDistance = minSwipeDistance;
        this.minSwipeVelocity = minSwipeVelocity;
    }

    handleTouchStart(e: TouchEvent | React.TouchEvent): void {
        this.touchEnd = null;
        this.touchStart = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
        };
        this.touchStartTime = Date.now();
    }

    handleTouchMove(e: TouchEvent | React.TouchEvent): void {
        this.touchEnd = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
        };
    }

    handleTouchEnd(): SwipeEvent | null {
        if (!this.touchStart || !this.touchEnd) return null;

        const deltaX = this.touchStart.x - this.touchEnd.x;
        const deltaY = this.touchStart.y - this.touchEnd.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const duration = Date.now() - this.touchStartTime;
        const velocity = distance / duration;

        // Check if swipe meets minimum requirements
        if (distance < this.minSwipeDistance || velocity < this.minSwipeVelocity) {
            return null;
        }

        // Determine swipe direction
        const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
        let direction: "left" | "right" | "up" | "down";

        if (isHorizontal) {
            direction = deltaX > 0 ? "left" : "right";
        } else {
            direction = deltaY > 0 ? "up" : "down";
        }

        return {
            direction,
            distance,
            velocity,
        };
    }

    reset(): void {
        this.touchStart = null;
        this.touchEnd = null;
        this.touchStartTime = 0;
    }
}

/**
 * Detect if device supports touch
 */
export function isTouchDevice(): boolean {
    if (typeof window === "undefined") return false;
    
    return (
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-expect-error - msMaxTouchPoints is IE specific
        navigator.msMaxTouchPoints > 0
    );
}

/**
 * Detect if device is mobile
 */
export function isMobileDevice(): boolean {
    if (typeof window === "undefined") return false;
    
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );
}

/**
 * Get device orientation
 */
export function getOrientation(): "portrait" | "landscape" {
    if (typeof window === "undefined") return "portrait";
    
    return window.innerHeight > window.innerWidth ? "portrait" : "landscape";
}

/**
 * Prevent default touch behavior (useful for custom gestures)
 */
export function preventDefaultTouch(e: TouchEvent | React.TouchEvent): void {
    e.preventDefault();
}

/**
 * Enable/disable body scroll (useful for modals on mobile)
 */
export function toggleBodyScroll(enable: boolean): void {
    if (typeof document === "undefined") return;
    
    if (enable) {
        document.body.style.overflow = "";
        document.body.style.position = "";
    } else {
        document.body.style.overflow = "hidden";
        document.body.style.position = "fixed";
        document.body.style.width = "100%";
    }
}

/**
 * Detect pinch zoom gesture
 */
export class PinchZoomHandler {
    private initialDistance: number = 0;
    private currentScale: number = 1;

    handleTouchStart(e: TouchEvent): void {
        if (e.touches.length === 2) {
            this.initialDistance = this.getDistance(e.touches);
        }
    }

    handleTouchMove(e: TouchEvent): number | null {
        if (e.touches.length === 2) {
            const currentDistance = this.getDistance(e.touches);
            const scale = currentDistance / this.initialDistance;
            this.currentScale = scale;
            return scale;
        }
        return null;
    }

    private getDistance(touches: TouchList): number {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    reset(): void {
        this.initialDistance = 0;
        this.currentScale = 1;
    }

    getScale(): number {
        return this.currentScale;
    }
}

/**
 * Long press detection
 */
export class LongPressHandler {
    private timeout: NodeJS.Timeout | null = null;
    private duration: number;

    constructor(duration = 500) {
        this.duration = duration;
    }

    start(callback: () => void): void {
        this.timeout = setTimeout(callback, this.duration);
    }

    cancel(): void {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }
}

/**
 * Double tap detection
 */
export class DoubleTapHandler {
    private lastTap: number = 0;
    private tapTimeout: number = 300;

    handleTap(callback: () => void): void {
        const now = Date.now();
        const timeSinceLastTap = now - this.lastTap;

        if (timeSinceLastTap < this.tapTimeout && timeSinceLastTap > 0) {
            callback();
            this.lastTap = 0;
        } else {
            this.lastTap = now;
        }
    }

    reset(): void {
        this.lastTap = 0;
    }
}

/**
 * Hook for using touch gestures in React components
 */
export function useTouchGestures(
    onSwipe?: (event: SwipeEvent) => void,
    options?: {
        minSwipeDistance?: number;
        minSwipeVelocity?: number;
    }
) {
    const handler = new TouchGestureHandler(
        options?.minSwipeDistance,
        options?.minSwipeVelocity
    );

    const handleTouchStart = (e: React.TouchEvent) => {
        handler.handleTouchStart(e);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        handler.handleTouchMove(e);
    };

    const handleTouchEnd = () => {
        const swipeEvent = handler.handleTouchEnd();
        if (swipeEvent && onSwipe) {
            onSwipe(swipeEvent);
        }
    };

    return {
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
    };
}

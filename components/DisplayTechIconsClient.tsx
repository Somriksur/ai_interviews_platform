"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface TechIconProps {
    techStack: string[];
}

// Simple tech icon mapping (client-side only)
const techLogos: Record<string, string> = {
    react: "/tech.svg",
    typescript: "/tech.svg",
    javascript: "/tech.svg",
    nodejs: "/tech.svg",
    "node.js": "/tech.svg",
    python: "/tech.svg",
    java: "/tech.svg",
    nextjs: "/tech.svg",
    "next.js": "/tech.svg",
};

const DisplayTechIconsClient = ({ techStack }: TechIconProps) => {
    return (
        <div className="flex flex-row">
            {techStack.slice(0, 3).map((tech, index) => {
                const techLower = tech.toLowerCase().trim();
                const iconUrl = techLogos[techLower] || "/tech.svg";
                
                return (
                    <div
                        key={`${tech}-${index}`}
                        className={cn(
                            "relative group bg-dark-300 rounded-full p-2 flex items-center justify-center",
                            index >= 1 && "-ml-3"
                        )}
                    >
                        <span className="tech-tooltip">{tech}</span>

                        <Image
                            src={iconUrl}
                            alt={tech}
                            width={20}
                            height={20}
                            className="size-5"
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default DisplayTechIconsClient;

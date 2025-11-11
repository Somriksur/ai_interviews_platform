import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth.action";

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "recruiter") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { role, level, type, techstack, amount } = await request.json();

        console.log("🤖 Generating questions with Ollama:", { role, level, type, techstack, amount });

        const prompt = `Generate ${amount} ${type} interview questions for a ${level} ${role} position.

Tech stack: ${techstack}

Requirements:
- Questions should be relevant to the role and experience level
- Mix of theoretical and practical questions
- Include scenario-based questions
- Questions should assess problem-solving skills

Return ONLY a JSON array of questions, no additional text.
Format: ["Question 1", "Question 2", ...]`;

        // Call Ollama API (runs locally on port 11434)
        const response = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama3.1:8b",
                prompt: prompt,
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error("Ollama API failed");
        }

        const data = await response.json();
        const questions = data.response;

        console.log("✅ Ollama response:", questions);

        let parsedQuestions: string[] = [];
        try {
            parsedQuestions = JSON.parse(questions.replace(/```json|```/g, "").trim());
        } catch {
            console.log("⚠️ Parsing failed, extracting questions from text");
            const lines = questions.split("\n").filter((line: string) => line.trim());
            parsedQuestions = lines
                .map((line: string) => line.replace(/^\d+\.\s*/, "").replace(/^[-*]\s*/, "").trim())
                .filter((line: string) => line.length > 10);
        }

        console.log("✅ Parsed questions:", parsedQuestions);

        return NextResponse.json({
            success: true,
            questions: parsedQuestions,
        });
    } catch (error) {
        console.error("❌ Error generating questions with Ollama:", error);
        
        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : "Failed to generate questions" 
            },
            { status: 500 }
        );
    }
}

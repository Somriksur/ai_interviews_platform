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

        const groqApiKey = process.env.GROQ_API_KEY;
        console.log("Groq API Key available:", !!groqApiKey);
        
        if (!groqApiKey) {
            console.error("GROQ_API_KEY is not set");
            return NextResponse.json(
                { success: false, error: "Groq API key not configured. Please add GROQ_API_KEY to .env.local" },
                { status: 500 }
            );
        }

        console.log("Generating questions with Groq:", { role, level, type, techstack, amount });

        let parsedQuestions: string[] = [];

        try {
            const prompt = `Generate ${amount} ${type} interview questions for a ${level} ${role} position.

Tech stack: ${techstack}

Requirements:
- Questions should be relevant to the role and experience level
- Mix of theoretical and practical questions
- Include scenario-based questions
- Questions should assess problem-solving skills

Return ONLY a JSON array of questions, no additional text.
Format: ["Question 1", "Question 2", ...]`;

            // Use Groq API (FREE and fast)
            console.log("Using Groq API");
            const groqResponse = await fetch(
                "https://api.groq.com/openai/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${groqApiKey}`,
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: [
                            {
                                role: "user",
                                content: prompt
                            }
                        ],
                        temperature: 0.7,
                    })
                }
            );

            if (!groqResponse.ok) {
                const errorData = await groqResponse.json();
                throw new Error(`Groq API Error: ${JSON.stringify(errorData)}`);
            }

            const groqData = await groqResponse.json();
            const questions = groqData.choices[0].message.content;

            console.log("Groq response:", questions);

            try {
                parsedQuestions = JSON.parse(questions.replace(/```json|```/g, "").trim());
            } catch {
                console.log("Parsing failed, extracting questions from text");
                const lines = questions.split("\n").filter((line: string) => line.trim());
                parsedQuestions = lines
                    .map((line: string) => line.replace(/^\d+\.\s*/, "").replace(/^[-*]\s*/, "").trim())
                    .filter((line: string) => line.length > 10);
            }

            console.log("Parsed questions:", parsedQuestions);
        } catch (aiError) {
            console.warn("AI generation failed, using fallback questions:", aiError);
            
            const fallbackQuestions: Record<string, string[]> = {
                technical: [
                    `Explain the key concepts and best practices when working with ${techstack}`,
                    `How would you optimize performance in a ${role} application using ${techstack}?`,
                    `Describe your approach to debugging complex issues in ${techstack}`,
                    `What are the most important security considerations for a ${level} ${role}?`,
                    `How do you ensure code quality and maintainability in your projects?`,
                    `Explain how you would implement state management in a ${techstack} application`,
                    `What testing strategies do you use for ${techstack} projects?`,
                    `How do you handle error handling and logging in production applications?`
                ],
                behavioral: [
                    `Tell me about a challenging project you worked on as a ${role}`,
                    `How do you handle tight deadlines and pressure?`,
                    `Describe a time when you had to learn a new technology quickly`,
                    `How do you approach code reviews and giving feedback to team members?`,
                    `Tell me about a time you disagreed with a technical decision`,
                    `How do you stay updated with the latest trends in ${techstack}?`,
                    `Describe your experience working in an agile development environment`,
                    `How do you prioritize tasks when working on multiple projects?`
                ],
                mixed: [
                    `What interests you most about working as a ${role}?`,
                    `Explain a complex technical concept from ${techstack} in simple terms`,
                    `How do you balance technical debt with feature development?`,
                    `Describe your ideal development workflow`,
                    `What's your approach to learning new technologies in the ${techstack} ecosystem?`,
                    `How do you ensure accessibility and user experience in your applications?`,
                    `Tell me about a technical challenge you overcame recently`,
                    `What are your thoughts on the future of ${techstack}?`
                ]
            };

            const questionType = type.toLowerCase();
            const baseQuestions = fallbackQuestions[questionType] || fallbackQuestions.mixed;
            parsedQuestions = baseQuestions.slice(0, parseInt(amount));
        }

        return NextResponse.json({
            success: true,
            questions: parsedQuestions,
        });
    } catch (error) {
        console.error("Error generating questions:", error);
        
        if (error instanceof Error) {
            console.error("Error name:", error.name);
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
        }
        
        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : "Failed to generate questions" 
            },
            { status: 500 }
        );
    }
}

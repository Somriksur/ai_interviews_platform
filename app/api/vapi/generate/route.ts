import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

console.log("🔑 API Key available:", !!process.env.GOOGLE_GENERATIVE_AI_API_KEY);

export async function POST(request: Request) {
    const { type, role, level, techstack, amount, userid } = await request.json();

    try {
        const { text: questions } = await generateText({
            model: google("gemini-2.0-flash-001"),
            prompt: `Prepare questions for a job interview.
            The job role is ${role}.
            The job experience level is ${level}.
            The tech stack used in the job is: ${techstack}.
            The focus between behavioural and technical questions should lean towards: ${type}.
            The amount of questions required is: ${amount}.
            Please return only the questions, without any additional text.
            Format strictly as:
            ["Question 1", "Question 2", "Question 3"]`,
        });

        console.log("🧠 Gemini raw output:", questions);

        // Parse safely
        let parsedQuestions: string[] = [];
        try {
            parsedQuestions = JSON.parse(questions.replace(/```json|```/g, "").trim());
        } catch {
            console.warn("⚠️ Could not parse Gemini output, storing as plain text.");
            parsedQuestions = [questions];
        }

        const interview = {
            role,
            type,
            level,
            techstack: typeof techstack === "string" ? techstack.split(",") : [],
            questions: parsedQuestions,
            userId: userid,
            finalized: true,
            coverImage: getRandomInterviewCover(),
            createdAt: new Date().toISOString(),
        };

        await db.collection("interviews").add(interview);

        // ✅ Vapi expects this: return structured data
        return Response.json(
            {
                success: true,
                message: "Interview questions generated successfully",
                data: {
                    role,
                    level,
                    type,
                    techstack,
                    questions: parsedQuestions,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error:", error);
        const message =
            error instanceof Error
                ? error.message
                : "Unexpected error while generating interview";

        return Response.json({ success: false, error: message }, { status: 500 });
    }
}

export async function GET() {
    return Response.json(
        { success: true, data: "Vapi Interview API is live ✅" },
        { status: 200 }
    );
}

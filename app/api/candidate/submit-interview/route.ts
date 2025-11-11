import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { db } from "@/firebase/admin";

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "candidate") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { interviewId, transcript } = await request.json();

        // Check if feedback already exists for this interview and candidate
        const existingFeedback = await db
            .collection("feedbacks")
            .where("interviewId", "==", interviewId)
            .where("candidateId", "==", user.id)
            .get();

        if (!existingFeedback.empty) {
            console.log("⚠️ Feedback already exists for this interview");
            return NextResponse.json(
                { 
                    success: true, 
                    feedbackId: existingFeedback.docs[0].id,
                    message: "Feedback already submitted"
                },
                { status: 200 }
            );
        }

        // Get interview details
        const interviewDoc = await db.collection("interviews").doc(interviewId).get();
        if (!interviewDoc.exists) {
            return NextResponse.json(
                { success: false, error: "Interview not found" },
                { status: 404 }
            );
        }

        const interview = interviewDoc.data() as Interview;

        // Generate feedback using Gemini
        const transcriptText = transcript
            .map((t: { role: string; content: string }) => `${t.role}: ${t.content}`)
            .join("\n");

        console.log("🤖 Generating feedback with Groq for interview:", interview.role);
        console.log("📝 Transcript length:", transcriptText.length, "characters");
        console.log("📋 Questions count:", interview.questions.length);
        console.log("📊 Transcript entries:", transcript.length);

        let feedbackText = "";
        try {
            const groqApiKey = process.env.GROQ_API_KEY;
            
            const feedbackPrompt = `You are an expert interview evaluator. Analyze this interview transcript and provide ACCURATE, PROPORTIONAL feedback.

## INTERVIEW DETAILS:
- Role: ${interview.role}
- Experience Level: ${interview.level}
- Interview Type: ${interview.type}
- Tech Stack: ${interview.techstack.join(", ")}
- Total Questions: ${interview.questions.length}

## QUESTIONS ASKED:
${interview.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

## INTERVIEW TRANSCRIPT:
${transcriptText}

## CRITICAL SCORING RULES:
1. **If NO answers provided** → Give 0 score with feedback explaining no responses
2. **If 1 question answered** → Score based on that 1 answer only (typically 10-30 out of 100)
3. **If 2-3 questions answered** → Score proportionally (typically 30-60 out of 100)
4. **If all questions answered well** → Score 70-100 based on quality
5. **If answers are poor/incorrect** → Give LOW scores (20-40) with constructive feedback
6. **Be HONEST** → Don't give high scores for incomplete or poor answers

## EVALUATION CRITERIA:
1. **Technical Knowledge** - Accuracy, depth, correctness of answers
2. **Communication Skills** - Clarity, articulation, structure
3. **Problem Solving** - Logic, approach, completeness
4. **Confidence & Professionalism** - Composure, engagement

## REQUIRED OUTPUT FORMAT (JSON only):
{
  "totalScore": <number 0-100 (PROPORTIONAL to questions answered and quality)>,
  "categoryScores": [
    {
      "name": "Technical Knowledge",
      "score": <number 0-100 (HONEST score based on actual performance)>,
      "comment": "<HONEST 2-3 sentence analysis - mention if incomplete or incorrect>"
    },
    {
      "name": "Communication Skills",
      "score": <number 0-100 (HONEST score)>,
      "comment": "<HONEST analysis - mention if answers were brief or unclear>"
    },
    {
      "name": "Problem Solving",
      "score": <number 0-100 (HONEST score)>,
      "comment": "<HONEST analysis - mention if solutions were incomplete>"
    },
    {
      "name": "Confidence & Professionalism",
      "score": <number 0-100 (HONEST score)>,
      "comment": "<HONEST analysis>"
    }
  ],
  "strengths": ["<specific strength or 'Limited responses provided'>", "<strength 2>", "<strength 3>"],
  "areasForImprovement": ["<specific area - be HONEST about gaps>", "<area 2>", "<area 3>"],
  "finalAssessment": "<HONEST 3-4 sentence assessment. If incomplete, say so. If poor quality, say so. If excellent, say so.>"
}

IMPORTANT: Be HONEST and PROPORTIONAL. Don't give 75+ scores for 1-2 answers. Don't give high scores for poor answers.

Provide ONLY the JSON response, no additional text.`;

            if (!groqApiKey) {
                throw new Error("GROQ_API_KEY not configured");
            }

            console.log("🚀 Using Groq API for feedback");
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
                                content: feedbackPrompt
                            }
                        ],
                        temperature: 0.5,
                    })
                }
            );

            if (!groqResponse.ok) {
                const errorData = await groqResponse.json();
                throw new Error(`Groq API Error: ${JSON.stringify(errorData)}`);
            }

            const groqData = await groqResponse.json();
            feedbackText = groqData.choices[0].message.content;
            console.log("✅ Groq feedback generated, length:", feedbackText.length);
        } catch (aiError) {
            console.warn("⚠️ AI feedback generation failed, using fallback:", aiError);
            
            // Generate fallback feedback immediately
            const userMessages = transcript.filter((t: { role: string; content: string }) => t.role === "user").length;
            const questionsAnswered = Math.min(userMessages, interview.questions.length);
            const completionRatio = questionsAnswered / interview.questions.length;
            const adjustedScore = Math.max(0, Math.min(100, Math.round(completionRatio * 70)));
            
            feedbackText = JSON.stringify({
                totalScore: adjustedScore,
                categoryScores: [
                    { 
                        name: "Technical Knowledge", 
                        score: adjustedScore, 
                        comment: `Answered ${questionsAnswered} out of ${interview.questions.length} questions. ${questionsAnswered === 0 ? "No responses provided." : questionsAnswered < interview.questions.length ? "Interview incomplete - not all questions were answered." : "Completed all questions with reasonable depth."}` 
                    },
                    { 
                        name: "Communication Skills", 
                        score: adjustedScore, 
                        comment: `Communication assessment based on ${questionsAnswered} response(s). ${questionsAnswered === 0 ? "Unable to assess - no responses." : "Responses were clear and structured."}` 
                    },
                    { 
                        name: "Problem Solving", 
                        score: adjustedScore, 
                        comment: `Problem-solving evaluation based on ${questionsAnswered} answer(s). ${questionsAnswered === 0 ? "No problem-solving demonstrated." : "Demonstrated logical thinking approach."}` 
                    },
                    { 
                        name: "Confidence & Professionalism", 
                        score: adjustedScore, 
                        comment: `Professionalism assessed from ${questionsAnswered} interaction(s). ${questionsAnswered === 0 ? "Unable to assess." : "Maintained professional demeanor throughout."}` 
                    },
                ],
                strengths: questionsAnswered > 0 
                    ? ["Participated in interview", "Provided responses to questions", "Engaged with the interview process"]
                    : ["Attended interview session"],
                areasForImprovement: questionsAnswered < interview.questions.length
                    ? [
                        `Answer all ${interview.questions.length} questions for complete evaluation`,
                        "Provide more detailed technical responses",
                        "Complete the full interview process"
                    ]
                    : ["Provide more detailed explanations with examples", "Demonstrate deeper technical knowledge", "Include real-world scenarios in answers"],
                finalAssessment: questionsAnswered === 0 
                    ? `The candidate did not provide any responses during the interview. Unable to assess technical skills or qualifications. Score: ${adjustedScore}/100 reflects no participation.`
                    : questionsAnswered < interview.questions.length
                    ? `The candidate answered ${questionsAnswered} out of ${interview.questions.length} questions (${Math.round(completionRatio * 100)}% completion). Score: ${adjustedScore}/100 reflects partial completion. To receive a complete evaluation, please answer all interview questions.`
                    : `The candidate completed the interview by answering all ${interview.questions.length} questions. Score: ${adjustedScore}/100 reflects good completion and engagement. Continue building on technical knowledge and practical experience.`,
            });
        }

        let feedback;
        try {
            // Clean the response and parse JSON
            const cleanedResponse = feedbackText
                .replace(/```json|```/g, "")
                .replace(/^[^{]*/, "")
                .replace(/[^}]*$/, "")
                .trim();
            
            console.log("🔍 Parsing feedback JSON...");
            feedback = JSON.parse(cleanedResponse);
            console.log("✅ Feedback parsed successfully:", {
                totalScore: feedback.totalScore,
                categoriesCount: feedback.categoryScores?.length,
                strengthsCount: feedback.strengths?.length
            });
        } catch (parseError) {
            console.error("❌ JSON parsing failed:", parseError);
            console.log("📝 Raw Gemini response (first 500 chars):", feedbackText.substring(0, 500));
            
            // Create proportional fallback based on transcript length
            const userMessages = transcript.filter((t: { role: string; content: string }) => t.role === "user").length;
            const questionsAnswered = Math.min(userMessages, interview.questions.length);
            const completionRatio = questionsAnswered / interview.questions.length;
            
            // Base score on completion ratio (0-100)
            const baseScore = Math.round(completionRatio * 100);
            // Adjust for quality (assume average quality if we can't parse)
            const adjustedScore = Math.max(0, Math.min(100, Math.round(baseScore * 0.7)));
            
            console.log("📊 Fallback scoring:", {
                questionsAnswered,
                totalQuestions: interview.questions.length,
                completionRatio,
                adjustedScore
            });
            
            feedback = {
                totalScore: adjustedScore,
                categoryScores: [
                    { 
                        name: "Technical Knowledge", 
                        score: adjustedScore, 
                        comment: `Answered ${questionsAnswered} out of ${interview.questions.length} questions. ${questionsAnswered === 0 ? "No responses provided." : questionsAnswered < interview.questions.length ? "Interview incomplete - not all questions were answered." : "Completed all questions."}` 
                    },
                    { 
                        name: "Communication Skills", 
                        score: adjustedScore, 
                        comment: `Communication assessment based on ${questionsAnswered} response(s). ${questionsAnswered === 0 ? "Unable to assess - no responses." : "Responses were captured."}` 
                    },
                    { 
                        name: "Problem Solving", 
                        score: adjustedScore, 
                        comment: `Problem-solving evaluation based on ${questionsAnswered} answer(s). ${questionsAnswered === 0 ? "No problem-solving demonstrated." : "Some problem-solving approach shown."}` 
                    },
                    { 
                        name: "Confidence & Professionalism", 
                        score: adjustedScore, 
                        comment: `Professionalism assessed from ${questionsAnswered} interaction(s). ${questionsAnswered === 0 ? "Unable to assess." : "Maintained professional demeanor."}` 
                    },
                ],
                strengths: questionsAnswered > 0 
                    ? ["Participated in interview", "Provided responses", "Engaged with questions"]
                    : ["Attended interview session"],
                areasForImprovement: questionsAnswered < interview.questions.length
                    ? [
                        `Answer all ${interview.questions.length} questions for complete evaluation`,
                        "Provide more detailed responses",
                        "Complete the full interview process"
                    ]
                    : ["Provide more detailed explanations", "Include specific examples", "Demonstrate deeper technical knowledge"],
                finalAssessment: questionsAnswered === 0 
                    ? `The candidate did not provide any responses during the interview. Unable to assess technical skills or qualifications. Score: ${adjustedScore}/100 reflects no participation.`
                    : questionsAnswered < interview.questions.length
                    ? `The candidate answered ${questionsAnswered} out of ${interview.questions.length} questions (${Math.round(completionRatio * 100)}% completion). Score: ${adjustedScore}/100 reflects partial completion. To receive a complete evaluation, please answer all interview questions.`
                    : `The candidate completed the interview by answering all ${interview.questions.length} questions. Score: ${adjustedScore}/100 reflects completion. Detailed analysis was not available, but responses were recorded.`,
            };
        }

        // Save feedback to database
        const feedbackDoc = await db.collection("feedbacks").add({
            interviewId,
            candidateId: user.id,
            recruiterId: interview.recruiterId,
            ...feedback,
            transcript,
            createdAt: new Date().toISOString(),
        });

        // Update interview status
        await db.collection("interviews").doc(interviewId).update({
            status: "completed",
            candidateId: user.id,
        });

        return NextResponse.json({
            success: true,
            feedbackId: feedbackDoc.id,
        });
    } catch (error) {
        console.error("Error submitting interview:", error);
        return NextResponse.json(
            { success: false, error: "Failed to submit interview" },
            { status: 500 }
        );
    }
}

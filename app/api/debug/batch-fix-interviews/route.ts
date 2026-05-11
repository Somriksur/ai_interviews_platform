import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/firebase/admin";
import { evaluateWithRetry } from "@/lib/services/nlp-evaluation.service";
import { withCanonicalScores } from "@/lib/utils/evaluation-report";

const batchFixSchema = z.object({
  studentId: z.string().optional(),
  driveId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  forceAll: z.boolean().optional().default(false),
  maxFixes: z.number().optional().default(10)
}).strict();

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parseResult = batchFixSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { studentId, driveId, dateFrom, dateTo, forceAll, maxFixes } = parseResult.data;

    console.log("🔧 Starting batch fix for interviews...");

    // Find problematic evaluations
    let query = db.collection("evaluation_reports");

    if (studentId) {
      query = query.where("studentId", "==", studentId);
    }

    if (driveId) {
      query = query.where("driveId", "==", driveId);
    }

    if (dateFrom) {
      query = query.where("createdAt", ">=", new Date(dateFrom));
    }

    if (dateTo) {
      query = query.where("createdAt", "<=", new Date(dateTo));
    }

    // Get recent evaluations
    query = query.orderBy("createdAt", "desc").limit(50);

    const snapshot = await query.get();
    console.log(`📊 Found ${snapshot.docs.length} evaluations to check`);

    const problematicEvaluations = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const evaluationId = doc.id;
      const overallScore = data.scores?.overall || data.overallScore || 0;
      
      // Check if this evaluation has issues
      const hasNoResponseIssue = data.transcript?.questionResponses?.some((qr: any) => 
        qr.response === "No response recorded..." || qr.response === "No response recorded"
      );
      
      const hasLowScore = overallScore < 25; // Very low scores are suspicious
      
      if (hasNoResponseIssue || hasLowScore || forceAll) {
        problematicEvaluations.push({
          evaluationId,
          studentId: data.studentId,
          driveId: data.driveId,
          sessionId: data.sessionId,
          currentScore: overallScore,
          hasNoResponseIssue,
          hasLowScore,
          createdAt: data.createdAt?.toDate?.() || data.createdAt
        });
      }
    }

    console.log(`🚨 Found ${problematicEvaluations.length} problematic evaluations`);

    if (problematicEvaluations.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No problematic evaluations found",
        totalChecked: snapshot.docs.length
      });
    }

    // Limit the number of fixes
    const evaluationsToFix = problematicEvaluations.slice(0, maxFixes);
    console.log(`🔄 Will fix ${evaluationsToFix.length} evaluations`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const evaluation of evaluationsToFix) {
      try {
        console.log(`\n🔧 Fixing evaluation ${evaluation.evaluationId}...`);

        // Get session data
        const sessionDoc = await db.collection("interview_sessions").doc(evaluation.sessionId).get();
        if (!sessionDoc.exists) {
          console.error(`❌ Session ${evaluation.sessionId} not found`);
          results.push({
            evaluationId: evaluation.evaluationId,
            success: false,
            error: "Session not found"
          });
          errorCount++;
          continue;
        }

        const sessionData = sessionDoc.data();
        const transcript = sessionData?.transcript || [];

        // Check if transcript has user responses
        const userResponses = transcript.filter((msg: any) => {
          if (msg.role === 'user' || msg.role === 'candidate' || msg.role === 'student') {
            return msg.content && msg.content.trim().length > 3;
          }
          return false;
        });

        if (userResponses.length === 0) {
          console.warn(`⚠️ No user responses found in session ${evaluation.sessionId}`);
          results.push({
            evaluationId: evaluation.evaluationId,
            success: false,
            error: "No user responses in transcript"
          });
          errorCount++;
          continue;
        }

        // Get drive data
        const driveDoc = await db.collection("interview_drives").doc(evaluation.driveId).get();
        if (!driveDoc.exists) {
          console.error(`❌ Drive ${evaluation.driveId} not found`);
          results.push({
            evaluationId: evaluation.evaluationId,
            success: false,
            error: "Drive not found"
          });
          errorCount++;
          continue;
        }

        const driveData = driveDoc.data();
        const questions = driveData?.questions?.map((q: any) => q.text || q) || [];
        const jobRole = driveData?.role || 'Software Engineer';

        // Prepare evaluation input
        const evaluationInput = {
          transcript: transcript.map((msg: any) => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: String(msg.content || ''),
            timestamp: new Date(msg.timestamp || Date.now())
          })),
          questions,
          jobRole,
          studentId: evaluation.studentId,
          driveId: evaluation.driveId,
          sessionId: evaluation.sessionId
        };

        console.log(`📊 Re-evaluating with ${userResponses.length} user responses...`);

        // Run evaluation
        const evaluationReport = await evaluateWithRetry(evaluationInput, 2);

        // Clean and prepare the new report
        const cleanedReport = withCanonicalScores({
          ...evaluationReport,
          sentTo: {
            collegeId: driveData.colleges?.[0] || null,
            organizationId: driveData.organizationId || null,
            sentAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          reEvaluatedAt: new Date(),
          reEvaluationReason: 'Batch fix - enhanced processing system',
          originalScore: evaluation.currentScore
        });

        // Update the existing evaluation report
        await db.collection("evaluation_reports").doc(evaluation.evaluationId).set(cleanedReport, { merge: false });

        // Update session
        await db.collection("interview_sessions").doc(evaluation.sessionId).update({
          updatedAt: new Date(),
          reEvaluatedAt: new Date(),
          reEvaluationReason: 'Batch fix applied'
        });

        const newScore = cleanedReport.scores?.overall || cleanedReport.overallScore;
        console.log(`✅ Fixed! Score: ${evaluation.currentScore} → ${newScore}`);

        results.push({
          evaluationId: evaluation.evaluationId,
          success: true,
          oldScore: evaluation.currentScore,
          newScore: newScore,
          improvement: newScore - evaluation.currentScore,
          userResponsesFound: userResponses.length
        });

        successCount++;

      } catch (error) {
        console.error(`❌ Failed to fix evaluation ${evaluation.evaluationId}:`, error);
        results.push({
          evaluationId: evaluation.evaluationId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Batch fix completed: ${successCount} successful, ${errorCount} failed`,
      summary: {
        totalChecked: snapshot.docs.length,
        problematicFound: problematicEvaluations.length,
        fixesAttempted: evaluationsToFix.length,
        successCount,
        errorCount
      },
      results: results,
      averageImprovement: results
        .filter(r => r.success && r.improvement)
        .reduce((sum, r) => sum + r.improvement, 0) / Math.max(1, successCount)
    });

  } catch (error) {
    console.error("❌ Error in batch fix:", error);
    return NextResponse.json({ 
      error: "Failed to perform batch fix", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
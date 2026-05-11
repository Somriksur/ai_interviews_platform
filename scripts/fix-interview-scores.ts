/**
 * Script to fix interview scores and re-evaluate interviews with missing responses
 * 
 * Usage:
 * npx tsx scripts/fix-interview-scores.ts
 */

import { db } from '../firebase/admin';
import { evaluateWithRetry } from '../lib/services/nlp-evaluation.service';
import { withCanonicalScores } from '../lib/utils/evaluation-report';

interface SessionData {
  id: string;
  studentId: string;
  driveId: string;
  transcript: any[];
  evaluationId?: string;
  status: string;
}

async function main() {
  console.log('🔍 Starting interview score fix process...');
  
  // Find sessions with problematic evaluations
  const sessionsSnapshot = await db
    .collection('interview_sessions')
    .where('status', '==', 'completed')
    .get();
  
  const problematicSessions: SessionData[] = [];
  
  for (const doc of sessionsSnapshot.docs) {
    const sessionData = doc.data() as any;
    const sessionId = doc.id;
    
    // Check if evaluation exists and has low scores
    if (sessionData.evaluationId) {
      const evalDoc = await db.collection('evaluation_reports').doc(sessionData.evaluationId).get();
      if (evalDoc.exists) {
        const evalData = evalDoc.data();
        const overallScore = evalData?.scores?.overall || evalData?.overallScore || 0;
        
        // Check if score is suspiciously low (likely due to missing responses)
        if (overallScore < 20) {
          console.log(`🚨 Found low-scoring session: ${sessionId} (Score: ${overallScore})`);
          
          // Check transcript for actual responses
          const transcript = sessionData.transcript || [];
          const userResponses = transcript.filter((msg: any) => 
            msg?.role === 'user' && msg?.content && msg.content.length > 10
          );
          
          if (userResponses.length > 0) {
            console.log(`📝 Session has ${userResponses.length} user responses but low score - needs re-evaluation`);
            problematicSessions.push({
              id: sessionId,
              studentId: sessionData.studentId,
              driveId: sessionData.driveId,
              transcript: sessionData.transcript,
              evaluationId: sessionData.evaluationId,
              status: sessionData.status
            });
          }
        }
      }
    }
  }
  
  console.log(`📊 Found ${problematicSessions.length} sessions that need re-evaluation`);
  
  if (problematicSessions.length === 0) {
    console.log('✅ No problematic sessions found!');
    return;
  }
  
  // Ask for confirmation
  console.log('\n🔄 Sessions to re-evaluate:');
  problematicSessions.forEach((session, index) => {
    console.log(`${index + 1}. Session ${session.id} - Student: ${session.studentId}`);
  });
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise<string>((resolve) => {
    readline.question('\nProceed with re-evaluation? (y/N): ', resolve);
  });
  
  readline.close();
  
  if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
    console.log('❌ Aborted by user');
    return;
  }
  
  // Re-evaluate each session
  let successCount = 0;
  let errorCount = 0;
  
  for (const session of problematicSessions) {
    try {
      console.log(`\n🔄 Re-evaluating session ${session.id}...`);
      
      // Get drive data for questions
      const driveDoc = await db.collection('interview_drives').doc(session.driveId).get();
      if (!driveDoc.exists) {
        console.error(`❌ Drive ${session.driveId} not found`);
        errorCount++;
        continue;
      }
      
      const driveData = driveDoc.data();
      const questions = driveData?.questions?.map((q: any) => q.text || q) || [];
      const jobRole = driveData?.role || 'Software Engineer';
      
      // Prepare evaluation input
      const evaluationInput = {
        transcript: session.transcript.map((msg: any) => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: String(msg.content || ''),
          timestamp: new Date(msg.timestamp || Date.now())
        })),
        questions,
        jobRole,
        studentId: session.studentId,
        driveId: session.driveId,
        sessionId: session.id
      };
      
      console.log(`📊 Input validation:`, {
        transcriptLength: evaluationInput.transcript.length,
        questionsCount: questions.length,
        userResponses: evaluationInput.transcript.filter(m => m.role === 'user').length
      });
      
      // Run evaluation
      const evaluationReport = await evaluateWithRetry(evaluationInput, 3);
      
      // Clean and save new report
      const cleanedReport = withCanonicalScores({
        ...evaluationReport,
        sentTo: {
          collegeId: driveData.colleges?.[0] || null,
          organizationId: driveData.organizationId || null,
          sentAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Create new evaluation report
      const newReportRef = await db.collection('evaluation_reports').add(cleanedReport);
      
      // Update session with new evaluation ID
      await db.collection('interview_sessions').doc(session.id).update({
        evaluationId: newReportRef.id,
        updatedAt: new Date(),
        reEvaluatedAt: new Date(),
        reEvaluationReason: 'Fixed missing responses issue'
      });
      
      console.log(`✅ Re-evaluation completed:`, {
        sessionId: session.id,
        oldEvaluationId: session.evaluationId,
        newEvaluationId: newReportRef.id,
        newOverallScore: cleanedReport.scores?.overall || cleanedReport.overallScore
      });
      
      successCount++;
      
    } catch (error) {
      console.error(`❌ Failed to re-evaluate session ${session.id}:`, error);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Re-evaluation Summary:`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📈 Total processed: ${successCount + errorCount}`);
  
  if (successCount > 0) {
    console.log('\n🎉 Interview scores have been fixed!');
    console.log('💡 Students should now see improved scores that reflect their actual performance.');
  }
}

// Run the script
main().catch(console.error);
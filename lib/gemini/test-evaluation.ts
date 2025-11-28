/**
 * Test script to demonstrate Groq AI evaluation
 * Run with: npx ts-node lib/gemini/test-evaluation.ts
 */

import { evaluateAnswerWithGroq } from './evaluate-answer';

async function testEvaluation() {
    console.log('🧪 Testing Groq AI Answer Evaluation (FAST & FREE!)\n');
    console.log('='.repeat(60));
    
    // Test Case 1: Wrong answer with many words
    console.log('\n📝 Test 1: WRONG ANSWER (but 30+ words)');
    console.log('-'.repeat(60));
    const test1 = await evaluateAnswerWithGroq(
        "What is the difference between let and const in JavaScript?",
        "Let and const are both used for styling in CSS. Let is for colors and const is for fonts. They help make websites look better and more professional.",
        "Frontend Developer",
        "Mid-level",
        ["JavaScript", "React"]
    );
    console.log('Question: What is the difference between let and const?');
    console.log('Answer: (Wrong answer about CSS, 30 words)');
    console.log(`\n✅ Correctness Score: ${test1.correctnessScore}/100`);
    console.log(`✅ Is Correct: ${test1.isCorrect}`);
    console.log(`📝 Feedback: ${test1.feedback}`);
    
    // Test Case 2: Correct answer
    console.log('\n\n📝 Test 2: CORRECT ANSWER');
    console.log('-'.repeat(60));
    const test2 = await evaluateAnswerWithGroq(
        "What is the difference between let and const in JavaScript?",
        "Let allows you to reassign values while const creates a constant reference that cannot be reassigned. Both are block-scoped unlike var which is function-scoped. Const is preferred for values that won't change.",
        "Frontend Developer",
        "Mid-level",
        ["JavaScript", "React"]
    );
    console.log('Question: What is the difference between let and const?');
    console.log('Answer: (Correct explanation)');
    console.log(`\n✅ Correctness Score: ${test2.correctnessScore}/100`);
    console.log(`✅ Is Correct: ${test2.isCorrect}`);
    console.log(`📝 Feedback: ${test2.feedback}`);
    
    // Test Case 3: Very short answer
    console.log('\n\n📝 Test 3: TOO SHORT');
    console.log('-'.repeat(60));
    const test3 = await evaluateAnswerWithGroq(
        "What is the difference between let and const in JavaScript?",
        "I don't know",
        "Frontend Developer",
        "Mid-level",
        ["JavaScript", "React"]
    );
    console.log('Question: What is the difference between let and const?');
    console.log('Answer: "I don\'t know"');
    console.log(`\n✅ Correctness Score: ${test3.correctnessScore}/100`);
    console.log(`✅ Is Correct: ${test3.isCorrect}`);
    console.log(`📝 Feedback: ${test3.feedback}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test Complete!\n');
}

// Run if executed directly
if (require.main === module) {
    testEvaluation().catch(console.error);
}

export { testEvaluation };

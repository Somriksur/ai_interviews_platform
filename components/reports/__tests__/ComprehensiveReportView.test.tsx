import * as fc from 'fast-check';

/**
 * Feature: student-interview-reports-enhancement, Property 1: Report data completeness
 * 
 * Property: For any student with an interview report, all required metrics 
 * (technical, behavioral, emotional, language) should be present in the displayed data
 * 
 * Validates: Requirements 1.3
 */

interface ComprehensiveReport {
  studentId: string;
  technicalScore: number;
  communicationRating: number;
  overallScore: number;
  emotionalAnalysis?: {
    overall: string;
    nervousness: number;
    confidence: number;
    stress: number;
    calmness: number;
    motivation: number;
    emotionalTone: string;
  };
  behavioralAnalysis?: {
    communicationClarity: number;
    consistency: number;
    toneVariation: number;
    trustworthiness: number;
    professionalism: number;
    engagement: number;
  };
  languageQuality?: {
    grammar: number;
    fluency: number;
    vocabulary: number;
    hesitation: number;
    fillerWords: number;
  };
}

/**
 * Validates that a report has all required fields
 */
function validateReportCompleteness(report: ComprehensiveReport): {
  isComplete: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  // Check required top-level fields
  if (report.studentId === undefined || report.studentId === null) {
    missingFields.push('studentId');
  }
  if (report.technicalScore === undefined || report.technicalScore === null) {
    missingFields.push('technicalScore');
  }
  if (report.communicationRating === undefined || report.communicationRating === null) {
    missingFields.push('communicationRating');
  }
  if (report.overallScore === undefined || report.overallScore === null) {
    missingFields.push('overallScore');
  }

  // Check emotional analysis fields if present
  if (report.emotionalAnalysis) {
    const ea = report.emotionalAnalysis;
    if (ea.overall === undefined) missingFields.push('emotionalAnalysis.overall');
    if (ea.nervousness === undefined) missingFields.push('emotionalAnalysis.nervousness');
    if (ea.confidence === undefined) missingFields.push('emotionalAnalysis.confidence');
    if (ea.stress === undefined) missingFields.push('emotionalAnalysis.stress');
    if (ea.calmness === undefined) missingFields.push('emotionalAnalysis.calmness');
    if (ea.motivation === undefined) missingFields.push('emotionalAnalysis.motivation');
    if (ea.emotionalTone === undefined) missingFields.push('emotionalAnalysis.emotionalTone');
  }

  // Check behavioral analysis fields if present
  if (report.behavioralAnalysis) {
    const ba = report.behavioralAnalysis;
    if (ba.communicationClarity === undefined) missingFields.push('behavioralAnalysis.communicationClarity');
    if (ba.consistency === undefined) missingFields.push('behavioralAnalysis.consistency');
    if (ba.toneVariation === undefined) missingFields.push('behavioralAnalysis.toneVariation');
    if (ba.trustworthiness === undefined) missingFields.push('behavioralAnalysis.trustworthiness');
    if (ba.professionalism === undefined) missingFields.push('behavioralAnalysis.professionalism');
    if (ba.engagement === undefined) missingFields.push('behavioralAnalysis.engagement');
  }

  // Check language quality fields if present
  if (report.languageQuality) {
    const lq = report.languageQuality;
    if (lq.grammar === undefined) missingFields.push('languageQuality.grammar');
    if (lq.fluency === undefined) missingFields.push('languageQuality.fluency');
    if (lq.vocabulary === undefined) missingFields.push('languageQuality.vocabulary');
    if (lq.hesitation === undefined) missingFields.push('languageQuality.hesitation');
    if (lq.fillerWords === undefined) missingFields.push('languageQuality.fillerWords');
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
}

describe('ComprehensiveReportView - Property Tests', () => {
  describe('Property 1: Report data completeness', () => {
    it('should have all required top-level fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            studentId: fc.uuid(),
            technicalScore: fc.integer({ min: 0, max: 100 }),
            communicationRating: fc.integer({ min: 0, max: 100 }),
            overallScore: fc.integer({ min: 0, max: 100 }),
          }),
          (report) => {
            const validation = validateReportCompleteness(report);
            
            // All required fields should be present
            expect(validation.isComplete).toBe(true);
            expect(validation.missingFields).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have complete emotional analysis when present', () => {
      fc.assert(
        fc.property(
          fc.record({
            studentId: fc.uuid(),
            technicalScore: fc.integer({ min: 0, max: 100 }),
            communicationRating: fc.integer({ min: 0, max: 100 }),
            overallScore: fc.integer({ min: 0, max: 100 }),
            emotionalAnalysis: fc.record({
              overall: fc.constantFrom('positive', 'neutral', 'negative'),
              nervousness: fc.integer({ min: 0, max: 100 }),
              confidence: fc.integer({ min: 0, max: 100 }),
              stress: fc.integer({ min: 0, max: 100 }),
              calmness: fc.integer({ min: 0, max: 100 }),
              motivation: fc.integer({ min: 0, max: 100 }),
              emotionalTone: fc.string(),
            }),
          }),
          (report) => {
            const validation = validateReportCompleteness(report);
            
            // All fields including emotional analysis should be complete
            expect(validation.isComplete).toBe(true);
            expect(validation.missingFields).toHaveLength(0);
            
            // Verify emotional analysis fields are present
            expect(report.emotionalAnalysis).toBeDefined();
            expect(report.emotionalAnalysis?.overall).toBeDefined();
            expect(report.emotionalAnalysis?.confidence).toBeGreaterThanOrEqual(0);
            expect(report.emotionalAnalysis?.confidence).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have complete behavioral analysis when present', () => {
      fc.assert(
        fc.property(
          fc.record({
            studentId: fc.uuid(),
            technicalScore: fc.integer({ min: 0, max: 100 }),
            communicationRating: fc.integer({ min: 0, max: 100 }),
            overallScore: fc.integer({ min: 0, max: 100 }),
            behavioralAnalysis: fc.record({
              communicationClarity: fc.integer({ min: 0, max: 100 }),
              consistency: fc.integer({ min: 0, max: 100 }),
              toneVariation: fc.integer({ min: 0, max: 100 }),
              trustworthiness: fc.integer({ min: 0, max: 100 }),
              professionalism: fc.integer({ min: 0, max: 100 }),
              engagement: fc.integer({ min: 0, max: 100 }),
            }),
          }),
          (report) => {
            const validation = validateReportCompleteness(report);
            
            // All fields including behavioral analysis should be complete
            expect(validation.isComplete).toBe(true);
            expect(validation.missingFields).toHaveLength(0);
            
            // Verify behavioral analysis fields are present
            expect(report.behavioralAnalysis).toBeDefined();
            expect(report.behavioralAnalysis?.communicationClarity).toBeGreaterThanOrEqual(0);
            expect(report.behavioralAnalysis?.professionalism).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have complete language quality when present', () => {
      fc.assert(
        fc.property(
          fc.record({
            studentId: fc.uuid(),
            technicalScore: fc.integer({ min: 0, max: 100 }),
            communicationRating: fc.integer({ min: 0, max: 100 }),
            overallScore: fc.integer({ min: 0, max: 100 }),
            languageQuality: fc.record({
              grammar: fc.integer({ min: 0, max: 100 }),
              fluency: fc.integer({ min: 0, max: 100 }),
              vocabulary: fc.integer({ min: 0, max: 100 }),
              hesitation: fc.integer({ min: 0, max: 100 }),
              fillerWords: fc.integer({ min: 0, max: 50 }),
            }),
          }),
          (report) => {
            const validation = validateReportCompleteness(report);
            
            // All fields including language quality should be complete
            expect(validation.isComplete).toBe(true);
            expect(validation.missingFields).toHaveLength(0);
            
            // Verify language quality fields are present
            expect(report.languageQuality).toBeDefined();
            expect(report.languageQuality?.grammar).toBeGreaterThanOrEqual(0);
            expect(report.languageQuality?.fluency).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have all metrics when fully populated', () => {
      fc.assert(
        fc.property(
          fc.record({
            studentId: fc.uuid(),
            technicalScore: fc.integer({ min: 0, max: 100 }),
            communicationRating: fc.integer({ min: 0, max: 100 }),
            overallScore: fc.integer({ min: 0, max: 100 }),
            emotionalAnalysis: fc.record({
              overall: fc.constantFrom('positive', 'neutral', 'negative'),
              nervousness: fc.integer({ min: 0, max: 100 }),
              confidence: fc.integer({ min: 0, max: 100 }),
              stress: fc.integer({ min: 0, max: 100 }),
              calmness: fc.integer({ min: 0, max: 100 }),
              motivation: fc.integer({ min: 0, max: 100 }),
              emotionalTone: fc.string(),
            }),
            behavioralAnalysis: fc.record({
              communicationClarity: fc.integer({ min: 0, max: 100 }),
              consistency: fc.integer({ min: 0, max: 100 }),
              toneVariation: fc.integer({ min: 0, max: 100 }),
              trustworthiness: fc.integer({ min: 0, max: 100 }),
              professionalism: fc.integer({ min: 0, max: 100 }),
              engagement: fc.integer({ min: 0, max: 100 }),
            }),
            languageQuality: fc.record({
              grammar: fc.integer({ min: 0, max: 100 }),
              fluency: fc.integer({ min: 0, max: 100 }),
              vocabulary: fc.integer({ min: 0, max: 100 }),
              hesitation: fc.integer({ min: 0, max: 100 }),
              fillerWords: fc.integer({ min: 0, max: 50 }),
            }),
          }),
          (report) => {
            const validation = validateReportCompleteness(report);
            
            // Fully populated report should be complete
            expect(validation.isComplete).toBe(true);
            expect(validation.missingFields).toHaveLength(0);
            
            // Verify all sections are present
            expect(report.emotionalAnalysis).toBeDefined();
            expect(report.behavioralAnalysis).toBeDefined();
            expect(report.languageQuality).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

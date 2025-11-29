/**
 * PDF Report Generation
 * 
 * Setup: npm install jspdf jspdf-autotable
 * 
 * Note: This is a client-side implementation
 * Import jsPDF dynamically in components
 */

export interface InterviewReport {
    candidateName: string;
    candidateEmail: string;
    role: string;
    level: string;
    type: string;
    techstack: string[];
    questions: string[];
    answers: string[];
    scores: number[];
    totalScore: number;
    feedback: string;
    completedAt: string;
}

// This function will be called from client components
export function generatePDFReport(report: InterviewReport) {
    // Dynamic import will be handled in the component
    // This is just the data structure
    return report;
}

// PDF generation will be done client-side using jsPDF
// See components/ExportPDFButton.tsx for implementation

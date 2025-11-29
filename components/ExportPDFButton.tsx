"use client";

import { Button } from "./ui/button";
import { toast } from "sonner";

interface ExportPDFButtonProps {
    interviewData: {
        candidateName: string;
        role: string;
        score: number;
        questions: string[];
        answers?: string[];
    };
}

export default function ExportPDFButton({ interviewData }: ExportPDFButtonProps) {
    const handleExport = async () => {
        try {
            // Dynamic import to avoid SSR issues
            const jsPDF = (await import("jspdf")).default;
            const doc = new jsPDF();

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            const maxWidth = pageWidth - 2 * margin;
            let yPos = 20;

            // Helper function to add text with word wrap
            const addText = (text: string, fontSize: number, isBold = false) => {
                doc.setFontSize(fontSize);
                if (isBold) {
                    doc.setFont("helvetica", "bold");
                } else {
                    doc.setFont("helvetica", "normal");
                }
                
                const lines = doc.splitTextToSize(text, maxWidth);
                lines.forEach((line: string) => {
                    if (yPos > pageHeight - 20) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.text(line, margin, yPos);
                    yPos += fontSize * 0.5;
                });
                yPos += 5;
            };

            // Title
            addText("Interview Report", 20, true);
            yPos += 5;

            // Candidate Info
            addText(`Candidate: ${interviewData.candidateName}`, 12, true);
            addText(`Role: ${interviewData.role}`, 12);
            addText(`Score: ${interviewData.score}/100`, 12);
            addText(`Date: ${new Date().toLocaleDateString()}`, 12);
            yPos += 10;

            // Questions and Answers
            if (interviewData.questions && interviewData.questions.length > 0) {
                addText("Interview Transcript", 16, true);
                yPos += 5;

                interviewData.questions.forEach((q, i) => {
                    addText(`Q${i + 1}: ${q}`, 11, true);
                    
                    if (interviewData.answers && interviewData.answers[i]) {
                        addText(`A${i + 1}: ${interviewData.answers[i]}`, 10);
                    }
                    yPos += 5;
                });
            }

            // Save
            const fileName = `interview-${interviewData.candidateName.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
            doc.save(fileName);
            toast.success("PDF downloaded successfully!");

        } catch (error) {
            console.error("PDF generation error:", error);
            toast.error("Failed to generate PDF");
        }
    };

    return (
        <Button onClick={handleExport} variant="outline">
            📄 Export to PDF
        </Button>
    );
}

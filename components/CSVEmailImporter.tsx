"use client";

import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface CSVEmailImporterProps {
    onImport: (emails: string[]) => void;
}

export default function CSVEmailImporter({ onImport }: CSVEmailImporterProps) {
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);

        try {
            let text = "";
            const fileExtension = file.name.split('.').pop()?.toLowerCase();

            // Handle different file types
            switch (fileExtension) {
                case 'csv':
                case 'txt':
                    text = await file.text();
                    break;

                case 'xlsx':
                case 'xls':
                    text = await parseExcelFile(file);
                    break;

                case 'pdf':
                    text = await parsePDFFile(file);
                    break;

                case 'doc':
                case 'docx':
                    text = await parseWordFile(file);
                    break;

                default:
                    toast.error("Unsupported file format. Please use CSV, TXT, XLSX, XLS, PDF, DOC, or DOCX");
                    setLoading(false);
                    return;
            }

            const emails = parseEmailsFromText(text);

            if (emails.length === 0) {
                toast.error("No valid emails found in file");
                return;
            }

            onImport(emails);
            toast.success(`✅ Imported ${emails.length} email(s) from ${fileExtension?.toUpperCase()} file`);

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (error) {
            console.error("File upload error:", error);
            toast.error(`Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    };

    const parseExcelFile = async (file: File): Promise<string> => {
        const XLSX = await import('xlsx');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        let allText = "";
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const csvText = XLSX.utils.sheet_to_csv(worksheet);
            allText += csvText + "\n";
        });
        
        return allText;
    };

    const parsePDFFile = async (file: File): Promise<string> => {
        try {
            // Use dynamic import with type assertion
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pdfParse = await import('pdf-parse').then(m => (m as any).default || m);
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const data = await pdfParse(buffer);
            return data.text;
        } catch (error) {
            console.error("PDF parsing error:", error);
            throw new Error("PDF parsing failed. Please use CSV, TXT, or Excel files instead.");
        }
    };

    const parseWordFile = async (file: File): Promise<string> => {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    };

    const parseEmailsFromText = (text: string): string[] => {
        // Enhanced email regex to catch more formats
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const matches = text.match(emailRegex);
        
        if (!matches) return [];

        // Remove duplicates and return
        return [...new Set(matches)];
    };

    const downloadTemplate = () => {
        const template = `Email
candidate1@example.com
candidate2@example.com
candidate3@example.com
candidate4@example.com
candidate5@example.com`;

        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'email-template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success("Template downloaded!");
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-2 items-center flex-wrap">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,.xlsx,.xls,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                />
                
                <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="animate-spin mr-2">⏳</span>
                            Processing...
                        </>
                    ) : (
                        "📁 Import File"
                    )}
                </Button>

                <Button
                    onClick={downloadTemplate}
                    variant="ghost"
                    size="sm"
                >
                    ⬇️ Download Template
                </Button>
            </div>
            
            <div className="text-xs text-gray-500">
                Supported formats: CSV, TXT, Excel (XLSX/XLS), PDF, Word (DOC/DOCX)
            </div>
        </div>
    );
}

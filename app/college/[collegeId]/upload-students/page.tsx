"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface StudentRecord {
  name: string;
  email: string;
  rollNumber: string;
  branch?: string;
  cgpa?: number;
  phone?: string;
}

export default function UploadStudentsPage({
  params,
}: {
  params: Promise<{ collegeId: string }>;
}) {
  const { collegeId } = use(params);
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");

  const [file, setFile] = useState<File | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResults(null);

    const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();

    try {
      if (fileExtension === "csv") {
        await parseCSV(selectedFile);
      } else if (fileExtension === "xlsx" || fileExtension === "xls") {
        await parseExcel(selectedFile);
      } else {
        toast.error("Unsupported file format. Please upload CSV or Excel file.");
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error("Failed to parse file");
    }
  };

  const parseCSV = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          const parsedStudents = results.data.map((row: any) => ({
            name: row.name || row.Name || "",
            email: row.email || row.Email || "",
            rollNumber: row.rollNumber || row.RollNumber || row.roll_number || "",
            branch: row.branch || row.Branch || "",
            cgpa: parseFloat(row.cgpa || row.CGPA || "0"),
            phone: row.phone || row.Phone || "",
          }));
          setStudents(parsedStudents);
          toast.success(`Parsed ${parsedStudents.length} student records`);
          resolve();
        },
        error: (error: any) => {
          reject(error);
        },
      });
    });
  };

  const parseExcel = async (file: File) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const parsedStudents = jsonData.map((row: any) => ({
      name: row.name || row.Name || "",
      email: row.email || row.Email || "",
      rollNumber: row.rollNumber || row.RollNumber || row.roll_number || "",
      branch: row.branch || row.Branch || "",
      cgpa: parseFloat(row.cgpa || row.CGPA || "0"),
      phone: row.phone || row.Phone || "",
    }));

    setStudents(parsedStudents);
    toast.success(`Parsed ${parsedStudents.length} student records`);
  };

  const handleUpload = async () => {
    if (!jobId) {
      toast.error("Job posting ID is missing");
      return;
    }

    if (students.length === 0) {
      toast.error("No student data to upload");
      return;
    }

    setUploading(true);

    try {
      const response = await fetch(`/api/colleges/${collegeId}/upload-students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          students,
          jobPostingId: jobId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
        toast.success(
          `Successfully created ${data.created} student accounts! ${
            data.failed > 0 ? `${data.failed} failed.` : ""
          }`
        );
      } else {
        toast.error("Failed to upload students");
      }
    } catch (error) {
      console.error("Error uploading students:", error);
      toast.error("An error occurred");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: "John Doe",
        email: "john@example.com",
        rollNumber: "CS2021001",
        branch: "CSE",
        cgpa: 8.5,
        phone: "1234567890",
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        rollNumber: "CS2021002",
        branch: "ECE",
        cgpa: 9.0,
        phone: "0987654321",
      },
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_upload_template.csv";
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/college/${collegeId}/job-notifications`}
            className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← Back to Notifications
          </Link>
          <h1 className="text-3xl font-bold">Upload Students</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Upload student data via CSV or Excel file
          </p>
        </div>

        {/* Template Download */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Need a template?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Download our CSV template with sample data
              </p>
            </div>
            <Button onClick={downloadTemplate} variant="outline">
              📥 Download Template
            </Button>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload File</h2>

          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <div className="text-6xl mb-4">📄</div>
              <p className="text-lg font-medium mb-2">
                {file ? file.name : "Click to upload or drag and drop"}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                CSV or Excel files only
              </p>
            </label>
          </div>

          {students.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3">
                Preview ({students.length} students)
              </h3>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Roll Number</th>
                      <th className="px-4 py-2 text-left">Branch</th>
                      <th className="px-4 py-2 text-left">CGPA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {students.slice(0, 10).map((student, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2">{student.name}</td>
                        <td className="px-4 py-2">{student.email}</td>
                        <td className="px-4 py-2">{student.rollNumber}</td>
                        <td className="px-4 py-2">{student.branch}</td>
                        <td className="px-4 py-2">{student.cgpa}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {students.length > 10 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                    ... and {students.length - 10} more
                  </p>
                )}
              </div>

              <div className="mt-6 flex gap-2">
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload Students"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setStudents([]);
                    setResults(null);
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {results && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Results</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {results.created.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Successfully Created
                </div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {results.failed.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
              </div>
            </div>

            {results.created.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3 text-green-600 dark:text-green-400">
                  ✓ Created Students
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {results.created.map((student: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-green-50 dark:bg-green-900/20 rounded text-sm"
                    >
                      <div className="font-medium">{student.name}</div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {student.email} • Password: {student.password}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.failed.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-red-600 dark:text-red-400">
                  ✗ Failed Records
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {results.failed.map((failure: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-red-50 dark:bg-red-900/20 rounded text-sm"
                    >
                      <div className="font-medium">
                        {failure.record.name || "Unknown"}
                      </div>
                      <div className="text-red-600 dark:text-red-400">
                        Error: {failure.error}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

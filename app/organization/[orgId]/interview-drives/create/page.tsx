"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface College {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  branch: string;
  cgpa: number;
  collegeId: string;
}

export default function CreateDrivePage({ params }: { params: { orgId: string } }) {
  const [step, setStep] = useState(1);
  const [colleges, setColleges] = useState<College[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [driveData, setDriveData] = useState({
    name: "",
    description: "",
    role: "",
    selectedColleges: [] as string[],
  });

  const [interviewConfig, setInterviewConfig] = useState({
    level: "mid-level",
    type: "technical",
    techstack: [] as string[],
    amount: 5,
  });

  useEffect(() => {
    fetchColleges();
  }, [params.orgId]);

  useEffect(() => {
    if (driveData.selectedColleges.length > 0) {
      fetchStudents();
    }
  }, [driveData.selectedColleges]);

  const fetchColleges = async () => {
    try {
      const response = await fetch(`/api/organization/${params.orgId}/colleges`);
      if (response.ok) {
        const { colleges } = await response.json();
        setColleges(colleges);
      }
    } catch (error) {
      console.error("Error fetching colleges:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const allStudents: Student[] = [];
      for (const collegeId of driveData.selectedColleges) {
        const response = await fetch(`/api/colleges/${collegeId}/students`);
        if (response.ok) {
          const { students } = await response.json();
          allStudents.push(...students);
        }
      }
      setStudents(allStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleCreateDrive = async () => {
    setLoading(true);
    try {
      // Step 1: Create interview drive
      const driveResponse = await fetch(`/api/organization/${params.orgId}/interview-drives`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...driveData,
          colleges: driveData.selectedColleges,
        }),
      });

      if (!driveResponse.ok) {
        throw new Error("Failed to create drive");
      }

      const { driveId } = await driveResponse.json();

      // Step 2: Tag students
      await fetch(`/api/interview-drives/${driveId}/tag-students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: selectedStudents }),
      });

      // Step 3: Generate questions (using existing AI)
      const questionsResponse = await fetch("/api/recruiter/generate-questions-hf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: driveData.role,
          level: interviewConfig.level,
          type: interviewConfig.type,
          techstack: interviewConfig.techstack,
          amount: interviewConfig.amount,
        }),
      });

      if (!questionsResponse.ok) {
        throw new Error("Failed to generate questions");
      }

      const { questions } = await questionsResponse.json();

      // Step 4: Create bulk interviews
      await fetch(`/api/interview-drives/${driveId}/create-interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions,
          techstack: interviewConfig.techstack,
          level: interviewConfig.level,
          type: interviewConfig.type,
        }),
      });

      alert(`✅ Interview drive created successfully! ${selectedStudents.length} interviews created.`);
      router.push(`/organization/${params.orgId}/interview-drives`);
    } catch (error) {
      console.error("Error creating drive:", error);
      alert("❌ Failed to create interview drive");
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const selectAllStudents = () => {
    setSelectedStudents(students.map((s) => s.id));
  };

  const deselectAllStudents = () => {
    setSelectedStudents([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/organization/${params.orgId}/interview-drives`}
            className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← Back to Drives
          </Link>
          <h1 className="text-3xl font-bold">Create Interview Drive</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Step {step} of 4: {
              step === 1 ? "Drive Details" :
              step === 2 ? "Select Colleges" :
              step === 3 ? "Select Students" :
              "Interview Configuration"
            }
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded ${
                  s <= step ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"
                } ${s !== 4 ? "mr-2" : ""}`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Drive Details */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Drive Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Drive Name *</label>
                <input
                  type="text"
                  required
                  value={driveData.name}
                  onChange={(e) => setDriveData({ ...driveData, name: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., Campus Placement Drive 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={driveData.description}
                  onChange={(e) => setDriveData({ ...driveData, description: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  rows={3}
                  placeholder="Brief description of the drive"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Job Role *</label>
                <input
                  type="text"
                  required
                  value={driveData.role}
                  onChange={(e) => setDriveData({ ...driveData, role: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., Software Developer"
                />
              </div>
              <Button
                onClick={() => setStep(2)}
                disabled={!driveData.name || !driveData.role}
              >
                Next: Select Colleges →
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Select Colleges */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Select Colleges</h2>
            <div className="space-y-3 mb-4">
              {colleges.map((college) => (
                <label
                  key={college.id}
                  className="flex items-center p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={driveData.selectedColleges.includes(college.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setDriveData({
                          ...driveData,
                          selectedColleges: [...driveData.selectedColleges, college.id],
                        });
                      } else {
                        setDriveData({
                          ...driveData,
                          selectedColleges: driveData.selectedColleges.filter(
                            (id) => id !== college.id
                          ),
                        });
                      }
                    }}
                    className="mr-3"
                  />
                  <span className="font-medium">{college.name}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={driveData.selectedColleges.length === 0}
              >
                Next: Select Students →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Select Students */}
        {step === 3 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Select Students ({selectedStudents.length} selected)
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllStudents}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAllStudents}>
                  Deselect All
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto mb-4">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left">
                      <input
                        type="checkbox"
                        checked={selectedStudents.length === students.length && students.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectAllStudents();
                          } else {
                            deselectAllStudents();
                          }
                        }}
                      />
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase">Roll No</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase">Branch</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase">CGPA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div>
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-2">{student.rollNumber}</td>
                      <td className="px-4 py-2">{student.branch}</td>
                      <td className="px-4 py-2">{student.cgpa.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                ← Back
              </Button>
              <Button onClick={() => setStep(4)} disabled={selectedStudents.length === 0}>
                Next: Configure Interview →
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Interview Configuration */}
        {step === 4 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Interview Configuration</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Experience Level</label>
                <select
                  value={interviewConfig.level}
                  onChange={(e) => setInterviewConfig({ ...interviewConfig, level: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="junior">Junior (1-3 years)</option>
                  <option value="mid-level">Mid-Level (3-5 years)</option>
                  <option value="senior">Senior (5+ years)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Interview Type</label>
                <select
                  value={interviewConfig.type}
                  onChange={(e) => setInterviewConfig({ ...interviewConfig, type: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="technical">Technical</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Number of Questions</label>
                <select
                  value={interviewConfig.amount}
                  onChange={(e) => setInterviewConfig({ ...interviewConfig, amount: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={7}>7 Questions</option>
                  <option value={10}>10 Questions</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tech Stack (comma-separated)
                </label>
                <input
                  type="text"
                  value={interviewConfig.techstack.join(", ")}
                  onChange={(e) =>
                    setInterviewConfig({
                      ...interviewConfig,
                      techstack: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., JavaScript, React, Node.js"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-2">Summary</h3>
              <ul className="space-y-1 text-sm">
                <li>📋 Drive: {driveData.name}</li>
                <li>💼 Role: {driveData.role}</li>
                <li>🏫 Colleges: {driveData.selectedColleges.length}</li>
                <li>👨‍🎓 Students: {selectedStudents.length}</li>
                <li>❓ Questions: {interviewConfig.amount}</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>
                ← Back
              </Button>
              <Button onClick={handleCreateDrive} disabled={loading}>
                {loading ? "Creating..." : "🚀 Create Drive & Send Interviews"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

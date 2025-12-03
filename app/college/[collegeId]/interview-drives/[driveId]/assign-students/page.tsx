"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
}

interface InterviewDrive {
  id: string;
  name: string;
  role: string;
  description: string;
  organizationId: string;
  interviewConfig?: {
    level: string;
    type: string;
    techstack: string[];
    amount: number;
  };
}

export default function AssignStudentsPage({
  params,
}: {
  params: Promise<{ collegeId: string; driveId: string }>;
}) {
  const { collegeId, driveId } = use(params);
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [drive, setDrive] = useState<InterviewDrive | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, [collegeId, driveId]);

  const fetchData = async () => {
    try {
      // Fetch interview drive details
      const driveResponse = await fetch(`/api/interview-drives/${driveId}`);
      if (driveResponse.ok) {
        const driveData = await driveResponse.json();
        setDrive(driveData.drive || driveData);
      }

      // Fetch students from college
      const studentsResponse = await fetch(`/api/colleges/${collegeId}/students`);
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        setStudents(studentsData.students || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s.id));
    }
  };

  const handleAssignStudents = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }

    setAssigning(true);
    try {
      const response = await fetch(
        `/api/interview-drives/${driveId}/assign-students`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            collegeId,
            studentIds: selectedStudents,
          }),
        }
      );

      if (response.ok) {
        toast.success(
          `Successfully assigned ${selectedStudents.length} student(s) to the interview drive`
        );
        router.push(`/college/${collegeId}/job-notifications`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to assign students");
      }
    } catch (error) {
      console.error("Error assigning students:", error);
      toast.error("An error occurred");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold">Assign Students to Interview Drive</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Select students to participate in this interview drive
          </p>
        </div>

        {/* Drive Details */}
        {drive && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Interview Drive Details</h2>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Drive Name:</span> {drive.name}
              </div>
              <div>
                <span className="font-medium">Role:</span> {drive.role}
              </div>
              <div>
                <span className="font-medium">Description:</span> {drive.description}
              </div>
              {drive.interviewConfig && (
                <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Level</div>
                    <div className="font-semibold capitalize">{drive.interviewConfig.level}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Type</div>
                    <div className="font-semibold capitalize">{drive.interviewConfig.type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Questions</div>
                    <div className="font-semibold">{drive.interviewConfig.amount}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Student Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Select Students</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedStudents.length} of {students.length} selected
              </span>
              <Button onClick={handleSelectAll} variant="outline" size="sm">
                {selectedStudents.length === students.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-2">No Students Found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Please add students to your college first
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
                {students.map((student) => (
                  <label
                    key={student.id}
                    className="flex items-center p-4 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleToggleStudent(student.id)}
                      className="mr-4 w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {student.email} • {student.phone}
                      </div>
                      {student.skills && student.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {student.skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAssignStudents}
                  disabled={assigning || selectedStudents.length === 0}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {assigning ? "Assigning..." : `Assign ${selectedStudents.length} Student(s)`}
                </Button>
                <Button
                  onClick={() => router.push(`/college/${collegeId}/job-notifications`)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

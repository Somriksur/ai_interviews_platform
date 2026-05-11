"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CollegeStudentsPage({ params }: { params: Promise<{ collegeId: string }> }) {
  const [collegeId, setCollegeId] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    rollNumber: "",
    branch: "",
    year: 1,
    cgpa: "",
    skills: "",
  });

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setCollegeId(resolvedParams.collegeId);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (collegeId) {
      fetchStudents();
    }
  }, [collegeId]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/colleges/${collegeId}/students`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/colleges/${collegeId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          cgpa: parseFloat(formData.cgpa as string) || 0,
          skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        toast.success("Student added successfully!");
        setShowAddModal(false);
        setFormData({
          name: "",
          email: "",
          rollNumber: "",
          branch: "",
          year: 1,
          cgpa: "",
          skills: "",
        });
        fetchStudents();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to add student");
      }
    } catch (error) {
      console.error("Error adding student:", error);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditStudent = (student: any) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      rollNumber: student.rollNumber,
      branch: student.branch,
      year: student.year,
      cgpa: student.cgpa.toString(),
      skills: Array.isArray(student.skills) ? student.skills.join(", ") : "",
    });
    setShowEditModal(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/students/${editingStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          cgpa: parseFloat(formData.cgpa as string) || 0,
          skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        toast.success("Student updated successfully!");
        setShowEditModal(false);
        setEditingStudent(null);
        setFormData({
          name: "",
          email: "",
          rollNumber: "",
          branch: "",
          year: 1,
          cgpa: "",
          skills: "",
        });
        fetchStudents();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update student");
      }
    } catch (error) {
      console.error("Error updating student:", error);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to delete ${studentName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Student deleted successfully!");
        fetchStudents();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete student");
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Something went wrong");
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
        <div className="mb-8">
          <Link
            href={`/college/${collegeId}/dashboard`}
            className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">Students</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your college students
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Student List</h2>
            <Button onClick={() => setShowAddModal(true)}>Add Student</Button>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👨‍🎓</div>
              <h3 className="text-xl font-semibold mb-2">No students yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start by adding students to your college
              </p>
              <Button onClick={() => setShowAddModal(true)}>Add Your First Student</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Roll Number</th>
                    <th className="text-left p-3">Branch</th>
                    <th className="text-left p-3">Year</th>
                    <th className="text-left p-3">CGPA</th>
                    <th className="text-left p-3">Resume Score</th>
                    <th className="text-right p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td 
                        className="p-3 cursor-pointer text-blue-600 hover:text-blue-700 hover:underline"
                        onClick={() => window.location.href = `/student/${student.id}/profile`}
                      >
                        {student.name}
                      </td>
                      <td className="p-3">{student.email}</td>
                      <td className="p-3">{student.rollNumber}</td>
                      <td className="p-3">{student.branch}</td>
                      <td className="p-3">{student.year}</td>
                      <td className="p-3">{student.cgpa}</td>
                      <td className="p-3">
                        {student.resumeScore !== undefined && student.resumeScore !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  student.resumeScore >= 75
                                    ? 'bg-green-500'
                                    : student.resumeScore >= 50
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${student.resumeScore}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{student.resumeScore}%</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No resume</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditStudent(student);
                          }}
                          className="text-blue-600 hover:text-blue-700 mr-3"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStudent(student.id, student.name);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Student Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Add New Student</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 border rounded-lg bg-background"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3 border rounded-lg bg-background"
                    placeholder="john@example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Roll Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.rollNumber}
                      onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                      className="w-full p-3 border rounded-lg bg-background"
                      placeholder="CS2021001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Branch *</label>
                    <input
                      type="text"
                      required
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      className="w-full p-3 border rounded-lg bg-background"
                      placeholder="Computer Science"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Year *</label>
                    <select
                      required
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      className="w-full p-3 border rounded-lg bg-background"
                    >
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">CGPA *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="10"
                      step="0.01"
                      value={formData.cgpa}
                      onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                      className="w-full p-3 border rounded-lg bg-background"
                      placeholder="8.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    className="w-full p-3 border rounded-lg bg-background"
                    placeholder="JavaScript, React, Node.js"
                  />
                  <p className="text-sm text-gray-500 mt-1">Separate skills with commas</p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" className="flex-1" disabled={submitting}>
                    {submitting ? "Adding..." : "Add Student"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Student Modal */}
        {showEditModal && editingStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Student</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingStudent(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleUpdateStudent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 border rounded-lg bg-background"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3 border rounded-lg bg-background"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Roll Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.rollNumber}
                      onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                      className="w-full p-3 border rounded-lg bg-background"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Branch *</label>
                    <input
                      type="text"
                      required
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      className="w-full p-3 border rounded-lg bg-background"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Year *</label>
                    <select
                      required
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      className="w-full p-3 border rounded-lg bg-background"
                    >
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">CGPA *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="10"
                      step="0.01"
                      value={formData.cgpa}
                      onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                      className="w-full p-3 border rounded-lg bg-background"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    className="w-full p-3 border rounded-lg bg-background"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" className="flex-1" disabled={submitting}>
                    {submitting ? "Updating..." : "Update Student"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingStudent(null);
                    }}
                    className="flex-1 bg-gray-500 hover:bg-gray-600"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

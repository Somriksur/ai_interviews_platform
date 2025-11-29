"use client";

import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface College {
  id: string;
  name: string;
  location: string;
  contactEmail: string;
  contactPhone: string;
  stats: {
    totalStudents: number;
    interviewsCompleted: number;
    averagePlacementScore: number;
  };
}

export default function CollegesPage({ params }: { params: { orgId: string } }) {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    contactEmail: "",
    contactPhone: "",
  });
  // const router = useRouter();

  useEffect(() => {
    fetchColleges();
  }, [params.orgId]);

  const fetchColleges = async () => {
    try {
      const response = await fetch(`/api/organization/${params.orgId}/colleges`);
      if (response.ok) {
        const { colleges } = await response.json();
        setColleges(colleges);
      }
    } catch (error) {
      console.error("Error fetching colleges:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/organization/${params.orgId}/colleges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("✅ College added successfully!");
        setShowAddForm(false);
        setFormData({ name: "", location: "", contactEmail: "", contactPhone: "" });
        fetchColleges();
      } else {
        alert("❌ Failed to add college");
      }
    } catch (error) {
      console.error("Error adding college:", error);
      alert("❌ An error occurred");
    }
  };

  const handleDeleteCollege = async (collegeId: string) => {
    if (!confirm("Are you sure you want to delete this college?")) return;

    try {
      const response = await fetch(`/api/colleges/${collegeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("✅ College deleted successfully!");
        fetchColleges();
      } else {
        alert("❌ Failed to delete college");
      }
    } catch (error) {
      console.error("Error deleting college:", error);
      alert("❌ An error occurred");
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href={`/organization/${params.orgId}/dashboard`}
              className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Manage Colleges</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Add, edit, and manage colleges under your organization
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>+ Add College</Button>
        </div>

        {/* Add College Form */}
        {showAddForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Add New College</h2>
            <form onSubmit={handleAddCollege} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">College Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., IIT Bombay"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., Mumbai, Maharashtra"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Contact Email *</label>
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="placement@college.edu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="+91-1234567890"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Add College</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Colleges List */}
        {colleges.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🏫</div>
            <h3 className="text-xl font-semibold mb-2">No Colleges Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start by adding your first college
            </p>
            <Button onClick={() => setShowAddForm(true)}>+ Add College</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {colleges.map((college) => (
              <div
                key={college.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{college.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {college.location}
                    </p>
                  </div>
                  <div className="text-3xl">🏫</div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span>📧</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {college.contactEmail}
                    </span>
                  </div>
                  {college.contactPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <span>📞</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {college.contactPhone}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{college.stats.totalStudents}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{college.stats.interviewsCompleted}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Interviews</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {college.stats.averagePlacementScore.toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Avg Score</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/college/${college.id}/dashboard`}
                    className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    View Dashboard
                  </Link>
                  <button
                    onClick={() => handleDeleteCollege(college.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

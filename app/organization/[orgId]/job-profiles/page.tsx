"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface JobProfile {
  id: string;
  title: string;
  company: string;
  description: string;
  requiredSkills: string[];
  minimumScore: number;
  salaryBand: {
    min: number;
    max: number;
    category: string;
  };
}

export default function JobProfilesPage({ params }: { params: { orgId: string } }) {
  const [jobs, setJobs] = useState<JobProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    description: "",
    requiredSkills: "",
    minimumScore: 60,
    salaryMin: 300000,
    salaryMax: 500000,
    salaryCategory: "low",
  });

  useEffect(() => {
    fetchJobs();
  }, [params.orgId]);

  const fetchJobs = async () => {
    try {
      const response = await fetch(`/api/job-profiles?organizationId=${params.orgId}`);
      if (response.ok) {
        const { jobs } = await response.json();
        setJobs(jobs);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/job-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: params.orgId,
          title: formData.title,
          company: formData.company,
          description: formData.description,
          requiredSkills: formData.requiredSkills.split(",").map((s) => s.trim()),
          minimumScore: formData.minimumScore,
          communicationRequirement: 60,
          experienceLevel: "0-2 years",
          salaryBand: {
            min: formData.salaryMin,
            max: formData.salaryMax,
            category: formData.salaryCategory,
          },
        }),
      });

      if (response.ok) {
        alert("✅ Job profile added successfully!");
        setShowAddForm(false);
        setFormData({
          title: "",
          company: "",
          description: "",
          requiredSkills: "",
          minimumScore: 60,
          salaryMin: 300000,
          salaryMax: 500000,
          salaryCategory: "low",
        });
        fetchJobs();
      } else {
        alert("❌ Failed to add job profile");
      }
    } catch (error) {
      console.error("Error adding job:", error);
      alert("❌ An error occurred");
    }
  };

  const formatSalary = (amount: number) => {
    return `₹${(amount / 100000).toFixed(1)}L`;
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
            <h1 className="text-3xl font-bold">Job Profiles</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage job openings for student matching
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>+ Add Job Profile</Button>
        </div>

        {/* Add Job Form */}
        {showAddForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Add New Job Profile</h2>
            <form onSubmit={handleAddJob} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Job Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., Software Developer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Company *</label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., Google"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  rows={3}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Required Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.requiredSkills}
                  onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., JavaScript, React, Node.js"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Minimum Score</label>
                <input
                  type="number"
                  value={formData.minimumScore}
                  onChange={(e) =>
                    setFormData({ ...formData, minimumScore: parseInt(e.target.value) })
                  }
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Salary Category</label>
                <select
                  value={formData.salaryCategory}
                  onChange={(e) => setFormData({ ...formData, salaryCategory: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="low">Entry Level (2-4 LPA)</option>
                  <option value="medium">Mid Range (4-8 LPA)</option>
                  <option value="high">High Range (8+ LPA)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Salary Min (₹)</label>
                <input
                  type="number"
                  value={formData.salaryMin}
                  onChange={(e) => setFormData({ ...formData, salaryMin: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  step="100000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Salary Max (₹)</label>
                <input
                  type="number"
                  value={formData.salaryMax}
                  onChange={(e) => setFormData({ ...formData, salaryMax: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  step="100000"
                />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit">Add Job Profile</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">💼</div>
            <h3 className="text-xl font-semibold mb-2">No Job Profiles Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Add job profiles for student-job matching
            </p>
            <Button onClick={() => setShowAddForm(true)}>+ Add Job Profile</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-1">{job.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{job.company}</p>
                </div>

                <p className="text-sm mb-4 line-clamp-2">{job.description}</p>

                <div className="mb-4">
                  <div className="text-sm font-medium mb-2">Required Skills:</div>
                  <div className="flex flex-wrap gap-1">
                    {job.requiredSkills.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkills.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">
                        +{job.requiredSkills.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Salary Range:</span>
                    <span className="font-semibold">
                      {formatSalary(job.salaryBand.min)} - {formatSalary(job.salaryBand.max)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Min Score:</span>
                    <span className="font-semibold">{job.minimumScore}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

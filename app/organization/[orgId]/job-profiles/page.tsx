"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function JobProfilesPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);
  const router = useRouter();
  const [jobs, setJobs] = useState<JobProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Check user authorization
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          alert("⚠️ Please log in to access this page.");
          router.push("/auth/signin");
          return;
        }

        const { user } = await response.json();
        if (user.role !== "organization") {
          alert("⚠️ Access Denied: This page is only accessible to organization users. You are logged in as a " + user.role + " user.");
          router.push("/");
          return;
        }

        setAuthChecked(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        alert("⚠️ Authentication error. Please log in again.");
        router.push("/auth/signin");
      }
    };

    checkAuth();
  }, [router]);
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

  // Calculate salary tiers based on min and max salary
  const calculateSalaryTiers = (min: number, max: number) => {
    const range = max - min;
    const lowMax = min + (range * 0.4); // First 40% of range
    const midMax = min + (range * 0.7); // Next 30% of range
    // High is remaining 30%
    
    return {
      low: { min, max: lowMax },
      medium: { min: lowMax, max: midMax },
      high: { min: midMax, max }
    };
  };

  // Update salary when min or max changes
  const handleSalaryChange = (field: 'salaryMin' | 'salaryMax', value: number) => {
    setFormData({ ...formData, [field]: value });
  };

  useEffect(() => {
    if (authChecked) {
      fetchJobs();
    }
  }, [orgId, authChecked]);

  const fetchJobs = async () => {
    try {
      const response = await fetch(`/api/job-profiles?organizationId=${orgId}`);
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
          organizationId: orgId,
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
        const data = await response.json();
        const jobId = data.id || data.jobId || data.jobPostingId;
        
        alert("✅ Job profile created! Now tag colleges for this job.");
        
        // Redirect to tag colleges page - this is required for notifications
        if (jobId) {
          router.push(`/organization/${orgId}/tag-colleges?jobId=${jobId}`);
        } else {
          // Fallback if no ID returned
          alert("⚠️ Job created but couldn't get ID. Please tag colleges manually.");
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
        }
      } else {
        alert("❌ Failed to add job profile");
      }
    } catch (error) {
      console.error("Error adding job:", error);
      alert("❌ An error occurred");
    }
  };

  const handleDeleteJob = async (jobId: string, jobTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/job-profiles/${jobId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("✅ Job profile deleted successfully!");
        fetchJobs(); // Refresh the list
      } else {
        alert("❌ Failed to delete job profile");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("❌ An error occurred");
    }
  };

  const formatSalary = (amount: number) => {
    return `₹${(amount / 100000).toFixed(1)}L`;
  };

  // Show loading while checking auth or fetching data
  if (!authChecked || loading) {
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
              href={`/organization/${orgId}/dashboard`}
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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Salary Range</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Minimum (₹)</label>
                    <input
                      type="number"
                      value={formData.salaryMin}
                      onChange={(e) => handleSalaryChange('salaryMin', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      step="100000"
                      placeholder="e.g., 500000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Maximum (₹)</label>
                    <input
                      type="number"
                      value={formData.salaryMax}
                      onChange={(e) => handleSalaryChange('salaryMax', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      step="100000"
                      placeholder="e.g., 1000000"
                    />
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Salary Tiers (Auto-calculated for Student Categorization)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(() => {
                    const tiers = calculateSalaryTiers(formData.salaryMin, formData.salaryMax);
                    return (
                      <>
                        <div className="p-3 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-950">
                          <div className="text-center">
                            <div className="text-2xl mb-1">💼</div>
                            <div className="font-semibold text-sm mb-1">Low Tier</div>
                            <div className="text-blue-600 dark:text-blue-400 font-bold">
                              {formatSalary(tiers.low.min)} - {formatSalary(tiers.low.max)}
                            </div>
                          </div>
                        </div>
                        <div className="p-3 border-2 border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-950">
                          <div className="text-center">
                            <div className="text-2xl mb-1">💰</div>
                            <div className="font-semibold text-sm mb-1">Mid Tier</div>
                            <div className="text-green-600 dark:text-green-400 font-bold">
                              {formatSalary(tiers.medium.min)} - {formatSalary(tiers.medium.max)}
                            </div>
                          </div>
                        </div>
                        <div className="p-3 border-2 border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-950">
                          <div className="text-center">
                            <div className="text-2xl mb-1">🌟</div>
                            <div className="font-semibold text-sm mb-1">High Tier</div>
                            <div className="text-purple-600 dark:text-purple-400 font-bold">
                              {formatSalary(tiers.high.min)} - {formatSalary(tiers.high.max)}
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Students will be categorized into these tiers based on their interview performance
                </p>
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
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Min Score:</span>
                    <span className="font-semibold">{job.minimumScore}</span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Link
                      href={`/organization/${orgId}/interview-drives/create?jobId=${job.id}`}
                      className="block w-full"
                    >
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full"
                      >
                        📋 Create Interview Drive
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteJob(job.id, job.title)}
                      className="w-full"
                    >
                      🗑️ Delete Job
                    </Button>
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

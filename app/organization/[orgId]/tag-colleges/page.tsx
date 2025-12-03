"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { X, CheckCircle, Clock, XCircle } from "lucide-react";

interface College {
  id: string;
  name: string;
  location: string;
  contactEmail: string;
  normalizedName?: string;
}

interface TaggedCollege extends College {
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  taggedAt?: string;
}

export default function TagCollegesPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const searchParams = useSearchParams();
  const existingJobId = searchParams.get('jobId'); // Get jobId from URL if provided
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<College[]>([]);
  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);
  const [taggedColleges, setTaggedColleges] = useState<TaggedCollege[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingTagged, setLoadingTagged] = useState(false);

  const [jobData, setJobData] = useState({
    role: "",
    skills: "",
    vacancies: "",
    salaryMin: "",
    salaryMax: "",
    salaryCategory: "mid" as "high" | "mid" | "low",
    description: "",
  });

  // Load already tagged colleges if editing existing job
  useEffect(() => {
    const loadTaggedColleges = async () => {
      if (!existingJobId) return;

      setLoadingTagged(true);
      try {
        const response = await fetch(`/api/job-postings/${existingJobId}`);
        if (response.ok) {
          const jobData = await response.json();
          if (jobData.taggedColleges && Array.isArray(jobData.taggedColleges)) {
            // Fetch full college details for each tagged college
            const collegePromises = jobData.taggedColleges.map(async (collegeName: string) => {
              const searchResponse = await fetch(
                `/api/colleges/search?q=${encodeURIComponent(collegeName)}`
              );
              if (searchResponse.ok) {
                const { colleges } = await searchResponse.json();
                const college = colleges.find((c: College) => 
                  c.name.toLowerCase() === collegeName.toLowerCase()
                );
                if (college) {
                  return {
                    ...college,
                    approvalStatus: jobData.collegeApprovals?.[collegeName] || 'pending',
                    taggedAt: new Date().toISOString(),
                  };
                }
              }
              return null;
            });

            const colleges = (await Promise.all(collegePromises)).filter(Boolean) as TaggedCollege[];
            setTaggedColleges(colleges);
            setSelectedColleges(colleges.map(c => c.id));
          }
        }
      } catch (error) {
        console.error("Error loading tagged colleges:", error);
      } finally {
        setLoadingTagged(false);
      }
    };

    loadTaggedColleges();
  }, [existingJobId]);

  // Search colleges as user types
  useEffect(() => {
    const searchColleges = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/colleges/search?q=${encodeURIComponent(searchQuery)}`
        );
        if (response.ok) {
          const { colleges } = await response.json();
          // Filter out already tagged colleges
          const filteredColleges = colleges.filter(
            (college: College) => !selectedColleges.includes(college.id)
          );
          setSearchResults(filteredColleges);
        }
      } catch (error) {
        console.error("Error searching colleges:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchColleges, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedColleges]);

  const addCollege = (college: College) => {
    if (!selectedColleges.includes(college.id)) {
      setSelectedColleges((prev) => [...prev, college.id]);
      setTaggedColleges((prev) => [...prev, { ...college, approvalStatus: 'pending' }]);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const removeCollege = (collegeId: string) => {
    setSelectedColleges((prev) => prev.filter((id) => id !== collegeId));
    setTaggedColleges((prev) => prev.filter((c) => c.id !== collegeId));
  };

  const getApprovalStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge className="bg-yellow-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedColleges.length === 0) {
      toast.error("Please select at least one college");
      return;
    }

    setSubmitting(true);

    try {
      let jobId = existingJobId;

      // If no existing job ID, create a new job posting
      if (!existingJobId) {
        const jobResponse = await fetch(`/api/organization/${orgId}/job-postings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: jobData.role,
            skills: jobData.skills.split(",").map((s) => s.trim()),
            vacancies: parseInt(jobData.vacancies),
            salaryRange: {
              min: parseInt(jobData.salaryMin),
              max: parseInt(jobData.salaryMax),
              category: jobData.salaryCategory,
            },
            description: jobData.description,
            taggedColleges: selectedColleges,
          }),
        });

        if (!jobResponse.ok) {
          throw new Error("Failed to create job posting");
        }

        const response = await jobResponse.json();
        jobId = response.id || response.jobId || response.jobPostingId;
      }

      // Tag colleges to the job
      const tagResponse = await fetch(`/api/job-postings/${jobId}/tag-colleges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeIds: selectedColleges }),
      });

      if (!tagResponse.ok) {
        throw new Error("Failed to tag colleges");
      }

      toast.success(
        `${selectedColleges.length} college(s) tagged successfully! Redirecting to create interview drive...`
      );

      // Redirect to create interview drive with jobId and tagged colleges
      const collegesParam = selectedColleges.join(',');
      setTimeout(() => {
        window.location.href = `/organization/${orgId}/interview-drives/create?jobId=${jobId}&colleges=${collegesParam}`;
      }, 1500);
    } catch (error) {
      console.error("Error:", error);
      toast.error(existingJobId ? "Failed to tag colleges" : "Failed to create job posting");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/organization/${orgId}/dashboard`}
            className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Tag Colleges for Recruitment</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create a job posting and tag colleges to notify them
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Job Details Section - Only show if creating new job */}
          {!existingJobId && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Job Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Job Role *</label>
                <input
                  type="text"
                  required
                  value={jobData.role}
                  onChange={(e) => setJobData({ ...jobData, role: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., Software Developer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Number of Vacancies *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={jobData.vacancies}
                  onChange={(e) => setJobData({ ...jobData, vacancies: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., 10"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Required Skills (comma-separated) *
                </label>
                <input
                  type="text"
                  required
                  value={jobData.skills}
                  onChange={(e) => setJobData({ ...jobData, skills: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., JavaScript, React, Node.js"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Salary Min (₹/year) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={jobData.salaryMin}
                  onChange={(e) => setJobData({ ...jobData, salaryMin: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., 300000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Salary Max (₹/year) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={jobData.salaryMax}
                  onChange={(e) => setJobData({ ...jobData, salaryMax: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., 500000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Salary Category *
                </label>
                <select
                  value={jobData.salaryCategory}
                  onChange={(e) =>
                    setJobData({
                      ...jobData,
                      salaryCategory: e.target.value as "high" | "mid" | "low",
                    })
                  }
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="low">Entry Level (2-4 LPA)</option>
                  <option value="mid">Mid Range (4-8 LPA)</option>
                  <option value="high">High Range (8+ LPA)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Job Description *
                </label>
                <textarea
                  required
                  value={jobData.description}
                  onChange={(e) =>
                    setJobData({ ...jobData, description: e.target.value })
                  }
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  rows={4}
                  placeholder="Describe the job role, responsibilities, and requirements..."
                />
              </div>
            </div>
            </div>
          )}

          {/* Info message when tagging existing job */}
          {existingJobId && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm">
                <strong>Tagging colleges for existing job posting</strong>
                <br />
                Job ID: {existingJobId}
              </p>
            </div>
          )}

          {/* Tagged Colleges Section */}
          {(taggedColleges.length > 0 || loadingTagged) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                Tagged Colleges ({taggedColleges.length})
              </h2>
              {loadingTagged ? (
                <p className="text-sm text-gray-500">Loading tagged colleges...</p>
              ) : (
              <div className="space-y-3">
                {taggedColleges.map((college) => (
                  <Card key={college.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{college.name}</h3>
                          {getApprovalStatusBadge(college.approvalStatus)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <p>{college.location}</p>
                          <p>{college.contactEmail}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCollege(college.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              )}
            </div>
          )}

          {/* College Search Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Add More Colleges</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Search Colleges
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                placeholder="Type college name to search..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Search is case-insensitive. College names will be displayed with their original casing.
              </p>
            </div>

            {/* Search Results */}
            {loading && <p className="text-sm text-gray-500">Searching...</p>}

            {searchResults.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium">
                  {searchResults.length} college(s) found:
                </p>
                {searchResults.map((college) => (
                  <div
                    key={college.id}
                    onClick={() => addCollege(college)}
                    className="w-full flex items-center p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-left"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{college.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {college.location} • {college.contactEmail}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        addCollege(college);
                      }}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && !loading && searchResults.length === 0 && (
              <p className="text-sm text-gray-500">
                No colleges found matching "{searchQuery}"
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting || selectedColleges.length === 0}>
              {submitting 
                ? (existingJobId ? "Tagging..." : "Creating...") 
                : (existingJobId ? "Tag Colleges" : "Create Job & Tag Colleges")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

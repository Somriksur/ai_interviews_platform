"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RecommendationBadge } from "@/components/reports/RecommendationBadge";
import { ComprehensiveReportView } from "@/components/reports/ComprehensiveReportView";

export default function JobStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;
  const jobId = params.jobId as string;

  const [loading, setLoading] = useState(true);
  const [jobPosting, setJobPosting] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [selections, setSelections] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [filterCollege, setFilterCollege] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterScoreRange, setFilterScoreRange] = useState<string>("all");
  const [filterRecommendation, setFilterRecommendation] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("none");

  useEffect(() => {
    fetchData();
  }, [jobId]);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/job-postings/${jobId}/students`);
      if (response.ok) {
        const data = await response.json();
        setJobPosting(data.jobPosting);
        setStudents(data.students);
        setColleges(data.colleges);
        setReports(data.reports);
        setSelections(data.selections);
      } else {
        toast.error("Failed to fetch students");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleBulkAction = async (action: 'select' | 'shortlist' | 'reject') => {
    if (selectedStudents.size === 0) {
      toast.error("Please select at least one student");
      return;
    }

    try {
      const response = await fetch(`/api/job-postings/${jobId}/select-students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: Array.from(selectedStudents),
          action,
        }),
      });

      if (response.ok) {
        toast.success(`Students ${action}ed successfully`);
        setSelectedStudents(new Set());
        fetchData();
      } else {
        toast.error(`Failed to ${action} students`);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong");
    }
  };

  const getStudentReport = (studentId: string) => {
    return reports.find((r: any) => r.studentId === studentId);
  };

  const getStudentSelection = (studentId: string) => {
    return selections.find((s: any) => s.studentId === studentId);
  };

  const getSelectionBadge = (status: string) => {
    const badges: any = {
      select: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      shortlist: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      reject: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return badges[status] || "";
  };

  const filteredStudents = useMemo(() => students
    .filter((student) => {
      // Filter by college
      if (filterCollege !== "all" && student.collegeId !== filterCollege) return false;
      
      // Filter by selection status
      const selection = getStudentSelection(student.id);
      if (filterStatus !== "all") {
        if (filterStatus === "unreviewed" && selection) return false;
        if (filterStatus !== "unreviewed" && selection?.status !== filterStatus) return false;
      }
      
      // Filter by score range
      const report = getStudentReport(student.id);
      if (filterScoreRange !== "all" && report) {
        const score = report.overallScore;
        if (filterScoreRange === "excellent" && score < 85) return false;
        if (filterScoreRange === "good" && (score < 70 || score >= 85)) return false;
        if (filterScoreRange === "average" && (score < 50 || score >= 70)) return false;
        if (filterScoreRange === "below-threshold" && jobPosting?.minimumScore && score >= jobPosting.minimumScore) return false;
      }
      
      // Filter by recommendation
      if (filterRecommendation !== "all" && report && jobPosting?.minimumScore) {
        const meetsThreshold = report.overallScore >= jobPosting.minimumScore;
        if (filterRecommendation === "recommended" && !meetsThreshold) return false;
        if (filterRecommendation === "below-threshold" && meetsThreshold) return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by overall score (descending)
      if (sortBy === "score-desc") {
        const reportA = getStudentReport(a.id);
        const reportB = getStudentReport(b.id);
        
        // Students without reports go to the end
        if (!reportA && !reportB) return 0;
        if (!reportA) return 1;
        if (!reportB) return -1;
        
        return reportB.overallScore - reportA.overallScore;
      }
      
      // Sort by overall score (ascending)
      if (sortBy === "score-asc") {
        const reportA = getStudentReport(a.id);
        const reportB = getStudentReport(b.id);
        
        // Students without reports go to the end
        if (!reportA && !reportB) return 0;
        if (!reportA) return 1;
        if (!reportB) return -1;
        
        return reportA.overallScore - reportB.overallScore;
      }
      
      return 0; // No sorting
    }), [students, filterCollege, filterStatus, filterScoreRange, filterRecommendation, sortBy, jobPosting, reports, selections]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/organization/${orgId}/job-profiles`)}
          className="mb-4"
        >
          ← Back to Jobs
        </Button>
        <h1 className="text-3xl font-bold">{jobPosting?.title}</h1>
        <p className="text-muted-foreground mt-2">
          Review and select students for this position
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Filter by College</label>
            <select
              value={filterCollege}
              onChange={(e) => setFilterCollege(e.target.value)}
              className="p-2 border rounded-lg bg-background"
            >
              <option value="all">All Colleges</option>
              {colleges.map((college) => (
                <option key={college.id} value={college.id}>
                  {college.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 border rounded-lg bg-background"
            >
              <option value="all">All Students</option>
              <option value="unreviewed">Unreviewed</option>
              <option value="select">Selected</option>
              <option value="shortlist">Shortlisted</option>
              <option value="reject">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Filter by Score Range</label>
            <select
              value={filterScoreRange}
              onChange={(e) => setFilterScoreRange(e.target.value)}
              className="p-2 border rounded-lg bg-background"
            >
              <option value="all">All Scores</option>
              <option value="excellent">Excellent (85-100)</option>
              <option value="good">Good (70-84)</option>
              <option value="average">Average (50-69)</option>
              {jobPosting?.minimumScore && (
                <option value="below-threshold">Below Threshold (&lt;{jobPosting.minimumScore})</option>
              )}
            </select>
          </div>

          {jobPosting?.minimumScore && (
            <div>
              <label className="block text-sm font-medium mb-2">Filter by Recommendation</label>
              <select
                value={filterRecommendation}
                onChange={(e) => setFilterRecommendation(e.target.value)}
                className="p-2 border rounded-lg bg-background"
              >
                <option value="all">All Students</option>
                <option value="recommended">Recommended</option>
                <option value="below-threshold">Below Threshold</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-2 border rounded-lg bg-background"
            >
              <option value="none">Default Order</option>
              <option value="score-desc">Score (High to Low)</option>
              <option value="score-asc">Score (Low to High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedStudents.size > 0 && (
        <div className="card p-4 mb-6 bg-primary/5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="font-medium">{selectedStudents.size} student(s) selected</p>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => handleBulkAction('select')}
                className="bg-green-600 hover:bg-green-700"
              >
                Select for Job
              </Button>
              <Button
                onClick={() => handleBulkAction('shortlist')}
                variant="outline"
              >
                Shortlist
              </Button>
              <Button
                onClick={() => handleBulkAction('reject')}
                variant="destructive"
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Students List */}
      <div className="space-y-4">
        {filteredStudents.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-muted-foreground">No students found</p>
          </div>
        ) : (
          filteredStudents.map((student) => {
            const report = getStudentReport(student.id);
            const selection = getStudentSelection(student.id);
            const college = colleges.find((c) => c.id === student.collegeId);

            return (
              <div key={student.id} className="card p-6">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedStudents.has(student.id)}
                    onChange={() => handleSelectStudent(student.id)}
                    className="mt-1 h-5 w-5"
                  />

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{student.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {college?.name} • {student.branch} • {student.year}th Year
                        </p>
                        <p className="text-sm mt-1">
                          CGPA: <span className="font-medium">{student.cgpa}</span>
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {/* Selection Status Badge */}
                        {selection && (
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getSelectionBadge(
                              selection.status
                            )}`}
                          >
                            {selection.status.charAt(0).toUpperCase() + selection.status.slice(1)}
                          </span>
                        )}
                        
                        {/* Recommendation Badge */}
                        {report && jobPosting?.minimumScore && (
                          <RecommendationBadge
                            studentScore={report.overallScore}
                            minimumScore={jobPosting.minimumScore}
                            showDetails={true}
                          />
                        )}
                      </div>
                    </div>

                    {/* Skills */}
                    {student.skills && student.skills.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">Skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {student.skills.map((skill: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-primary/10 rounded text-sm"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comprehensive Interview Report */}
                    <ComprehensiveReportView report={report} expanded={false} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

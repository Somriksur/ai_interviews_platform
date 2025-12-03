"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Report {
  id: string;
  technicalScore: number;
  communicationRating: number;
  overallScore: number;
  salaryBand: string;
  placementCategory: string;
  strengths: string[];
  weaknesses: string[];
  generatedAt: string;
  student: {
    id: string;
    name: string;
    email: string;
    rollNumber: string;
    branch: string;
    cgpa: number;
  };
  college: {
    id: string;
    name: string;
    location: string;
  };
  drive: {
    id: string;
    name: string;
    role: string;
  };
}

export default function OrganizationReportsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  
  // Filters
  const [studentFilter, setStudentFilter] = useState("");
  const [driveFilter, setDriveFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchReports();
  }, [orgId, studentFilter, driveFilter, startDate, endDate]);

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams();
      if (studentFilter) params.append('studentId', studentFilter);
      if (driveFilter) params.append('driveId', driveFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/organization/${orgId}/reports?${params.toString()}`);
      if (response.ok) {
        const { reports } = await response.json();
        setReports(reports);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (selectedReports.length === 0) {
      toast.error("Please select at least one report to export");
      return;
    }

    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportIds: selectedReports,
          format,
        }),
      });

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reports_${Date.now()}.csv`;
        a.click();
        toast.success("CSV exported successfully!");
      } else {
        await response.json();
        toast.success("PDF data prepared. Generating PDF...");
        // PDF generation would happen here with a library like jsPDF
      }
    } catch (error) {
      console.error("Error exporting reports:", error);
      toast.error("Failed to export reports");
    }
  };

  const toggleReportSelection = (reportId: string) => {
    setSelectedReports(prev =>
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const selectAll = () => {
    setSelectedReports(reports.map(r => r.id));
  };

  const deselectAll = () => {
    setSelectedReports([]);
  };

  const getSalaryBandColor = (band: string) => {
    if (band === 'high') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (band === 'medium') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
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
            href={`/organization/${orgId}/dashboard`}
            className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Student Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            View and analyze student interview performance reports
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Student ID</label>
              <input
                type="text"
                value={studentFilter}
                onChange={(e) => setStudentFilter(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                placeholder="Filter by student"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Drive ID</label>
              <input
                type="text"
                value={driveFilter}
                onChange={(e) => setDriveFilter(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                placeholder="Filter by drive"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {selectedReports.length} of {reports.length} selected
              </span>
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Deselect All
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleExport('csv')}
                disabled={selectedReports.length === 0}
              >
                📥 Export CSV
              </Button>
              <Button
                onClick={() => handleExport('pdf')}
                disabled={selectedReports.length === 0}
                variant="outline"
              >
                📄 Export PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Reports List */}
        {reports.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">No Reports Found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              No student reports have been generated yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedReports.includes(report.id)}
                    onChange={() => toggleReportSelection(report.id)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1">
                    {/* Student Info */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">{report.student?.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {report.student?.rollNumber} • {report.student?.branch} • CGPA: {report.student?.cgpa}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {report.college?.name} • {report.drive?.name}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${getSalaryBandColor(report.salaryBand)}`}>
                        {report.placementCategory}
                      </span>
                    </div>

                    {/* Scores */}
                    <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded">
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Technical Score</div>
                        <div className="text-2xl font-bold">{report.technicalScore}/100</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Communication</div>
                        <div className="text-2xl font-bold">{report.communicationRating}/100</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Overall Score</div>
                        <div className="text-2xl font-bold">{report.overallScore}/100</div>
                      </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium mb-2 text-green-600 dark:text-green-400">
                          ✓ Strengths
                        </div>
                        <ul className="text-sm space-y-1">
                          {report.strengths?.slice(0, 3).map((strength, idx) => (
                            <li key={idx} className="text-gray-700 dark:text-gray-300">
                              • {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-2 text-orange-600 dark:text-orange-400">
                          ⚠ Areas for Improvement
                        </div>
                        <ul className="text-sm space-y-1">
                          {report.weaknesses?.slice(0, 3).map((weakness, idx) => (
                            <li key={idx} className="text-gray-700 dark:text-gray-300">
                              • {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Generated Date */}
                    <div className="mt-4 text-sm text-gray-500">
                      Generated: {new Date(report.generatedAt).toLocaleString()}
                    </div>
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

"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { StudentNavigation } from "@/components/student/Navigation";

interface Report {
  id: string;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  overallScore: number;
  emotionalIntelligence: number;
  stressResilience: number;
  culturalFit: number;
  leadershipPotential: number;
  teamworkAbility: number;
  personalityProfile: string;
  communicationStyle: string;
  emotionalStability: number;
  overallConfidence: number;
  confidenceTrend: string;
  dominantEmotions: string[];
  placementCategory: string;
  recommendation: string;
  strengths: string[];
  improvements: string[];
  detailedAnalysis: string;
  generatedAt: string;
  nlpVersion: string;
  processingTime: number;
  confidenceScore: number;
  drive: {
    id: string;
    name: string;
    role: string;
  };
  organization: {
    id: string;
    name: string;
  };
  college: {
    id: string;
    name: string;
  };
  transcript: {
    fullTranscript: string;
    questionResponses: Array<{
      question: string;
      response: string;
      emotionalState?: string;
      stressLevel?: number;
    }>;
  };
}

export default function StudentReportsPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);

  useEffect(() => {
    fetchReports();
  }, [studentId]);

  const fetchReports = async () => {
    try {
      const response = await fetch(`/api/students/${studentId}/reports`);
      if (response.ok) {
        const { reports } = await response.json();
        setReports(reports);
      } else {
        toast.error("Failed to load reports");
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Error loading reports");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (report: Report) => {
    try {
      const response = await fetch(`/api/students/${studentId}/reports/${report.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("Report deleted successfully");
        setReports(reports.filter(r => r.id !== report.id));
        setShowDeleteDialog(false);
        setReportToDelete(null);
      } else {
        toast.error("Failed to delete report");
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Error deleting report");
    }
  };

  const getRecommendationBadge = (recommendation: string) => {
    const styles = {
      'highly-recommended': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'recommended': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'consider': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'not-recommended': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return styles[recommendation as keyof typeof styles] || styles['not-recommended'];
  };

  const getRecommendationLabel = (recommendation: string) => {
    const labels = {
      'highly-recommended': 'Highly Recommended',
      'recommended': 'Recommended',
      'consider': 'Consider',
      'not-recommended': 'Not Recommended',
    };
    return labels[recommendation as keyof typeof labels] || 'Not Recommended';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <>
        <StudentNavigation studentId={studentId} />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin text-4xl">⏳</div>
        </div>
      </>
    );
  }

  return (
    <>
      <StudentNavigation studentId={studentId} />
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Your Interview Reports 📊</h1>
            <p className="text-muted-foreground mt-1">
              Detailed AI-powered analysis of your interview performance
            </p>
          </div>
          <Link href={`/student/${studentId}/dashboard`}>
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </div>

        {/* Reports List */}
        {reports.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">No Reports Yet</h3>
              <p className="text-muted-foreground mb-4">
                Complete an interview to see your detailed AI-powered analysis
              </p>
              <Link href={`/student/${studentId}/dashboard`}>
                <Button>View Available Interviews</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {reports.map((report) => (
              <Card key={report.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {report.drive?.name || 'Interview Drive'}
                        <Badge className={getRecommendationBadge(report.recommendation)}>
                          {getRecommendationLabel(report.recommendation)}
                        </Badge>
                      </CardTitle>
                      <p className="text-muted-foreground mt-1">
                        {report.organization?.name || 'Organization'} • {report.drive?.role || 'Role'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Generated: {new Date(report.generatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Core Scores */}
                  <div>
                    <h4 className="font-semibold mb-3">📈 Performance Scores</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className={`text-2xl font-bold ${getScoreColor(report.technicalScore)}`}>
                          {report.technicalScore}/100
                        </div>
                        <div className="text-sm text-muted-foreground">Technical</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className={`text-2xl font-bold ${getScoreColor(report.communicationScore)}`}>
                          {report.communicationScore}/100
                        </div>
                        <div className="text-sm text-muted-foreground">Communication</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className={`text-2xl font-bold ${getScoreColor(report.problemSolvingScore)}`}>
                          {report.problemSolvingScore}/100
                        </div>
                        <div className="text-sm text-muted-foreground">Problem Solving</div>
                      </div>
                      <div className="text-center p-3 bg-primary/10 rounded-lg">
                        <div className={`text-2xl font-bold ${getScoreColor(report.overallScore)}`}>
                          {report.overallScore}/100
                        </div>
                        <div className="text-sm text-muted-foreground">Overall</div>
                      </div>
                    </div>
                  </div>

                  {/* Technical Correctness Analysis */}
                  <div>
                    <h4 className="font-semibold mb-3">🎯 Technical Correctness Analysis</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">
                          {report.technicalCorrectness || 0}/100
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">Answer Accuracy</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">
                          {report.conceptualUnderstanding || 0}/100
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">Conceptual Understanding</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">
                          {report.practicalApplication || 0}/100
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">Practical Application</div>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        💡 <strong>Technical Insight:</strong> Your answers were evaluated for factual accuracy, 
                        conceptual depth, and practical application. This helps identify specific areas 
                        where you can improve your technical knowledge.
                      </p>
                    </div>
                  </div>

                  {/* Advanced Insights */}
                  <div>
                    <h4 className="font-semibold mb-3">🧠 Advanced Insights</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {report.emotionalIntelligence}/100
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400">Emotional Intelligence</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">
                          {report.stressResilience}/100
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">Stress Resilience</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                        <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                          {report.culturalFit}/100
                        </div>
                        <div className="text-sm text-purple-600 dark:text-purple-400">Cultural Fit</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                        <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                          {report.leadershipPotential}/100
                        </div>
                        <div className="text-sm text-orange-600 dark:text-orange-400">Leadership Potential</div>
                      </div>
                      <div className="text-center p-3 bg-teal-50 dark:bg-teal-950 rounded-lg">
                        <div className="text-xl font-bold text-teal-600 dark:text-teal-400">
                          {report.teamworkAbility}/100
                        </div>
                        <div className="text-sm text-teal-600 dark:text-teal-400">Teamwork Ability</div>
                      </div>
                      <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
                        <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                          {report.overallConfidence}/100
                        </div>
                        <div className="text-sm text-indigo-600 dark:text-indigo-400">Confidence</div>
                      </div>
                    </div>
                  </div>

                  {/* Personality & Communication */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">👤 Personality Profile</h4>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm">{report.personalityProfile || 'Analysis in progress...'}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">💬 Communication Style</h4>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm">{report.communicationStyle || 'Analysis in progress...'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Emotional Analysis */}
                  {report.dominantEmotions && report.dominantEmotions.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">🎭 Emotional Analysis</h4>
                      <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {report.dominantEmotions.map((emotion, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-purple-100 dark:bg-purple-800">
                              {emotion}
                            </Badge>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Emotional Stability:</span> {report.emotionalStability}/100
                          </div>
                          <div>
                            <span className="font-medium">Confidence Trend:</span> {report.confidenceTrend}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Strengths & Improvements */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 text-green-600 dark:text-green-400">✅ Your Strengths</h4>
                      <ul className="space-y-2">
                        {report.strengths?.slice(0, 5).map((strength, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3 text-blue-600 dark:text-blue-400">🎯 Growth Areas</h4>
                      <ul className="space-y-2">
                        {report.improvements?.slice(0, 5).map((improvement, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* AI Analysis Metadata */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>🤖 AI NLP v{report.nlpVersion}</span>
                        <span>⚡ Processed in {report.processingTime}ms</span>
                        <span>🎯 {Math.round((report.confidenceScore || 0) * 100)}% confidence</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                        >
                          {selectedReport?.id === report.id ? 'Hide Details' : 'View Details'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReportToDelete(report);
                            setShowDeleteDialog(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          🗑️ Delete
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Analysis (Expandable) */}
                  {selectedReport?.id === report.id && (
                    <div className="border-t pt-4 space-y-4">
                      <div>
                        <h4 className="font-semibold mb-3">📝 Detailed Analysis</h4>
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">{report.detailedAnalysis}</p>
                        </div>
                      </div>
                      
                      {report.transcript?.questionResponses && report.transcript.questionResponses.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3">💭 Interview Responses</h4>
                          <div className="space-y-3">
                            {report.transcript.questionResponses.slice(0, 3).map((qa, idx) => (
                              <div key={idx} className="p-3 border rounded-lg">
                                <div className="font-medium text-sm mb-2">Q: {qa.question}</div>
                                <div className="text-sm text-muted-foreground mb-2">
                                  A: {qa.response.substring(0, 200)}...
                                </div>
                                {qa.emotionalState && (
                                  <div className="text-xs text-purple-600 dark:text-purple-400">
                                    Emotional State: {qa.emotionalState}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Report</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this interview report? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {reportToDelete && (
              <div className="py-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
                  <p className="font-medium">{reportToDelete.drive?.name || 'Interview Drive'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {reportToDelete.organization?.name || 'Organization'} • {reportToDelete.drive?.role || 'Role'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Generated: {new Date(reportToDelete.generatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setReportToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => reportToDelete && handleDeleteReport(reportToDelete)}
              >
                Delete Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
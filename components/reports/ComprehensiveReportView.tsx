"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ComprehensiveReport {
  studentId: string;
  id?: string;
  // Technical Metrics
  technicalScore: number;
  conceptualUnderstanding?: number;
  codeQuality?: number;
  logicAndReasoning?: number;
  // Communication & Behavior
  communicationRating: number;
  sentimentScore?: number;
  professionalismScore?: number;
  confidenceLevel?: number;
  // Emotional Analysis
  emotionalAnalysis?: {
    overall: string;
    nervousness: number;
    confidence: number;
    stress: number;
    calmness: number;
    motivation: number;
    emotionalTone: string;
  };
  // Behavioral Analysis
  behavioralAnalysis?: {
    communicationClarity: number;
    consistency: number;
    toneVariation: number;
    trustworthiness: number;
    professionalism: number;
    engagement: number;
  };
  // Language Quality
  languageQuality?: {
    grammar: number;
    fluency: number;
    vocabulary: number;
    hesitation: number;
    fillerWords: number;
  };
  // Overall
  overallScore: number;
  skillInsights?: {
    technical: string[];
    communication: string[];
    problemSolving: string[];
    leadership: string[];
    behavioral?: string[];
  };
  strengths?: string[];
  weaknesses?: string[];
  evaluationSummary?: string;
  createdAt?: Date;
}

interface ComprehensiveReportViewProps {
  report: ComprehensiveReport | null;
  expanded?: boolean;
}

/**
 * ProgressBar Component for displaying scores
 */
function ProgressBar({ value, max = 100, label }: { value: number; max?: number; label: string }) {
  const percentage = (value / max) * 100;
  const colorClass =
    percentage >= 80
      ? 'bg-green-500'
      : percentage >= 60
      ? 'bg-yellow-500'
      : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}/{max}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * MetricCard Component for displaying individual metrics
 */
function MetricCard({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const percentage = (value / max) * 100;
  const colorClass =
    percentage >= 80
      ? 'text-green-600 dark:text-green-400'
      : percentage >= 60
      ? 'text-yellow-600 dark:text-yellow-400'
      : 'text-red-600 dark:text-red-400';

  return (
    <div className="p-3 bg-muted/30 rounded-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
      <p className="text-xs text-muted-foreground">out of {max}</p>
    </div>
  );
}

/**
 * ComprehensiveReportView Component
 * 
 * Displays comprehensive interview report with all metrics
 * - Technical Performance
 * - Communication & Behavior
 * - Emotional Profile
 * - Language Quality
 * - AI Insights
 */
export function ComprehensiveReportView({ report, expanded = false }: ComprehensiveReportViewProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);

  if (!report) {
    return (
      <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          No interview report available yet
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Summary Section - Always Visible */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-lg">Interview Performance</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '▼ Show Less' : '▶ Show More'}
          </Button>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Overall Score" value={report.overallScore} />
          <MetricCard label="Technical" value={report.technicalScore} />
          <MetricCard label="Communication" value={report.communicationRating} />
          <MetricCard
            label="Confidence"
            value={report.emotionalAnalysis?.confidence || report.confidenceLevel || 0}
          />
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Technical Metrics Section */}
          {(report.conceptualUnderstanding || report.codeQuality || report.logicAndReasoning) && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <h5 className="font-medium mb-3">Technical Performance</h5>
              <div className="space-y-3">
                <ProgressBar
                  label="Technical Score"
                  value={report.technicalScore}
                />
                {report.conceptualUnderstanding !== undefined && (
                  <ProgressBar
                    label="Conceptual Understanding"
                    value={report.conceptualUnderstanding}
                  />
                )}
                {report.codeQuality !== undefined && (
                  <ProgressBar label="Code Quality" value={report.codeQuality} />
                )}
                {report.logicAndReasoning !== undefined && (
                  <ProgressBar
                    label="Logic & Reasoning"
                    value={report.logicAndReasoning}
                  />
                )}
              </div>
            </div>
          )}

          {/* Behavioral Metrics Section */}
          {report.behavioralAnalysis && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <h5 className="font-medium mb-3">Behavioral Analysis</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ProgressBar
                  label="Communication Clarity"
                  value={report.behavioralAnalysis.communicationClarity}
                />
                <ProgressBar
                  label="Professionalism"
                  value={report.behavioralAnalysis.professionalism}
                />
                <ProgressBar
                  label="Engagement"
                  value={report.behavioralAnalysis.engagement}
                />
                <ProgressBar
                  label="Trustworthiness"
                  value={report.behavioralAnalysis.trustworthiness}
                />
                <ProgressBar
                  label="Consistency"
                  value={report.behavioralAnalysis.consistency}
                />
                <ProgressBar
                  label="Tone Variation"
                  value={report.behavioralAnalysis.toneVariation}
                />
              </div>
            </div>
          )}

          {/* Emotional Metrics Section */}
          {report.emotionalAnalysis && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <h5 className="font-medium mb-3">Emotional Profile</h5>
              <div className="mb-3">
                <p className="text-sm text-muted-foreground">
                  Overall Sentiment: <span className="font-medium">{report.emotionalAnalysis.overall}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {report.emotionalAnalysis.emotionalTone}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ProgressBar
                  label="Confidence"
                  value={report.emotionalAnalysis.confidence}
                />
                <ProgressBar
                  label="Calmness"
                  value={report.emotionalAnalysis.calmness}
                />
                <ProgressBar
                  label="Motivation"
                  value={report.emotionalAnalysis.motivation}
                />
                <ProgressBar
                  label="Nervousness"
                  value={report.emotionalAnalysis.nervousness}
                />
                <ProgressBar
                  label="Stress Level"
                  value={report.emotionalAnalysis.stress}
                />
              </div>
            </div>
          )}

          {/* Language Quality Section */}
          {report.languageQuality && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <h5 className="font-medium mb-3">Language Quality</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ProgressBar label="Grammar" value={report.languageQuality.grammar} />
                <ProgressBar label="Fluency" value={report.languageQuality.fluency} />
                <ProgressBar label="Vocabulary" value={report.languageQuality.vocabulary} />
                <ProgressBar
                  label="Hesitation (lower is better)"
                  value={100 - report.languageQuality.hesitation}
                />
              </div>
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">
                  Filler Words: <span className="font-medium">{report.languageQuality.fillerWords}</span>
                </p>
              </div>
            </div>
          )}

          {/* AI Insights Section */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <h5 className="font-medium mb-3">AI-Generated Insights</h5>
            
            {/* Strengths */}
            {report.strengths && report.strengths.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                  Strengths:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {report.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {report.weaknesses && report.weaknesses.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                  Areas for Improvement:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {report.weaknesses.map((weakness, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skill Insights */}
            {report.skillInsights && (
              <div className="space-y-3">
                {report.skillInsights.technical.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Technical Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {report.skillInsights.technical.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {report.skillInsights.communication.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Communication:</p>
                    <div className="flex flex-wrap gap-2">
                      {report.skillInsights.communication.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Evaluation Summary */}
            {report.evaluationSummary && (
              <div className="mt-4 p-3 bg-background rounded border">
                <p className="text-sm font-medium mb-2">Evaluation Summary:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {report.evaluationSummary}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

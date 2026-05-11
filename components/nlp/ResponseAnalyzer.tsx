'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, TrendingUp, MessageSquare, Heart, Zap } from 'lucide-react';

interface AnalysisResult {
  sentiment: string;
  emotion: string;
  communication: string;
  confidence_level: string;
  stress_level: string;
  confidence_scores: {
    sentiment: string;
    emotion: string;
    communication: string;
    confidence_level: string;
    stress_level: string;
  };
  edge_cases: string[];
  analysis_method: string;
}

interface ResponseAnalyzerProps {
  text: string;
  sessionId?: string;
  questionId?: string;
  onAnalysisComplete?: (analysis: AnalysisResult) => void;
  autoAnalyze?: boolean;
}

export default function ResponseAnalyzer({ 
  text, 
  sessionId, 
  questionId, 
  onAnalysisComplete,
  autoAnalyze = false 
}: ResponseAnalyzerProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeResponse = async () => {
    if (!text || text.length < 3) {
      setError('Please provide a response with at least 3 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/nlp/analyze-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          sessionId,
          questionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze response');
      }

      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.analysis);
        onAnalysisComplete?.(data.analysis);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Auto-analyze when text changes (if enabled)
  React.useEffect(() => {
    if (autoAnalyze && text && text.length >= 3) {
      const debounceTimer = setTimeout(() => {
        analyzeResponse();
      }, 1000);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [text, autoAnalyze]);

  const getScoreColor = (score: string) => {
    const numScore = parseInt(score.replace('%', ''));
    if (numScore >= 80) return 'text-green-600';
    if (numScore >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSentimentIcon = (sentiment: string) => {
    if (sentiment.includes('POSITIVE')) return '😊';
    if (sentiment.includes('NEGATIVE')) return '😟';
    return '😐';
  };

  return (
    <div className="space-y-4">
      {/* Analysis Trigger */}
      {!autoAnalyze && (
        <Button 
          onClick={analyzeResponse} 
          disabled={loading || !text || text.length < 3}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Response...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Analyze Response
            </>
          )}
        </Button>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-red-600 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              NLP Analysis Results
            </CardTitle>
            <CardDescription>
              {analysis.analysis_method} • HireFlow NLP Evaluation System
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  <span className="font-medium">Sentiment</span>
                </div>
                <Badge variant="outline" className="text-sm">
                  {getSentimentIcon(analysis.sentiment)} {analysis.sentiment}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Emotion</span>
                </div>
                <Badge variant="outline" className="text-sm">
                  {analysis.emotion}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Communication</span>
                </div>
                <Badge variant="outline" className="text-sm">
                  {analysis.communication}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Confidence</span>
                </div>
                <Badge variant="outline" className="text-sm">
                  {analysis.confidence_level}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="font-medium">Stress Level</span>
                </div>
                <Badge variant="outline" className="text-sm">
                  {analysis.stress_level}
                </Badge>
              </div>
            </div>

            {/* Confidence Scores */}
            <div>
              <h4 className="font-medium mb-3">Confidence Scores</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
                <div className="text-center">
                  <div className="font-medium">Sentiment</div>
                  <div className={getScoreColor(analysis.confidence_scores.sentiment)}>
                    {analysis.confidence_scores.sentiment}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Emotion</div>
                  <div className={getScoreColor(analysis.confidence_scores.emotion)}>
                    {analysis.confidence_scores.emotion}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Communication</div>
                  <div className={getScoreColor(analysis.confidence_scores.communication)}>
                    {analysis.confidence_scores.communication}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Confidence</div>
                  <div className={getScoreColor(analysis.confidence_scores.confidence_level)}>
                    {analysis.confidence_scores.confidence_level}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Stress</div>
                  <div className={getScoreColor(analysis.confidence_scores.stress_level)}>
                    {analysis.confidence_scores.stress_level}
                  </div>
                </div>
              </div>
            </div>

            {/* Edge Cases */}
            {analysis.edge_cases.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Edge Cases Detected</h4>
                <div className="space-y-2">
                  {analysis.edge_cases.map((edgeCase, index) => (
                    <Badge key={index} variant="secondary" className="mr-2 mb-2">
                      {edgeCase}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
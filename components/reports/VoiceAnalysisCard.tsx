'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface VoiceMetrics {
  speechClarity: number;
  confidence: number;
  hesitation: number;
  emotionalStability: number;
  overallVoiceScore: number;
  insights?: {
    speakingPattern: 'fast' | 'moderate' | 'slow';
    confidenceLevel: 'high' | 'medium' | 'low';
    stressIndicators: string[];
    strengths: string[];
    improvements: string[];
  };
  explanation?: string;
}

interface VoiceAnalysisCardProps {
  voiceMetrics: VoiceMetrics;
}

export function VoiceAnalysisCard({ voiceMetrics }: VoiceAnalysisCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 75) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (score >= 50) return <Minus className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getConfidenceBadgeVariant = (level: string) => {
    switch (level) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'destructive';
      default: return 'outline';
    }
  };

  const getPatternBadgeVariant = (pattern: string) => {
    switch (pattern) {
      case 'moderate': return 'default';
      case 'fast': return 'secondary';
      case 'slow': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Analysis
        </CardTitle>
        <CardDescription>
          Multi-modal intelligence: Speech behavior analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center p-4 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Overall Voice Score</div>
          <div className={`text-4xl font-bold ${getScoreColor(voiceMetrics.overallVoiceScore)}`}>
            {voiceMetrics.overallVoiceScore}
            <span className="text-2xl">/100</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Speech Clarity</span>
              {getScoreIcon(voiceMetrics.speechClarity)}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    voiceMetrics.speechClarity >= 75 ? 'bg-green-600' :
                    voiceMetrics.speechClarity >= 60 ? 'bg-blue-600' :
                    voiceMetrics.speechClarity >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${voiceMetrics.speechClarity}%` }}
                />
              </div>
              <span className={`text-sm font-semibold ${getScoreColor(voiceMetrics.speechClarity)}`}>
                {voiceMetrics.speechClarity}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Confidence</span>
              {getScoreIcon(voiceMetrics.confidence)}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    voiceMetrics.confidence >= 75 ? 'bg-green-600' :
                    voiceMetrics.confidence >= 60 ? 'bg-blue-600' :
                    voiceMetrics.confidence >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${voiceMetrics.confidence}%` }}
                />
              </div>
              <span className={`text-sm font-semibold ${getScoreColor(voiceMetrics.confidence)}`}>
                {voiceMetrics.confidence}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Hesitation</span>
              {getScoreIcon(100 - voiceMetrics.hesitation)}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    voiceMetrics.hesitation <= 25 ? 'bg-green-600' :
                    voiceMetrics.hesitation <= 40 ? 'bg-blue-600' :
                    voiceMetrics.hesitation <= 50 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${voiceMetrics.hesitation}%` }}
                />
              </div>
              <span className={`text-sm font-semibold ${getScoreColor(100 - voiceMetrics.hesitation)}`}>
                {voiceMetrics.hesitation}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Emotional Stability</span>
              {getScoreIcon(voiceMetrics.emotionalStability)}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    voiceMetrics.emotionalStability >= 75 ? 'bg-green-600' :
                    voiceMetrics.emotionalStability >= 60 ? 'bg-blue-600' :
                    voiceMetrics.emotionalStability >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${voiceMetrics.emotionalStability}%` }}
                />
              </div>
              <span className={`text-sm font-semibold ${getScoreColor(voiceMetrics.emotionalStability)}`}>
                {voiceMetrics.emotionalStability}
              </span>
            </div>
          </div>
        </div>

        {/* Insights */}
        {voiceMetrics.insights && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge variant={getPatternBadgeVariant(voiceMetrics.insights.speakingPattern) as any}>
                {voiceMetrics.insights.speakingPattern} pace
              </Badge>
              <Badge variant={getConfidenceBadgeVariant(voiceMetrics.insights.confidenceLevel) as any}>
                {voiceMetrics.insights.confidenceLevel} confidence
              </Badge>
            </div>

            {voiceMetrics.insights.strengths.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Strengths:</div>
                <ul className="space-y-1">
                  {voiceMetrics.insights.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {voiceMetrics.insights.improvements.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Areas for Improvement:</div>
                <ul className="space-y-1">
                  {voiceMetrics.insights.improvements.map((improvement, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-yellow-600">→</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {voiceMetrics.insights.stressIndicators.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Stress Indicators:</div>
                <ul className="space-y-1">
                  {voiceMetrics.insights.stressIndicators.map((indicator, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-red-600">!</span>
                      {indicator}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Explanation */}
        {voiceMetrics.explanation && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">
              {voiceMetrics.explanation}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

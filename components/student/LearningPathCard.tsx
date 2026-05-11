'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Circle, AlertTriangle, Clock, Target, TrendingUp } from 'lucide-react';

interface LearningPathData {
  weakAreas: Array<{
    area: string;
    score: number;
    severity: 'critical' | 'moderate' | 'minor';
  }>;
  skillGaps: Array<{
    skill: string;
    currentLevel: string;
    requiredLevel: string;
    priority: 'high' | 'medium' | 'low';
    domain: string;
  }>;
  recommendations: Array<{
    title: string;
    type: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    estimatedTime: string;
    resources: string[];
  }>;
  learningPath: string[];
  priorityFocus: string;
  estimatedTimeToImprove: string;
  confidence: number;
}

interface LearningPathCardProps {
  data: LearningPathData;
  loading?: boolean;
}

export function LearningPathCard({ data, loading }: LearningPathCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Learning Path</CardTitle>
          <CardDescription>Generating personalized recommendations...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'moderate': return 'default';
      case 'minor': return 'secondary';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Priority Focus */}
      <Alert>
        <Target className="h-4 w-4" />
        <AlertDescription>
          <strong>Priority Focus:</strong> {data.priorityFocus}
          <br />
          <span className="text-sm text-muted-foreground">
            Estimated time to improve: {data.estimatedTimeToImprove}
          </span>
        </AlertDescription>
      </Alert>

      {/* Weak Areas */}
      {data.weakAreas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Areas for Improvement
            </CardTitle>
            <CardDescription>
              Focus on these areas to enhance your performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.weakAreas.map((area, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{area.area}</div>
                    <div className="text-sm text-muted-foreground">
                      Current score: {area.score}/100
                    </div>
                  </div>
                  <Badge variant={getSeverityColor(area.severity) as any}>
                    {area.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skill Gaps */}
      {data.skillGaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Skill Gaps
            </CardTitle>
            <CardDescription>
              Skills to develop for your target role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.skillGaps.slice(0, 5).map((gap, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{gap.skill}</div>
                    <div className="text-sm text-muted-foreground">
                      {gap.currentLevel} → {gap.requiredLevel} | {gap.domain}
                    </div>
                  </div>
                  <Badge variant={getPriorityColor(gap.priority) as any}>
                    {gap.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Learning Recommendations
          </CardTitle>
          <CardDescription>
            Personalized action items to accelerate your growth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recommendations.map((rec, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{rec.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {rec.description}
                    </div>
                  </div>
                  <Badge variant={getPriorityColor(rec.priority) as any}>
                    {rec.priority}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {rec.estimatedTime}
                </div>

                {rec.resources.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Action Steps:</div>
                    <ul className="space-y-1">
                      {rec.resources.map((resource, rIndex) => (
                        <li key={rIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                          <Circle className="h-3 w-3 mt-1 flex-shrink-0" />
                          <span>{resource}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Learning Path Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Your Learning Path</CardTitle>
          <CardDescription>
            Follow these steps sequentially for best results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.learningPath.map((step, index) => (
              <div 
                key={index} 
                className={`flex items-start gap-3 p-2 rounded ${
                  step.startsWith('Step') ? 'font-medium' : 'text-sm text-muted-foreground pl-6'
                }`}
              >
                {step.startsWith('Step') ? (
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                ) : (
                  <span className="text-muted-foreground">→</span>
                )}
                <span>{step}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Confidence Indicator */}
      <div className="text-sm text-muted-foreground text-center">
        Recommendation confidence: {data.confidence}%
      </div>
    </div>
  );
}

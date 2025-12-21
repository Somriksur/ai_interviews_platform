'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import DynamicTechStackSelector from '@/components/interview/DynamicTechStackSelector';
import { Loader2, Sparkles } from 'lucide-react';

export default function TestDynamicTechPage() {
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('Mid-level');
  const [selectedType, setSelectedType] = useState('Technical');
  const [selectedTechStack, setSelectedTechStack] = useState<string[]>([]);
  const [amount, setAmount] = useState(5);
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);
  const [spaceHealth, setSpaceHealth] = useState<any>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [wakingUp, setWakingUp] = useState(false);
  const [comprehensiveDebug, setComprehensiveDebug] = useState<any>(null);
  const [debugLoading, setDebugLoading] = useState(false);

  const jobRoles = [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'DevOps Engineer',
    'Mobile Developer',
    'Data Scientist',
    'ML Engineer',
    'QA Engineer'
  ];

  const experienceLevels = ['Junior', 'Mid-level', 'Senior', 'Lead'];
  const interviewTypes = ['Technical', 'Behavioral', 'Mixed'];

  const checkSpaceHealth = async () => {
    setCheckingHealth(true);
    try {
      const response = await fetch('/api/ai/health-check');
      const data = await response.json();
      setSpaceHealth(data);
    } catch (error) {
      console.error('Error checking Space health:', error);
      setSpaceHealth({ status: 'error', message: 'Failed to check Space health' });
    } finally {
      setCheckingHealth(false);
    }
  };

  const wakeUpSpace = async () => {
    setWakingUp(true);
    try {
      const response = await fetch('/api/ai/health-check', { method: 'POST' });
      const data = await response.json();
      setSpaceHealth(data);
      
      // Auto-check health after wake up attempt
      setTimeout(() => {
        checkSpaceHealth();
      }, 3000);
    } catch (error) {
      console.error('Error waking up Space:', error);
      setSpaceHealth({ status: 'error', message: 'Failed to wake up Space' });
    } finally {
      setWakingUp(false);
    }
  };

  const runComprehensiveDebug = async () => {
    setDebugLoading(true);
    try {
      const response = await fetch('/api/ai/debug-space', { method: 'POST' });
      const data = await response.json();
      setComprehensiveDebug(data.debug);
      console.log('Comprehensive debug results:', data.debug);
    } catch (error) {
      console.error('Comprehensive debug error:', error);
      setComprehensiveDebug({ error: 'Failed to run comprehensive debug' });
    } finally {
      setDebugLoading(false);
    }
  };

  const testSimpleGeneration = async () => {
    if (!selectedRole || selectedTechStack.length === 0) {
      alert('Please select a role and tech stack first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai/simple-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          level: selectedLevel,
          techstack: selectedTechStack.slice(0, 2), // Use only first 2 techs for simplicity
          amount: 3 // Start with just 3 questions
        })
      });

      const data = await response.json();
      if (data.success && data.questions) {
        setQuestions(data.questions);
        setMetadata(data.metadata);
        alert('✅ Simple generation worked! Check the questions below.');
      } else {
        console.error('Simple generation failed:', data);
        alert('❌ Simple generation failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Simple generation error:', error);
      alert('❌ Simple generation error');
    } finally {
      setLoading(false);
    }
  };
  const generateQuestions = async () => {
    if (!selectedRole || selectedTechStack.length === 0) {
      alert('Please select a role and tech stack');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          level: selectedLevel,
          type: selectedType,
          techstack: selectedTechStack,
          amount,
          useDynamicTechStack: true
        })
      });

      const data = await response.json();
      if (data.questions) {
        setQuestions(data.questions);
        setMetadata(data.metadata);
      } else {
        console.error('Failed to generate questions:', data.error);
        
        // If it's a Space error, show helpful information
        if (data.spaceStatus) {
          setSpaceHealth(data);
        }
        
        alert('Failed to generate questions: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Error generating questions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-yellow-500" />
          Dynamic Tech Stack Question Generator
        </h1>
        <p className="text-muted-foreground">
          AI-powered interview questions with dynamic technology selection
        </p>
      </div>

      {/* Space Health Check */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Hugging Face Space Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              onClick={checkSpaceHealth}
              disabled={checkingHealth}
              variant="outline"
              size="sm"
            >
              {checkingHealth ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Checking...
                </>
              ) : (
                'Check Space Health'
              )}
            </Button>
            
            <Button
              onClick={wakeUpSpace}
              disabled={wakingUp}
              variant="outline"
              size="sm"
            >
              {wakingUp ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Waking Up...
                </>
              ) : (
                'Wake Up Space'
              )}
            </Button>

            <Button
              onClick={async () => {
                try {
                  const response = await fetch('/api/ai/test-space', { method: 'POST' });
                  const data = await response.json();
                  console.log('Space test results:', data);
                  alert('Space test completed - check console for details');
                } catch (error) {
                  console.error('Space test error:', error);
                  alert('Space test failed - check console');
                }
              }}
              variant="outline"
              size="sm"
            >
              Debug Space
            </Button>

            <Button
              onClick={runComprehensiveDebug}
              disabled={debugLoading}
              variant="outline"
              size="sm"
            >
              {debugLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Running...
                </>
              ) : (
                'Full Debug'
              )}
            </Button>

            <Button
              onClick={testSimpleGeneration}
              disabled={loading || !selectedRole || selectedTechStack.length === 0}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Testing...
                </>
              ) : (
                'Test Simple Gen'
              )}
            </Button>

            <Button
              onClick={async () => {
                if (!selectedRole || selectedTechStack.length === 0) {
                  alert('Please select a role and tech stack first');
                  return;
                }
                
                setLoading(true);
                try {
                  const response = await fetch('/api/ai/inference-generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      role: selectedRole,
                      level: selectedLevel,
                      type: selectedType,
                      techstack: selectedTechStack.slice(0, 3),
                      amount: 3,
                      useDynamicTechStack: true
                    })
                  });

                  const data = await response.json();
                  if (data.questions) {
                    setQuestions(data.questions);
                    setMetadata(data.metadata);
                    alert('✅ Inference API worked! Your model is generating questions.');
                  } else {
                    console.error('Inference API failed:', data);
                    alert('❌ Inference API failed: ' + (data.error || 'Unknown error'));
                  }
                } catch (error) {
                  console.error('Inference API error:', error);
                  alert('❌ Inference API error');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || !selectedRole || selectedTechStack.length === 0}
              variant="default"
              size="sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Testing...
                </>
              ) : (
                'Test Inference API'
              )}
            </Button>

            <Button
              onClick={async () => {
                setDebugLoading(true);
                try {
                  const response = await fetch('/api/ai/test-free-tier', { method: 'POST' });
                  const data = await response.json();
                  
                  if (data.success) {
                    alert('✅ Your optimized Space is working! Questions: ' + data.questions?.join(' | '));
                    if (data.questions) {
                      setQuestions(data.questions);
                      setMetadata({
                        model: "Optimized Space",
                        method: "Free Tier Test",
                        generatedAt: new Date().toISOString()
                      });
                    }
                  } else {
                    alert('❌ Space needs optimization. Check console for details.');
                    console.log('Space test results:', data);
                  }
                } catch (error) {
                  console.error('Free tier test error:', error);
                  alert('❌ Test failed - check console');
                } finally {
                  setDebugLoading(false);
                }
              }}
              disabled={debugLoading}
              variant="default"
              size="sm"
            >
              {debugLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Testing...
                </>
              ) : (
                'Test Free Tier'
              )}
            </Button>
          </div>

          {spaceHealth && (
            <div className={`p-3 rounded-lg border ${
              spaceHealth.status === 'healthy' ? 'bg-green-50 border-green-200' :
              spaceHealth.status === 'error' ? 'bg-red-50 border-red-200' :
              'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${
                  spaceHealth.status === 'healthy' ? 'bg-green-500' :
                  spaceHealth.status === 'error' ? 'bg-red-500' :
                  'bg-yellow-500'
                }`} />
                <span className="font-medium">
                  {spaceHealth.status === 'healthy' ? '✅ Space is Healthy' :
                   spaceHealth.status === 'error' ? '❌ Space Error' :
                   '⚠️ Space Issue'}
                </span>
              </div>
              
              <p className="text-sm mb-2">{spaceHealth.message}</p>
              
              {spaceHealth.spaceUrl && (
                <p className="text-xs text-muted-foreground mb-2">
                  Space URL: <a href={spaceHealth.spaceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {spaceHealth.spaceUrl}
                  </a>
                </p>
              )}
              
              {spaceHealth.troubleshooting && (
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Troubleshooting:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {spaceHealth.troubleshooting.map((step: string, index: number) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {comprehensiveDebug && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3">🔍 Comprehensive Debug Results</h4>
              
              {comprehensiveDebug.summary && (
                <div className="mb-4 p-3 bg-white rounded border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">Summary:</span>
                    <Badge variant={comprehensiveDebug.summary.successRate === '100%' ? 'default' : 'destructive'}>
                      {comprehensiveDebug.summary.passedTests}/{comprehensiveDebug.summary.totalTests} tests passed
                    </Badge>
                  </div>
                  
                  {comprehensiveDebug.summary.recommendations && (
                    <div className="space-y-1">
                      {comprehensiveDebug.summary.recommendations.map((rec: string, index: number) => (
                        <p key={index} className="text-sm">{rec}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {comprehensiveDebug.tests?.map((test: any, index: number) => (
                  <div key={index} className={`p-2 rounded border text-sm ${
                    test.status === 'PASS' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={test.status === 'PASS' ? 'text-green-600' : 'text-red-600'}>
                        {test.status === 'PASS' ? '✅' : '❌'}
                      </span>
                      <span className="font-medium">{test.name}</span>
                      {test.statusCode && (
                        <Badge variant="outline" className="text-xs">
                          {test.statusCode}
                        </Badge>
                      )}
                    </div>
                    
                    {test.details && <p className="text-xs text-gray-600 mb-1">{test.details}</p>}
                    {test.error && <p className="text-xs text-red-600 mb-1">Error: {test.error}</p>}
                    
                    {test.responsePreview && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-500">Response Preview</summary>
                        <pre className="mt-1 p-2 bg-gray-100 rounded overflow-x-auto">
                          {test.responsePreview}
                        </pre>
                      </details>
                    )}
                    
                    {test.fullResult && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-500">Full Result</summary>
                        <pre className="mt-1 p-2 bg-gray-100 rounded overflow-x-auto max-h-32">
                          {test.fullResult}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interview Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Job Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {jobRoles.map(role => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Experience Level</label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {experienceLevels.map(level => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Interview Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {interviewTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Questions Count</label>
              <Select value={amount.toString()} onValueChange={(value) => setAmount(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 5, 8, 10, 15, 20].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} questions
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Tech Stack Selector */}
      <DynamicTechStackSelector
        onTechStackChange={setSelectedTechStack}
        selectedRole={selectedRole}
        selectedLevel={selectedLevel}
        maxSelection={8}
      />

      {/* Generate Questions */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={generateQuestions}
            disabled={loading || !selectedRole || selectedTechStack.length === 0}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Generating Questions...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate {amount} Interview Questions
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Questions */}
      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Questions</CardTitle>
            {metadata && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Role:</strong> {metadata.role}</p>
                <p><strong>Level:</strong> {metadata.level}</p>
                <p><strong>Tech Stack:</strong> {metadata.techStack?.join(', ')}</p>
                <p><strong>Dynamic:</strong> {metadata.isDynamicTechStack ? 'Yes' : 'No'}</p>
                <p><strong>Generated:</strong> {new Date(metadata.generatedAt).toLocaleString()}</p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">
                      Q{index + 1}
                    </Badge>
                    <p className="flex-1">{question}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Examples */}
      <Card>
        <CardHeader>
          <CardTitle>API Usage Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Get Tech Stacks by Category</h4>
              <code className="block p-2 bg-muted rounded text-sm">
                GET /api/tech-stacks?action=categories
              </code>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">2. Get Tech Stacks for Role</h4>
              <code className="block p-2 bg-muted rounded text-sm">
                GET /api/tech-stacks?action=role&role=frontend-developer
              </code>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">3. Generate Dynamic Tech Stack</h4>
              <code className="block p-2 bg-muted rounded text-sm">
                POST /api/tech-stacks<br/>
                {`{ "role": "Frontend Developer", "level": "Senior", "count": 5 }`}
              </code>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">4. Generate Questions with Dynamic Tech Stack</h4>
              <code className="block p-2 bg-muted rounded text-sm">
                POST /api/ai/generate-questions<br/>
                {`{ "role": "Frontend Developer", "level": "Senior", "type": "Technical", "amount": 5, "useDynamicTechStack": true }`}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
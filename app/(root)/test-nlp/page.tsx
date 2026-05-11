'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import ResponseAnalyzer from '@/components/nlp/ResponseAnalyzer';

const exampleResponses = [
  "I have 5 years of React experience and built scalable systems handling millions of users.",
  "Um, I'm not really sure about React. This is quite challenging for me.",
  "Oh yeah, React is just AMAZING. I absolutely LOVE debugging for hours.",
  "I'm probably the worst developer ever, but I built a system handling 10M requests daily.",
  "Everyone else understands this better. I feel like a fraud in this interview."
];

export default function TestNLPPage() {
  const [inputText, setInputText] = useState('');

  const handleExampleClick = (example: string) => {
    setInputText(example);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">🎯 HireFlow NLP Analysis</h1>
          <p className="text-muted-foreground">
            Test the integrated NLP analysis for interview responses
          </p>
        </div>

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>📝 Interview Response Input</CardTitle>
            <CardDescription>
              Enter an interview response to analyze sentiment, emotion, communication quality, confidence, and stress levels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="response">Interview Response</Label>
              <Textarea
                id="response"
                placeholder="Example: I have 5 years of React experience and have built several scalable applications..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={4}
                className="min-h-[100px]"
              />
            </div>

            {/* Example Responses */}
            <div className="space-y-2">
              <Label>💡 Example Interview Responses</Label>
              <div className="grid gap-2">
                {exampleResponses.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example)}
                    className="text-left p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Section */}
        <ResponseAnalyzer 
          text={inputText}
          sessionId="test-session"
          questionId="test-question"
          autoAnalyze={true}
        />

        {/* API Information */}
        <Card>
          <CardHeader>
            <CardTitle>🔧 API Integration</CardTitle>
            <CardDescription>
              This NLP analysis is now integrated into your HireFlow app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-2">API Endpoint:</h4>
              <code className="text-sm bg-white px-2 py-1 rounded border">
                POST /api/nlp/analyze-response
              </code>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-2">Usage in Components:</h4>
              <code className="text-sm bg-white px-2 py-1 rounded border block">
                {`import ResponseAnalyzer from '@/components/nlp/ResponseAnalyzer';`}
              </code>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>✅ Integrated into your Next.js app</p>
              <p>✅ Works with npm run dev</p>
              <p>✅ No separate Python server needed</p>
              <p>✅ Ready for production deployment</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
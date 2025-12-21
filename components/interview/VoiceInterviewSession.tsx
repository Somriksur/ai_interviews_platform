'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react';

interface Question {
  id: number;
  text: string;
  asked: boolean;
  answered: boolean;
  response?: string;
}

interface VoiceInterviewSessionProps {
  driveId: string;
  studentId: string;
  role: string;
  level: string;
  techStack: string[];
  onComplete: (responses: any[]) => void;
}

export default function VoiceInterviewSession({
  driveId,
  studentId,
  role,
  level,
  techStack,
  onComplete
}: VoiceInterviewSessionProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callStatus, setCallStatus] = useState<string>('Ready to start');
  const [responses, setResponses] = useState<any[]>([]);
  
  // VAPI integration
  const vapiRef = useRef<any>(null);
  const [vapiLoaded, setVapiLoaded] = useState(false);

  // Load VAPI SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@vapi-ai/web@latest/dist/index.js';
    script.onload = () => {
      if (window.Vapi) {
        vapiRef.current = new window.Vapi(process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN);
        setVapiLoaded(true);
        console.log('✅ VAPI loaded successfully');
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Generate questions from your Space
  const generateQuestions = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/simple-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          level,
          techstack: techStack,
          amount: 5,
          type: 'technical'
        })
      });

      const data = await response.json();
      
      if (data.questions) {
        const formattedQuestions: Question[] = data.questions.map((q: string, index: number) => ({
          id: index + 1,
          text: q,
          asked: false,
          answered: false
        }));
        
        setQuestions(formattedQuestions);
        console.log('✅ Generated questions from your Space:', formattedQuestions);
      } else {
        throw new Error(data.error || 'Failed to generate questions');
      }
    } catch (error) {
      console.error('❌ Error generating questions:', error);
      setCallStatus('Failed to generate questions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Start voice interview
  const startVoiceInterview = async () => {
    if (!vapiLoaded || !vapiRef.current) {
      setCallStatus('VAPI not loaded. Please refresh the page.');
      return;
    }

    if (questions.length === 0) {
      await generateQuestions();
      return;
    }

    try {
      setCallStatus('Starting voice interview...');
      
      // Create VAPI assistant configuration
      const assistantConfig = {
        model: {
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a professional technical interviewer conducting a ${level} ${role} interview. 

Your questions to ask in order:
${questions.map((q, i) => `${i + 1}. ${q.text}`).join('\n')}

Instructions:
- Ask questions one by one in the exact order provided
- Wait for the candidate's complete response before moving to the next question
- Be encouraging and professional
- After each answer, briefly acknowledge it and move to the next question
- After all questions, thank the candidate and end the interview
- Keep your responses concise and focused on the interview flow`
            }
          ]
        },
        voice: {
          provider: 'elevenlabs',
          voiceId: 'rachel',
          stability: 0.5,
          similarityBoost: 0.8
        },
        firstMessage: `Hello! I'm excited to conduct your ${level} ${role} interview today. We'll be covering ${techStack.join(', ')} technologies. Are you ready to begin with the first question?`,
        recordingEnabled: true,
        endCallMessage: "Thank you for your time today. The interview has been completed successfully. Good luck!",
        maxDurationSeconds: 1800 // 30 minutes max
      };

      // Start the call
      await vapiRef.current.start(assistantConfig);
      setIsCallActive(true);
      setCallStatus('Interview in progress...');

      // Set up event listeners
      vapiRef.current.on('call-start', () => {
        console.log('📞 Call started');
        setCallStatus('Connected - Interview starting...');
      });

      vapiRef.current.on('call-end', () => {
        console.log('📞 Call ended');
        setIsCallActive(false);
        setCallStatus('Interview completed');
        handleInterviewComplete();
      });

      vapiRef.current.on('speech-start', () => {
        console.log('🎤 User started speaking');
      });

      vapiRef.current.on('speech-end', () => {
        console.log('🎤 User stopped speaking');
      });

      vapiRef.current.on('message', (message: any) => {
        console.log('💬 Message:', message);
        // Track responses here if needed
      });

    } catch (error) {
      console.error('❌ Error starting voice interview:', error);
      setCallStatus('Failed to start interview. Please try again.');
      setIsCallActive(false);
    }
  };

  // End voice interview
  const endVoiceInterview = async () => {
    if (vapiRef.current && isCallActive) {
      try {
        await vapiRef.current.stop();
        setIsCallActive(false);
        setCallStatus('Interview ended');
      } catch (error) {
        console.error('❌ Error ending call:', error);
      }
    }
  };

  // Handle interview completion
  const handleInterviewComplete = () => {
    const interviewData = {
      driveId,
      studentId,
      questions: questions.map(q => q.text),
      completedAt: new Date().toISOString(),
      duration: '30 minutes', // You can track actual duration
      status: 'completed'
    };
    
    onComplete(interviewData);
  };

  // Toggle mute
  const toggleMute = () => {
    if (vapiRef.current && isCallActive) {
      vapiRef.current.setMuted(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-6 w-6" />
            Voice Interview Session
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">{role}</Badge>
            <Badge variant="outline">{level}</Badge>
            {techStack.map(tech => (
              <Badge key={tech} variant="secondary">{tech}</Badge>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="text-lg font-medium">{callStatus}</div>
            
            {!isCallActive && questions.length === 0 && (
              <Button 
                onClick={generateQuestions}
                disabled={isGenerating}
                size="lg"
                className="w-full max-w-md"
              >
                {isGenerating ? 'Generating Questions...' : 'Generate Questions & Start Interview'}
              </Button>
            )}

            {!isCallActive && questions.length > 0 && (
              <Button 
                onClick={startVoiceInterview}
                disabled={!vapiLoaded}
                size="lg"
                className="w-full max-w-md bg-green-600 hover:bg-green-700"
              >
                <Phone className="h-5 w-5 mr-2" />
                Start Voice Interview
              </Button>
            )}

            {isCallActive && (
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={toggleMute}
                  variant="outline"
                  size="lg"
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  {isMuted ? 'Unmute' : 'Mute'}
                </Button>
                
                <Button
                  onClick={endVoiceInterview}
                  variant="destructive"
                  size="lg"
                >
                  <PhoneOff className="h-5 w-5 mr-2" />
                  End Interview
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Questions Preview */}
      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Interview Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {questions.map((question, index) => (
                <div 
                  key={question.id}
                  className={`p-3 rounded-lg border ${
                    index === currentQuestionIndex ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-600 mb-1">
                    Question {question.id}
                  </div>
                  <div className="text-gray-900">{question.text}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <div>1. 🤖 Questions are generated using your custom GPU-optimized model</div>
            <div>2. 🎤 Voice interview is conducted using VAPI AI assistant</div>
            <div>3. 📝 Your responses are recorded and can be analyzed</div>
            <div>4. 📊 Interview results are saved for review</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
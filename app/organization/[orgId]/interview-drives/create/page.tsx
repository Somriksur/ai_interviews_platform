"use client";

import { use, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DynamicTechStackSelector from "@/components/interview/DynamicTechStackSelector";

interface College {
  id: string;
  name: string;
}

export default function CreateDrivePage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingPrePopulation, setFetchingPrePopulation] = useState(false);
  const router = useRouter();

  // Get URL parameters
  const jobId = searchParams.get('jobId');
  const collegeId = searchParams.get('collegeId');
  const collegesParam = searchParams.get('colleges'); // Comma-separated college IDs

  const [driveData, setDriveData] = useState({
    name: "",
    description: "",
    role: "",
    selectedColleges: [] as string[],
    sourceJobId: undefined as string | undefined,
    sourceJobTitle: undefined as string | undefined,
    sourceCollegeId: undefined as string | undefined,
    sourceCollegeName: undefined as string | undefined,
  });

  const [interviewConfig, setInterviewConfig] = useState({
    level: "Mid-level",
    type: "Technical",
    techstack: [] as string[],
    amount: 5,
    useDynamicTechStack: true,
  });

  // Question generation state
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questionsGenerated, setQuestionsGenerated] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);

  useEffect(() => {
    fetchColleges();
  }, [orgId]);

  // Fetch pre-population data based on URL parameters
  useEffect(() => {
    const fetchPrePopulationData = async () => {
      const hasJobId = !!jobId;
      const hasCollegeId = !!collegeId;
      const hasCollegesParam = !!collegesParam;
      
      if (!hasJobId && !hasCollegeId && !hasCollegesParam) return;

      setFetchingPrePopulation(true);
      try {
        // Fetch job profile data
        if (hasJobId && jobId) {
          const jobResponse = await fetch(`/api/job-profiles/${jobId}`);
          if (jobResponse.ok) {
            const jobData = await jobResponse.json();
            const job = jobData.job || jobData;
            setDriveData(prev => ({
              ...prev,
              role: job.title || "",
              sourceJobId: jobId,
              sourceJobTitle: job.title || "",
            }));
          } else {
            console.warn('Job profile not found or error fetching:', jobId);
          }
        }
        
        // Handle multiple colleges from tag-colleges page
        if (hasCollegesParam && collegesParam) {
          const collegeIds = collegesParam.split(',').filter(id => id.trim());
          console.log('📋 Pre-selecting colleges:', collegeIds);
          setDriveData(prev => ({
            ...prev,
            selectedColleges: collegeIds,
          }));
        }
        // Handle single college (legacy support)
        else if (hasCollegeId && collegeId) {
          const collegeResponse = await fetch(`/api/colleges/${collegeId}`);
          if (collegeResponse.ok) {
            const collegeData = await collegeResponse.json();
            const college = collegeData.college || collegeData;
            setDriveData(prev => ({
              ...prev,
              selectedColleges: [collegeId],
              sourceCollegeId: collegeId,
              sourceCollegeName: college.name || "",
            }));
          } else {
            console.warn('College not found or error fetching:', collegeId);
          }
        }
      } catch (error) {
        console.error('Error fetching pre-population data:', error);
      } finally {
        setFetchingPrePopulation(false);
      }
    };

    fetchPrePopulationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, collegeId, collegesParam]);

  const fetchColleges = async () => {
    try {
      console.log('🔍 Fetching colleges');
      
      // If we have pre-selected colleges from URL, fetch those specifically
      if (collegesParam) {
        const collegeIds = collegesParam.split(',').filter(id => id.trim());
        console.log('📋 Fetching pre-selected colleges:', collegeIds);
        
        const collegePromises = collegeIds.map(async (id) => {
          try {
            const res = await fetch(`/api/colleges/${id}`);
            if (res.ok) {
              const data = await res.json();
              const college = data.college || data;
              return { id, name: college.name || 'Unknown College' };
            }
          } catch (err) {
            console.error(`Error fetching college ${id}:`, err);
          }
          return null;
        });
        
        const fetchedColleges = (await Promise.all(collegePromises)).filter(Boolean) as College[];
        console.log('✅ Fetched colleges:', fetchedColleges);
        setColleges(fetchedColleges);
      } else {
        // If no pre-selected colleges, try to search for all (with a wildcard)
        const response = await fetch(`/api/colleges/search?q=a`); // Search with 'a' to get colleges with 'a' in name
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Received colleges from search:', data.colleges?.length || 0);
          setColleges(data.colleges || []);
        } else {
          console.log('⚠️ No colleges found');
          setColleges([]);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching colleges:", error);
      setColleges([]);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!driveData.role) {
      alert("Please enter a job role first");
      return;
    }

    setIsGenerating(true);
    setQuestionError(null);

    try {
      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: driveData.role,
          level: interviewConfig.level,
          type: interviewConfig.type,
          techstack: interviewConfig.techstack,
          amount: interviewConfig.amount,
          useDynamicTechStack: interviewConfig.useDynamicTechStack,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedQuestions(data.questions);
        setQuestionsGenerated(true);
        
        // Show success message with tech stack info
        const techStackInfo = data.metadata?.isDynamicTechStack 
          ? `Dynamic tech stack: ${data.metadata.techStack?.join(', ')}`
          : `Custom tech stack: ${interviewConfig.techstack.join(', ')}`;
        
        alert(`✅ Generated ${data.questions.length} questions successfully!\n${techStackInfo}`);
      } else {
        const errorData = await response.json();
        setQuestionError(errorData.error || 'Failed to generate questions');
        alert(`❌ ${errorData.error || 'Failed to generate questions'}`);
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      setQuestionError('Network error occurred');
      alert('❌ Network error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditQuestion = (index: number, newQuestion: string) => {
    const updatedQuestions = [...generatedQuestions];
    updatedQuestions[index] = newQuestion;
    setGeneratedQuestions(updatedQuestions);
  };

  const handleAddQuestion = () => {
    setGeneratedQuestions([...generatedQuestions, '']);
  };

  const handleRemoveQuestion = (index: number) => {
    const updatedQuestions = generatedQuestions.filter((_, i) => i !== index);
    setGeneratedQuestions(updatedQuestions);
  };

  const handleCreateDrive = async () => {
    if (!questionsGenerated || generatedQuestions.length === 0) {
      alert("Please generate questions before creating the drive");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create interview drive with configuration and questions
      const driveResponse = await fetch(`/api/organization/${orgId}/interview-drives`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...driveData,
          colleges: driveData.selectedColleges,
          interviewConfig: {
            role: driveData.role,
            level: interviewConfig.level,
            type: interviewConfig.type,
            techstack: interviewConfig.techstack,
            amount: interviewConfig.amount,
          },
          questions: generatedQuestions.map((question, index) => ({
            text: question,
            order: index + 1,
            generatedBy: 'ai' as const,
          })),
          aiMetadata: {
            modelUsed: 'somriksur/HireFlow-Qwen-Fast',
            questionsGeneratedAt: new Date(),
          },
        }),
      });

      if (!driveResponse.ok) {
        throw new Error("Failed to create drive");
      }

      await driveResponse.json();

      alert(`✅ Interview drive created successfully! Colleges have been notified and can now assign students.`);
      router.push(`/organization/${orgId}/interview-drives`);
    } catch (error) {
      console.error("Error creating drive:", error);
      alert("❌ Failed to create interview drive");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/organization/${orgId}/interview-drives`}
            className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← Back to Drives
          </Link>
          <h1 className="text-3xl font-bold">Create Interview Drive</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Step {step} of 3: {
              step === 1 ? "Drive Details" :
              step === 2 ? "Select Colleges" :
              "Interview Configuration"
            }
          </p>
          {fetchingPrePopulation && (
            <p className="text-sm text-blue-600 mt-2">
              ⏳ Loading pre-filled data...
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded ${
                  s <= step ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"
                } ${s !== 3 ? "mr-2" : ""}`}
              />
            ))}
          </div>
        </div>

        {/* Visual Context Indicators */}
        {(driveData.sourceJobTitle || driveData.sourceCollegeName) && (
          <div className="mb-6 space-y-2">
            {driveData.sourceJobTitle && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <span className="text-sm text-blue-800 dark:text-blue-200">
                  📋 Creating drive for job: <strong>{driveData.sourceJobTitle}</strong>
                </span>
              </div>
            )}
            {driveData.sourceCollegeName && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <span className="text-sm text-green-800 dark:text-green-200">
                  🏫 Pre-selected college: <strong>{driveData.sourceCollegeName}</strong>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Drive Details */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Drive Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Drive Name *</label>
                <input
                  type="text"
                  required
                  value={driveData.name}
                  onChange={(e) => setDriveData({ ...driveData, name: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., Campus Placement Drive 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={driveData.description}
                  onChange={(e) => setDriveData({ ...driveData, description: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  rows={3}
                  placeholder="Brief description of the drive"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Job Role *</label>
                <input
                  type="text"
                  required
                  value={driveData.role}
                  onChange={(e) => setDriveData({ ...driveData, role: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., Software Developer"
                />
              </div>
              <Button
                onClick={() => setStep(2)}
                disabled={!driveData.name || !driveData.role}
              >
                Next: Select Colleges →
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Select Colleges */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Select Colleges</h2>
            
            {colleges.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">No colleges found</p>
                <p className="text-sm text-gray-400">
                  Please add colleges to your organization first
                </p>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {colleges.map((college) => (
                  <label
                    key={college.id}
                    className="flex items-center p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={driveData.selectedColleges.includes(college.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setDriveData({
                            ...driveData,
                            selectedColleges: [...driveData.selectedColleges, college.id],
                          });
                        } else {
                          setDriveData({
                            ...driveData,
                            selectedColleges: driveData.selectedColleges.filter(
                              (id) => id !== college.id
                            ),
                          });
                        }
                      }}
                      className="mr-3"
                    />
                    <span className="font-medium">{college.name}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={driveData.selectedColleges.length === 0}
              >
                Next: Configure Interview →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Interview Configuration */}
        {step === 3 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Interview Configuration</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Experience Level</label>
                <select
                  value={interviewConfig.level}
                  onChange={(e) => setInterviewConfig({ ...interviewConfig, level: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="Junior">Junior (1-3 years)</option>
                  <option value="Mid-level">Mid-Level (3-5 years)</option>
                  <option value="Senior">Senior (5+ years)</option>
                  <option value="Lead">Lead (7+ years)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Interview Type</label>
                <select
                  value={interviewConfig.type}
                  onChange={(e) => setInterviewConfig({ ...interviewConfig, type: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="Technical">Technical</option>
                  <option value="Behavioral">Behavioral</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Number of Questions</label>
                <select
                  value={interviewConfig.amount}
                  onChange={(e) => setInterviewConfig({ ...interviewConfig, amount: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={7}>7 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                </select>
              </div>
            </div>

            {/* Dynamic Tech Stack Selector */}
            <div className="mb-6">
              <DynamicTechStackSelector
                onTechStackChange={(techStacks) => 
                  setInterviewConfig({ ...interviewConfig, techstack: techStacks })
                }
                selectedRole={driveData.role}
                selectedLevel={interviewConfig.level}
                maxSelection={8}
              />
            </div>

            {/* AI Question Generation Section */}
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">🤖 AI Question Generation</h3>
              
              {!questionsGenerated ? (
                <div className="text-center py-6">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Generate intelligent interview questions using our custom AI model
                  </p>
                  <Button
                    onClick={handleGenerateQuestions}
                    disabled={isGenerating || !driveData.role}
                    className="px-6 py-3"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                        Generating Questions...
                      </>
                    ) : (
                      <>🎯 Generate Questions</>
                    )}
                  </Button>
                  {questionError && (
                    <p className="text-red-500 mt-2 text-sm">{questionError}</p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Generated Questions ({generatedQuestions.length})</h4>
                    <div className="space-x-2">
                      <Button
                        onClick={handleAddQuestion}
                        variant="outline"
                        size="sm"
                      >
                        ➕ Add Question
                      </Button>
                      <Button
                        onClick={handleGenerateQuestions}
                        variant="outline"
                        size="sm"
                        disabled={isGenerating}
                      >
                        🔄 Regenerate
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {generatedQuestions.map((question, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-sm font-medium text-gray-500 mt-2">{index + 1}.</span>
                        <textarea
                          value={question}
                          onChange={(e) => handleEditQuestion(index, e.target.value)}
                          className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
                          rows={2}
                          placeholder="Enter your question..."
                        />
                        <Button
                          onClick={() => handleRemoveQuestion(index)}
                          variant="destructive"
                          size="sm"
                        >
                          🗑️
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {generatedQuestions.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      No questions generated. Click "Add Question" to add manually.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 my-6">
              <h3 className="font-semibold mb-2">Summary</h3>
              <ul className="space-y-1 text-sm">
                <li>📋 Drive: {driveData.name}</li>
                <li>💼 Role: {driveData.role}</li>
                <li>🏫 Colleges: {driveData.selectedColleges.length}</li>
                <li>🔧 Tech Stack: {interviewConfig.techstack.length > 0 ? interviewConfig.techstack.join(', ') : 'Dynamic (AI-selected)'}</li>
                <li>❓ Questions: {questionsGenerated ? generatedQuestions.length : interviewConfig.amount}</li>
              </ul>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                Note: Colleges will select and assign students to this drive.
              </p>
            </div>

            {/* Help text for final step */}
            {!questionsGenerated && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>Next Step:</strong> Generate AI-powered interview questions with {interviewConfig.techstack.length > 0 ? 'your selected' : 'dynamically chosen'} tech stack before creating your drive.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                ← Back
              </Button>
              <Button 
                onClick={handleCreateDrive} 
                disabled={loading || !questionsGenerated || generatedQuestions.length === 0}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "🚀 Create Drive & Notify Colleges"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

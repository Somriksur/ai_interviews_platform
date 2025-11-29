"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import MultipleEmailInvitations from "@/components/MultipleEmailInvitations";

export default function BulkInvitePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<string[]>([]);
    const [selectedTechStacks, setSelectedTechStacks] = useState<string[]>([]);
    const [form, setForm] = useState({
        role: "",
        level: "mid-level",
        type: "technical",
        techstack: "",
        amount: "5",
    });

    const ROLE_TECH_STACKS: Record<string, string[]> = {
        "Software Developer": ["JavaScript", "Python", "Java", "Git", "SQL", "REST APIs", "Docker", "AWS"],
        "Web Developer": ["HTML", "CSS", "JavaScript", "React", "Node.js", "MongoDB", "Git", "Responsive Design"],
        "Frontend Developer": ["React", "TypeScript", "CSS", "HTML", "Redux", "Webpack", "Jest", "Tailwind"],
        "Backend Developer": ["Node.js", "Python", "PostgreSQL", "MongoDB", "REST APIs", "Docker", "Redis", "Microservices"],
        "Full Stack Developer": ["React", "Node.js", "TypeScript", "PostgreSQL", "MongoDB", "Docker", "AWS", "Git"],
        "Data Scientist": ["Python", "Pandas", "NumPy", "Scikit-learn", "TensorFlow", "SQL", "Jupyter", "Statistics"],
        "DevOps Engineer": ["Docker", "Kubernetes", "Jenkins", "AWS", "Terraform", "Linux", "CI/CD", "Monitoring"],
    };

    useEffect(() => {
        if (form.role && ROLE_TECH_STACKS[form.role]) {
            setSelectedTechStacks([]);
            setForm(prev => ({ ...prev, techstack: "" }));
        }
    }, [form.role]);

    useEffect(() => {
        setForm(prev => ({ ...prev, techstack: selectedTechStacks.join(", ") }));
    }, [selectedTechStacks]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const toggleTechStack = (tech: string) => {
        const maxAllowed = parseInt(form.amount);
        
        if (selectedTechStacks.includes(tech)) {
            setSelectedTechStacks(selectedTechStacks.filter(t => t !== tech));
        } else {
            if (selectedTechStacks.length < maxAllowed) {
                setSelectedTechStacks([...selectedTechStacks, tech]);
            } else {
                toast.error(`Maximum ${maxAllowed} tech stacks allowed`);
            }
        }
    };

    const generateQuestions = async () => {
        if (!form.role || !form.techstack) {
            toast.error("Please fill in role and tech stack");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/recruiter/generate-questions-hf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();
            if (data.success) {
                setQuestions(data.questions);
                toast.success("Questions generated!");
            } else {
                toast.error(data.error || "Failed to generate questions");
            }
        } catch {
            toast.error("Failed to generate questions");
        } finally {
            setLoading(false);
        }
    };

    const suggestedTechStacks = form.role && ROLE_TECH_STACKS[form.role] ? ROLE_TECH_STACKS[form.role] : [];

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <div className="mb-6">
                <Button
                    onClick={() => router.push("/recruiter/dashboard")}
                    variant="outline"
                >
                    ← Back to Dashboard
                </Button>
            </div>

            <div className="mb-6">
                <h1 className="text-4xl font-bold mb-2">📧 Bulk Interview Invitations</h1>
                <p className="text-gray-500">
                    Create interview questions once and send to multiple candidates
                </p>
            </div>

            <div className="card p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Job Role *</label>
                        <select
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg bg-background"
                            required
                        >
                            <option value="">Select a role...</option>
                            <option value="Software Developer">Software Developer</option>
                            <option value="Web Developer">Web Developer</option>
                            <option value="Frontend Developer">Frontend Developer</option>
                            <option value="Backend Developer">Backend Developer</option>
                            <option value="Full Stack Developer">Full Stack Developer</option>
                            <option value="Data Scientist">Data Scientist</option>
                            <option value="DevOps Engineer">DevOps Engineer</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Experience Level</label>
                        <select
                            name="level"
                            value={form.level}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg bg-background"
                        >
                            <option value="junior">Junior (1-3 years)</option>
                            <option value="mid-level">Mid-Level (3-5 years)</option>
                            <option value="senior">Senior (5+ years)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Interview Type</label>
                        <select
                            name="type"
                            value={form.type}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg bg-background"
                        >
                            <option value="technical">Technical</option>
                            <option value="behavioral">Behavioral</option>
                            <option value="mixed">Mixed</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Number of Questions</label>
                        <select
                            name="amount"
                            value={form.amount}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg bg-background"
                        >
                            <option value="3">3 Questions</option>
                            <option value="5">5 Questions</option>
                            <option value="7">7 Questions</option>
                            <option value="10">10 Questions</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">
                        Tech Stack * (Select up to {form.amount})
                    </label>
                    
                    {suggestedTechStacks.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {suggestedTechStacks.map((tech) => (
                                <button
                                    key={tech}
                                    type="button"
                                    onClick={() => toggleTechStack(tech)}
                                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                                        selectedTechStacks.includes(tech)
                                            ? "bg-primary text-white border-primary"
                                            : "bg-background border-gray-300 hover:border-primary"
                                    }`}
                                >
                                    {tech}
                                    {selectedTechStacks.includes(tech) && " ✓"}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <input
                            type="text"
                            name="techstack"
                            value={form.techstack}
                            onChange={handleChange}
                            placeholder="e.g., React, TypeScript, Node.js"
                            className="w-full p-3 border rounded-lg bg-background"
                            required
                        />
                    )}
                    <div className="text-sm text-gray-400 mt-2">
                        Selected: {selectedTechStacks.length} / {form.amount}
                    </div>
                </div>

                <Button
                    onClick={generateQuestions}
                    disabled={loading || !form.role || !form.techstack}
                    className="w-full"
                    size="lg"
                >
                    {loading ? "Generating..." : "🤖 Generate Questions with AI"}
                </Button>

                {questions.length > 0 && (
                    <div className="space-y-4 pt-6 border-t-2">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-semibold">Generated Questions</h3>
                            <Button
                                onClick={() => setQuestions([])}
                                variant="outline"
                                size="sm"
                            >
                                🔄 Regenerate
                            </Button>
                        </div>
                        
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {questions.map((q, i) => (
                                <div key={i} className="p-3 border rounded-lg bg-background">
                                    <span className="font-semibold">{i + 1}. </span>
                                    {q}
                                </div>
                            ))}
                        </div>

                        <div className="pt-6">
                            <MultipleEmailInvitations
                                interviewData={{
                                    role: form.role,
                                    level: form.level,
                                    type: form.type,
                                    techstack: form.techstack.split(",").map(t => t.trim()),
                                    questions: questions,
                                }}
                                onSuccess={() => {
                                    toast.success("Redirecting to dashboard...");
                                    setTimeout(() => {
                                        router.push("/recruiter/dashboard");
                                    }, 2000);
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function CreateInterviewPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<string[]>([]);
    const [form, setForm] = useState({
        role: "",
        level: "mid-level",
        type: "technical",
        techstack: "",
        amount: "5",
        candidateEmail: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const generateQuestions = async () => {
        if (!form.role || !form.techstack) {
            toast.error("Please fill in role and tech stack");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/recruiter/generate-questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();
            if (data.success) {
                setQuestions(data.questions);
                toast.success("Questions generated successfully!");
            } else {
                toast.error(data.error || "Failed to generate questions");
            }
        } catch {
            toast.error("Failed to generate questions");
        } finally {
            setLoading(false);
        }
    };

    const createInterview = async () => {
        if (questions.length === 0) {
            toast.error("Please generate questions first");
            return;
        }

        if (!form.candidateEmail) {
            toast.error("Please enter candidate email");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/recruiter/create-interview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    techstack: form.techstack.split(",").map(t => t.trim()),
                    questions,
                }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success(`Interview assigned to ${form.candidateEmail}!`);
                router.push(`/recruiter/dashboard`);
            } else {
                toast.error(data.error || "Failed to create interview");
            }
        } catch {
            toast.error("Failed to create interview");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Create New Interview</h1>

            <div className="card p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Job Role *</label>
                        <input
                            type="text"
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                            placeholder="e.g., Frontend Developer"
                            className="w-full p-3 border rounded-lg bg-background"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Experience Level</label>
                        <select
                            name="level"
                            value={form.level}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg bg-background"
                        >
                            <option value="junior">Junior</option>
                            <option value="mid-level">Mid-Level</option>
                            <option value="senior">Senior</option>
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
                        <input
                            type="number"
                            name="amount"
                            value={form.amount}
                            onChange={handleChange}
                            min="3"
                            max="15"
                            className="w-full p-3 border rounded-lg bg-background"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Tech Stack (comma-separated) *</label>
                    <input
                        type="text"
                        name="techstack"
                        value={form.techstack}
                        onChange={handleChange}
                        placeholder="e.g., React, TypeScript, Node.js"
                        className="w-full p-3 border rounded-lg bg-background"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Candidate Email *</label>
                    <input
                        type="email"
                        name="candidateEmail"
                        value={form.candidateEmail}
                        onChange={handleChange}
                        placeholder="candidate@example.com"
                        className="w-full p-3 border rounded-lg bg-background"
                        required
                    />
                    <p className="text-sm text-gray-400 mt-1">
                        Interview will be assigned to this candidate
                    </p>
                </div>

                <Button
                    onClick={generateQuestions}
                    disabled={loading}
                    className="btn-primary w-full"
                >
                    {loading ? "Generating..." : "🤖 Generate Questions with AI"}
                </Button>

                {questions.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold">Generated Questions</h3>
                        <div className="space-y-2">
                            {questions.map((q, i) => (
                                <div key={i} className="p-3 border rounded-lg bg-background">
                                    <span className="font-semibold">{i + 1}.</span> {q}
                                </div>
                            ))}
                        </div>

                        <Button
                            onClick={createInterview}
                            disabled={loading}
                            className="btn-primary w-full"
                        >
                            ✅ Create Interview
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

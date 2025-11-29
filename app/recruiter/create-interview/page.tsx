"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Tech stack suggestions for each role
const ROLE_TECH_STACKS: Record<string, string[]> = {
    "Software Developer": ["JavaScript", "Python", "Java", "Git", "SQL", "REST APIs", "Docker", "AWS"],
    "Web Developer": ["HTML", "CSS", "JavaScript", "React", "Node.js", "MongoDB", "Git", "Responsive Design"],
    "Frontend Developer": ["React", "TypeScript", "CSS", "HTML", "Redux", "Webpack", "Jest", "Tailwind"],
    "Backend Developer": ["Node.js", "Python", "PostgreSQL", "MongoDB", "REST APIs", "Docker", "Redis", "Microservices"],
    "Full Stack Developer": ["React", "Node.js", "TypeScript", "PostgreSQL", "MongoDB", "Docker", "AWS", "Git"],
    "Mobile Developer": ["React Native", "Flutter", "Swift", "Kotlin", "Firebase", "REST APIs", "Git", "App Store"],
    "Data Scientist": ["Python", "Pandas", "NumPy", "Scikit-learn", "TensorFlow", "SQL", "Jupyter", "Statistics"],
    "Data Analyst": ["SQL", "Python", "Excel", "Tableau", "Power BI", "Statistics", "Data Visualization", "ETL"],
    "Data Engineer": ["Python", "SQL", "Apache Spark", "Airflow", "Kafka", "AWS", "ETL", "Data Warehousing"],
    "DevOps Engineer": ["Docker", "Kubernetes", "Jenkins", "AWS", "Terraform", "Linux", "CI/CD", "Monitoring"],
    "Cloud Engineer": ["AWS", "Azure", "GCP", "Terraform", "Docker", "Kubernetes", "Networking", "Security"],
    "AI Engineer": ["Python", "TensorFlow", "PyTorch", "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "MLOps"],
    "Machine Learning Engineer": ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "MLOps", "Docker", "Kubernetes", "AWS"],
    "Cybersecurity Analyst": ["Network Security", "Penetration Testing", "SIEM", "Firewalls", "Encryption", "Linux", "Python", "Security Auditing"],
    "QA Engineer": ["Selenium", "Jest", "Cypress", "Test Automation", "API Testing", "Performance Testing", "Bug Tracking", "CI/CD"],
    "Database Administrator": ["SQL", "PostgreSQL", "MySQL", "MongoDB", "Database Design", "Backup & Recovery", "Performance Tuning", "Security"],
    "UI Developer": ["HTML", "CSS", "JavaScript", "React", "Vue.js", "Sass", "Responsive Design", "Accessibility"],
    "UX Designer": ["Figma", "Adobe XD", "User Research", "Wireframing", "Prototyping", "Usability Testing", "Design Systems", "HTML/CSS"],
    "Game Developer": ["Unity", "Unreal Engine", "C#", "C++", "3D Graphics", "Game Physics", "AI", "Multiplayer"],
    "Blockchain Developer": ["Solidity", "Ethereum", "Web3.js", "Smart Contracts", "Cryptography", "Node.js", "React", "Truffle"],
    "IoT Engineer": ["C", "C++", "Python", "MQTT", "Embedded Systems", "Sensors", "Arduino", "Raspberry Pi"],
    "Systems Architect": ["System Design", "Microservices", "Cloud Architecture", "Scalability", "Security", "Docker", "Kubernetes", "AWS"],
    "IT Project Manager": ["Agile", "Scrum", "JIRA", "Project Planning", "Risk Management", "Stakeholder Management", "Budget Management", "Team Leadership"],
};

export default function CreateInterviewPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<string[]>([]);
    const [selectedTechStacks, setSelectedTechStacks] = useState<string[]>([]);
    const [suggestedTechStacks, setSuggestedTechStacks] = useState<string[]>([]);
    const [form, setForm] = useState({
        role: "",
        level: "mid-level",
        type: "technical",
        techstack: "",
        amount: "5",
        candidateEmail: "",
    });

    // Update suggested tech stacks when role changes
    useEffect(() => {
        if (form.role && ROLE_TECH_STACKS[form.role]) {
            setSuggestedTechStacks(ROLE_TECH_STACKS[form.role]);
            setSelectedTechStacks([]);
            setForm(prev => ({ ...prev, techstack: "" }));
        }
    }, [form.role]);

    // Update form.techstack when selectedTechStacks changes
    useEffect(() => {
        setForm(prev => ({ ...prev, techstack: selectedTechStacks.join(", ") }));
    }, [selectedTechStacks]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const toggleTechStack = (tech: string) => {
        const maxAllowed = parseInt(form.amount);
        
        if (selectedTechStacks.includes(tech)) {
            // Remove tech stack
            setSelectedTechStacks(selectedTechStacks.filter(t => t !== tech));
        } else {
            // Add tech stack (if not exceeding limit)
            if (selectedTechStacks.length < maxAllowed) {
                setSelectedTechStacks([...selectedTechStacks, tech]);
            } else {
                toast.error(`Maximum ${maxAllowed} tech stacks allowed (same as number of questions)`);
            }
        }
    };

    const addCustomTech = () => {
        const maxAllowed = parseInt(form.amount);
        
        if (selectedTechStacks.length >= maxAllowed) {
            toast.error(`Maximum ${maxAllowed} tech stacks allowed`);
            return;
        }

        const customTech = prompt("Enter custom tech stack:");
        if (customTech && customTech.trim()) {
            const trimmedTech = customTech.trim();
            if (!selectedTechStacks.includes(trimmedTech)) {
                setSelectedTechStacks([...selectedTechStacks, trimmedTech]);
                toast.success(`Added: ${trimmedTech}`);
            } else {
                toast.error("Tech stack already selected");
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
            // Use custom HireFlow-Qwen-Fast model
            const res = await fetch("/api/recruiter/generate-questions-hf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();
            if (data.success) {
                setQuestions(data.questions);
                toast.success(`Questions generated using ${data.model}!`);
                console.log("✅ Source:", data.source);
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
                        <select
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg bg-background"
                            required
                        >
                            <option value="">Select a role...</option>
                            
                            <optgroup label="⭐ Popular Roles">
                                <option value="Software Developer">Software Developer</option>
                                <option value="Web Developer">Web Developer</option>
                                <option value="Data Analyst">Data Analyst</option>
                                <option value="Cybersecurity Analyst">Cybersecurity Analyst</option>
                                <option value="AI Engineer">AI Engineer</option>
                                <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                                <option value="Systems Architect">Systems Architect</option>
                                <option value="Database Administrator">Database Administrator</option>
                                <option value="IT Project Manager">IT Project Manager</option>
                                <option value="UX Designer">UX Designer</option>
                            </optgroup>
                            
                            <optgroup label="Software Development">
                                <option value="Frontend Developer">Frontend Developer</option>
                                <option value="Backend Developer">Backend Developer</option>
                                <option value="Full Stack Developer">Full Stack Developer</option>
                                <option value="Mobile Developer">Mobile Developer</option>
                                <option value="Game Developer">Game Developer</option>
                                <option value="Embedded Systems Engineer">Embedded Systems Engineer</option>
                                <option value="Desktop Application Developer">Desktop Application Developer</option>
                                <option value="Software Architect">Software Architect</option>
                            </optgroup>
                            
                            <optgroup label="Data & AI/ML">
                                <option value="Data Scientist">Data Scientist</option>
                                <option value="Data Engineer">Data Engineer</option>
                                <option value="MLOps Engineer">MLOps Engineer</option>
                                <option value="Business Intelligence Developer">Business Intelligence Developer</option>
                                <option value="Big Data Engineer">Big Data Engineer</option>
                            </optgroup>
                            
                            <optgroup label="Infrastructure & Operations">
                                <option value="DevOps Engineer">DevOps Engineer</option>
                                <option value="Site Reliability Engineer">Site Reliability Engineer</option>
                                <option value="Cloud Architect">Cloud Architect</option>
                                <option value="Cloud Engineer">Cloud Engineer</option>
                                <option value="Platform Engineer">Platform Engineer</option>
                                <option value="Infrastructure Engineer">Infrastructure Engineer</option>
                                <option value="Network Engineer">Network Engineer</option>
                                <option value="Systems Administrator">Systems Administrator</option>
                            </optgroup>
                            
                            <optgroup label="Security">
                                <option value="Security Engineer">Security Engineer</option>
                                <option value="Penetration Tester">Penetration Tester</option>
                                <option value="Security Architect">Security Architect</option>
                                <option value="Application Security Engineer">Application Security Engineer</option>
                            </optgroup>
                            
                            <optgroup label="Quality & Testing">
                                <option value="QA Engineer">QA Engineer</option>
                                <option value="Test Automation Engineer">Test Automation Engineer</option>
                                <option value="Performance Engineer">Performance Engineer</option>
                                <option value="QA Analyst">QA Analyst</option>
                            </optgroup>
                            
                            <optgroup label="Specialized Roles">
                                <option value="Blockchain Developer">Blockchain Developer</option>
                                <option value="IoT Engineer">IoT Engineer</option>
                                <option value="AR/VR Developer">AR/VR Developer</option>
                                <option value="Computer Vision Engineer">Computer Vision Engineer</option>
                                <option value="NLP Engineer">NLP Engineer</option>
                                <option value="Robotics Engineer">Robotics Engineer</option>
                            </optgroup>
                            
                            <optgroup label="Management & Leadership">
                                <option value="Engineering Manager">Engineering Manager</option>
                                <option value="Technical Lead">Technical Lead</option>
                                <option value="Product Engineer">Product Engineer</option>
                                <option value="Solutions Architect">Solutions Architect</option>
                                <option value="Technical Program Manager">Technical Program Manager</option>
                            </optgroup>
                            
                            <optgroup label="Database & Backend">
                                <option value="Database Engineer">Database Engineer</option>
                                <option value="API Developer">API Developer</option>
                                <option value="Backend Architect">Backend Architect</option>
                                <option value="Microservices Engineer">Microservices Engineer</option>
                            </optgroup>
                            
                            <optgroup label="UI/UX">
                                <option value="UI Developer">UI Developer</option>
                                <option value="UX Engineer">UX Engineer</option>
                                <option value="Design Systems Engineer">Design Systems Engineer</option>
                            </optgroup>
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
                            <option value="mixed">Mixed (Technical + Behavioral)</option>
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
                            <option value="8">8 Questions</option>
                            <option value="10">10 Questions</option>
                            <option value="15">15 Questions</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">
                        Tech Stack * 
                        <span className="text-sm text-gray-400 ml-2">
                            (Select up to {form.amount} - one per question)
                        </span>
                    </label>
                    
                    {suggestedTechStacks.length > 0 ? (
                        <div className="space-y-3">
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
                                
                                <button
                                    type="button"
                                    onClick={addCustomTech}
                                    className="px-4 py-2 rounded-lg border-2 border-dashed border-gray-400 hover:border-primary bg-background transition-all"
                                    disabled={selectedTechStacks.length >= parseInt(form.amount)}
                                >
                                    ➕ Add Other
                                </button>
                            </div>
                            
                            {/* Show selected custom tech stacks */}
                            {selectedTechStacks.filter(tech => !suggestedTechStacks.includes(tech)).length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2 border-t">
                                    <span className="text-sm text-gray-400">Custom:</span>
                                    {selectedTechStacks
                                        .filter(tech => !suggestedTechStacks.includes(tech))
                                        .map((tech) => (
                                            <button
                                                key={tech}
                                                type="button"
                                                onClick={() => toggleTechStack(tech)}
                                                className="px-4 py-2 rounded-lg border-2 bg-primary text-white border-primary"
                                            >
                                                {tech} ✓
                                            </button>
                                        ))}
                                </div>
                            )}
                            
                            <div className="text-sm text-gray-400">
                                Selected: {selectedTechStacks.length} / {form.amount}
                            </div>
                            
                            <input
                                type="text"
                                name="techstack"
                                value={form.techstack}
                                onChange={handleChange}
                                placeholder="Or type custom tech stack (comma-separated)"
                                className="w-full p-3 border rounded-lg bg-background"
                            />
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
                        <div className="space-y-2">
                            {questions.map((q, i) => (
                                <div key={i} className="p-3 border rounded-lg bg-background space-y-2">
                                    <div className="flex justify-between items-start">
                                        <span className="font-semibold">{i + 1}.</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    const newQ = prompt("Edit question:", q);
                                                    if (newQ) {
                                                        const updated = [...questions];
                                                        updated[i] = newQ;
                                                        setQuestions(updated);
                                                    }
                                                }}
                                                className="text-blue-500 hover:text-blue-700 text-sm"
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm("Delete this question?")) {
                                                        setQuestions(questions.filter((_, idx) => idx !== i));
                                                    }
                                                }}
                                                className="text-red-500 hover:text-red-700 text-sm"
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </div>
                                    <p className="ml-6">{q}</p>
                                </div>
                            ))}
                        </div>

                        <Button
                            onClick={() => {
                                const newQ = prompt("Enter new question:");
                                if (newQ) setQuestions([...questions, newQ]);
                            }}
                            variant="outline"
                            className="w-full"
                        >
                            ➕ Add Custom Question
                        </Button>

                        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                            <h4 className="font-semibold mb-2">📋 Interview Preview</h4>
                            <div className="space-y-1 text-sm">
                                <p><strong>Role:</strong> {form.role}</p>
                                <p><strong>Level:</strong> {form.level}</p>
                                <p><strong>Type:</strong> {form.type}</p>
                                <p><strong>Tech Stack:</strong> {form.techstack}</p>
                                <p><strong>Questions:</strong> {questions.length}</p>
                                <p><strong>Candidate:</strong> {form.candidateEmail}</p>
                                <p><strong>Estimated Time:</strong> {questions.length * 5} minutes</p>
                            </div>
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

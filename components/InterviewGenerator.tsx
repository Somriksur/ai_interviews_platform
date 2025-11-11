"use client";
import React, { useState } from "react";

export default function InterviewGenerator() {
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<string[]>([]);
    const [form, setForm] = useState({
        type: "technical",
        role: "",
        level: "",
        techstack: "",
        amount: "5",
        userid: "test123",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setQuestions([]);

        try {
            const res = await fetch("/api/vapi/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();
            if (data.success) {
                setQuestions(data.data.questions || []);
            } else {
                alert("Error: " + data.error);
            }
        } catch (err) {
            alert("Request failed: " + err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-6 border rounded-xl shadow-md bg-white text-black">
            <h2 className="text-2xl font-bold mb-4 text-center">HireFlow Question Generator</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
                <input
                    type="text"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    placeholder="Job Role (e.g., Frontend Developer)"
                    className="w-full p-2 border rounded"
                    required
                />
                <input
                    type="text"
                    name="level"
                    value={form.level}
                    onChange={handleChange}
                    placeholder="Experience Level (e.g., Junior)"
                    className="w-full p-2 border rounded"
                    required
                />
                <input
                    type="text"
                    name="techstack"
                    value={form.techstack}
                    onChange={handleChange}
                    placeholder="Tech Stack (e.g., React, TypeScript)"
                    className="w-full p-2 border rounded"
                    required
                />
                <select name="type" value={form.type} onChange={handleChange} className="w-full p-2 border rounded">
                    <option value="technical">Technical</option>
                    <option value="behavioral">Behavioral</option>
                    <option value="mixed">Mixed</option>
                </select>
                <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="Number of questions"
                    className="w-full p-2 border rounded"
                    min="1"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                    {loading ? "Generating..." : "Generate Questions"}
                </button>
            </form>

            {questions.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Generated Questions:</h3>
                    <ul className="space-y-2">
                        {questions.map((q, i) => (
                            <li key={i} className="border p-2 rounded bg-gray-50">
                                {i + 1}. {q}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

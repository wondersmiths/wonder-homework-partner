"use client";

import { useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

interface PracticeProblem {
  problem: string;
  solution: string;
  explanation: string;
}

const TOPIC_OPTIONS = [
  "Addition",
  "Subtraction",
  "Multiplication",
  "Division",
  "Fractions",
  "Decimals",
  "Percentages",
  "Algebra",
  "Geometry",
  "Word Problems",
];

export default function Practice() {
  const [studentName, setStudentName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("5");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [problems, setProblems] = useState<PracticeProblem[]>([]);
  const [showSolutions, setShowSolutions] = useState<Record<number, boolean>>(
    {}
  );
  const [error, setError] = useState("");

  function toggleTopic(topic: string) {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setProblems([]);
    setShowSolutions({});

    try {
      const res = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          gradeLevel,
          topics: selectedTopics,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate problems");

      const data = await res.json();
      setProblems(data.practice_problems || []);
    } catch {
      setError("Something went wrong. Please try again!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Practice Problems
      </h1>
      <p className="text-gray-600 mb-8">
        Pick the topics you want to practice and I&apos;ll create problems just
        for you!
      </p>

      <form onSubmit={handleGenerate} className="space-y-4 max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Alex"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade Level
            </label>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {[3, 4, 5, 6, 7, 8].map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Topics (pick at least one)
          </label>
          <div className="flex flex-wrap gap-2">
            {TOPIC_OPTIONS.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => toggleTopic(topic)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  selectedTopics.includes(topic)
                    ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                    : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || selectedTopics.length === 0}
          className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Generating..." : "Generate Problems"}
        </button>
      </form>

      {loading && <LoadingSpinner message="Creating practice problems..." />}

      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {problems.length > 0 && (
        <div className="mt-8 space-y-4 max-w-2xl">
          <h2 className="text-xl font-semibold text-gray-900">
            Your Practice Problems
          </h2>
          {problems.map((p, i) => (
            <div
              key={i}
              className="p-4 bg-white rounded-lg border border-gray-200"
            >
              <p className="font-medium text-gray-900 mb-2">
                {i + 1}. {p.problem}
              </p>
              {showSolutions[i] ? (
                <div className="mt-2 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">
                    Solution: {p.solution}
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {p.explanation}
                  </p>
                </div>
              ) : (
                <button
                  onClick={() =>
                    setShowSolutions((prev) => ({ ...prev, [i]: true }))
                  }
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Show Solution
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

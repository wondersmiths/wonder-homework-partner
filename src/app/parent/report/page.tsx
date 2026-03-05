"use client";

import { useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

interface ReportResponse {
  weekly_summary: string;
  highlights: string[];
  suggestions: string[];
}

export default function WeeklyReport() {
  const [studentName, setStudentName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("5");
  const [problemsCompleted, setProblemsCompleted] = useState("20");
  const [accuracy, setAccuracy] = useState("75");
  const [topics, setTopics] = useState("");
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [error, setError] = useState("");

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setReport(null);

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          gradeLevel,
          problemsCompleted: parseInt(problemsCompleted),
          accuracyAverage: parseInt(accuracy) / 100,
          topicsPracticed: topics
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          strengths: strengths
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          improvementAreas: improvements
            .split(",")
            .map((i) => i.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) throw new Error("Failed to generate report");

      const data = await res.json();
      setReport(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Weekly Report</h1>
      <p className="text-gray-600 mb-8">
        Generate a progress report for your child&apos;s learning this week.
      </p>

      <form onSubmit={handleGenerate} className="space-y-4 max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Child&apos;s Name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Problems Completed
            </label>
            <input
              type="number"
              value={problemsCompleted}
              onChange={(e) => setProblemsCompleted(e.target.value)}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Average Accuracy (%)
            </label>
            <input
              type="number"
              value={accuracy}
              onChange={(e) => setAccuracy(e.target.value)}
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Topics Practiced (comma-separated)
          </label>
          <input
            type="text"
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Fractions, Multiplication, Word Problems"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Strengths (comma-separated)
            </label>
            <input
              type="text"
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Addition, Quick learner"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Areas to Improve (comma-separated)
            </label>
            <input
              type="text"
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Fractions, Long division"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </form>

      {loading && <LoadingSpinner message="Creating progress report..." />}

      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {report && (
        <div className="mt-8 space-y-6 max-w-2xl">
          <div className="p-6 bg-white rounded-xl border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Weekly Progress Report
            </h2>
            <p className="text-gray-700 whitespace-pre-line">
              {report.weekly_summary}
            </p>
          </div>

          {report.highlights?.length > 0 && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Highlights</h3>
              <ul className="space-y-1">
                {report.highlights.map((h, i) => (
                  <li key={i} className="text-sm text-green-700">
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.suggestions?.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Suggestions</h3>
              <ul className="space-y-1">
                {report.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-blue-700">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

interface GradeResult {
  problem: string;
  student_answer: string;
  correct_answer: string;
  score: number;
  explanation: string;
  hint: string;
}

interface GradeResponse {
  grades: GradeResult[];
  overall_score: string;
  encouragement: string;
}

export default function GradeHomework() {
  const [studentName, setStudentName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("5");
  const [problems, setProblems] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GradeResponse | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName, gradeLevel, problems }),
      });

      if (!res.ok) throw new Error("Failed to grade homework");

      const data = await res.json();
      setResult(data);
    } catch {
      setError("Something went wrong. Please try again!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Grade My Homework
      </h1>
      <p className="text-gray-600 mb-8">
        Paste your homework problems and answers below, and I&apos;ll help you
        check your work!
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Homework (problems and answers)
          </label>
          <textarea
            value={problems}
            onChange={(e) => setProblems(e.target.value)}
            required
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder={`Example:\n1. 24 + 37 = 61\n2. 15 x 3 = 55\n3. 100 - 48 = 52`}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Checking..." : "Check My Work"}
        </button>
      </form>

      {loading && <LoadingSpinner message="Checking your homework..." />}

      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6 max-w-2xl">
          <div className="p-4 bg-indigo-50 rounded-lg">
            <p className="font-semibold text-indigo-900">
              Score: {result.overall_score}
            </p>
            <p className="text-indigo-700 mt-1">{result.encouragement}</p>
          </div>

          {result.grades?.map((grade, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg border ${
                grade.score === 1
                  ? "bg-green-50 border-green-200"
                  : "bg-amber-50 border-amber-200"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <p className="font-medium text-gray-900">{grade.problem}</p>
                <span
                  className={`text-sm font-medium px-2 py-0.5 rounded ${
                    grade.score === 1
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {grade.score === 1 ? "Correct" : "Try Again"}
                </span>
              </div>
              {grade.student_answer && (
                <p className="text-sm text-gray-600">
                  Your answer: {grade.student_answer}
                </p>
              )}
              {grade.score === 0 && grade.correct_answer && (
                <p className="text-sm text-gray-600">
                  Correct answer: {grade.correct_answer}
                </p>
              )}
              <p className="text-sm text-gray-700 mt-2">{grade.explanation}</p>
              {grade.hint && (
                <p className="text-sm text-indigo-600 mt-1 italic">
                  Hint: {grade.hint}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

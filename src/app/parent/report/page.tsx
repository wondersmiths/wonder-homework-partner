"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";

interface Student {
  id: string;
  name: string;
  grade_level: number;
}

interface ReportResponse {
  weekly_summary: string;
  highlights: string[];
  suggestions: string[];
}

export default function WeeklyReport() {
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [error, setError] = useState("");
  const supabase = createClient();

  const loadChildren = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("students")
      .select("id, name, grade_level")
      .eq("parent_id", user.id)
      .order("created_at");

    setChildren(data || []);
    if (data?.length) setSelectedChild(data[0].id);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setError("");
    setReport(null);

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedChild,
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
      setGenerating(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading..." />;

  if (children.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">
          You haven&apos;t added any children yet.
        </p>
        <Link
          href="/parent/children"
          className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors inline-block"
        >
          Add a Child
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Weekly Report</h1>
      <p className="text-gray-600 mb-8">
        Generate a progress report based on your child&apos;s actual homework
        and practice activity this week.
      </p>

      <form onSubmit={handleGenerate} className="space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Child
          </label>
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name} (Grade {child.grade_level})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Strengths you&apos;ve noticed (optional)
            </label>
            <input
              type="text"
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Stays focused, Quick learner"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Areas to work on (optional)
            </label>
            <input
              type="text"
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Fractions, Reading carefully"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={generating}
          className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {generating ? "Generating..." : "Generate Report"}
        </button>
      </form>

      {generating && <LoadingSpinner message="Creating progress report..." />}

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

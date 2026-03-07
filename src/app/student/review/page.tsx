"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Mistake {
  problem: string;
  student_answer: string;
  correct_answer: string;
  explanation: string;
  created_at: string;
}

interface PracticeProblem {
  problem: string;
  solution: string;
  explanation: string;
}

interface PracticeSet {
  original_problem: string;
  concept: string;
  problems: PracticeProblem[];
}

export default function WeeklyReview() {
  const [studentName, setStudentName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("5");
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [practiceSets, setPracticeSets] = useState<PracticeSet[] | null>(null);
  const [showSolutions, setShowSolutions] = useState<Record<string, boolean>>(
    {}
  );
  const [error, setError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function loadMistakes() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Get student profile
        const { data: student } = await supabase
          .from("students")
          .select("id, name, grade_level")
          .eq("user_id", user.id)
          .single();

        if (!student) {
          setLoading(false);
          return;
        }

        setStudentName(student.name);
        setGradeLevel(String(student.grade_level));

        // Get grading sessions from the past 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const { data: sessions } = await supabase
          .from("grading_sessions")
          .select("id, created_at")
          .eq("student_id", student.id)
          .gte("created_at", weekAgo.toISOString());

        if (!sessions || sessions.length === 0) {
          setLoading(false);
          return;
        }

        const sessionIds = sessions.map((s: { id: string }) => s.id);

        // Get wrong answers from those sessions
        const { data: wrongAnswers } = await supabase
          .from("grading_results")
          .select("problem, student_answer, correct_answer, explanation, created_at")
          .in("session_id", sessionIds)
          .eq("score", 0)
          .order("created_at", { ascending: false });

        setMistakes(wrongAnswers || []);
      } catch {
        setError("Failed to load your review data.");
      } finally {
        setLoading(false);
      }
    }

    loadMistakes();
  }, [supabase]);

  async function handleGeneratePractice() {
    if (mistakes.length === 0) return;

    setGenerating(true);
    setError("");

    try {
      // Send up to 5 unique mistakes to avoid too-long requests
      const uniqueMistakes = mistakes
        .filter(
          (m, i, arr) =>
            arr.findIndex((x) => x.problem === m.problem) === i
        )
        .slice(0, 5)
        .map((m) => ({
          problem: m.problem,
          student_answer: m.student_answer,
          correct_answer: m.correct_answer,
          explanation: m.explanation,
        }));

      const res = await fetch("/api/practice-mistakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          gradeLevel,
          mistakes: uniqueMistakes,
        }),
      });

      const text = (await res.text()).trim();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Failed to generate practice problems.");
      }
      if (data.error) throw new Error(data.error);

      setPracticeSets(data.practice_sets);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading your review..." />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Weekly Review</h1>
      <p className="text-gray-600 mb-8">
        Practice problems based on what you got wrong this week. Keep at it
        &mdash; every mistake is a chance to learn!
      </p>

      {mistakes.length === 0 ? (
        <div className="max-w-lg p-8 bg-green-50 rounded-2xl text-center">
          <p className="text-4xl mb-3">🎉</p>
          <h2 className="text-xl font-semibold text-green-900 mb-2">
            No mistakes this week!
          </h2>
          <p className="text-green-700">
            You either got everything right or haven&apos;t graded any homework
            yet this week. Keep up the great work!
          </p>
        </div>
      ) : (
        <>
          {/* Summary of mistakes */}
          <div className="max-w-2xl mb-6">
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="font-semibold text-amber-900">
                {mistakes.length} problem{mistakes.length !== 1 ? "s" : ""} to
                review this week
              </p>
              <p className="text-sm text-amber-700 mt-1">
                These are the problems you missed. Let&apos;s practice similar
                ones to master the concepts!
              </p>
            </div>
          </div>

          {/* List of mistakes */}
          <div className="max-w-2xl space-y-3 mb-6">
            {mistakes
              .filter(
                (m, i, arr) =>
                  arr.findIndex((x) => x.problem === m.problem) === i
              )
              .slice(0, 5)
              .map((m, i) => (
                <div
                  key={i}
                  className="p-3 bg-white rounded-lg border border-gray-200"
                >
                  <p className="font-medium text-gray-900 text-sm">
                    {m.problem}
                  </p>
                  <div className="flex gap-4 mt-1 text-xs">
                    <span className="text-red-600">
                      Your answer: {m.student_answer}
                    </span>
                    <span className="text-green-700">
                      Correct: {m.correct_answer}
                    </span>
                  </div>
                </div>
              ))}
          </div>

          {/* Generate practice button */}
          {!practiceSets && (
            <button
              onClick={handleGeneratePractice}
              disabled={generating}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {generating
                ? "Generating practice..."
                : "Generate Practice Problems"}
            </button>
          )}

          {generating && (
            <LoadingSpinner message="Creating practice problems from your mistakes..." />
          )}
        </>
      )}

      {/* Practice sets */}
      {practiceSets && (
        <div className="mt-8 space-y-8 max-w-2xl">
          <h2 className="text-2xl font-bold text-gray-900">
            Your Practice Set
          </h2>
          <p className="text-gray-600">
            Try these problems on paper first, then check your answers!
          </p>

          {practiceSets.map((set, setIdx) => (
            <div
              key={setIdx}
              className="p-5 bg-white rounded-xl border border-gray-200 space-y-4"
            >
              <div>
                <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                  {set.concept}
                </span>
                <p className="text-xs text-gray-500 mt-2">
                  Based on: {set.original_problem}
                </p>
              </div>

              <div className="space-y-3">
                {set.problems.map((p, pIdx) => {
                  const key = `${setIdx}-${pIdx}`;
                  return (
                    <div
                      key={pIdx}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <p className="font-medium text-gray-900 mb-2">
                        {pIdx + 1}. {p.problem}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setShowSolutions((prev) => ({
                            ...prev,
                            [key]: !prev[key],
                          }))
                        }
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        {showSolutions[key]
                          ? "Hide Solution"
                          : "Show Solution"}
                      </button>
                      {showSolutions[key] && (
                        <div className="mt-2 p-2 bg-indigo-50 rounded text-sm">
                          <p className="font-medium text-indigo-900">
                            Answer: {p.solution}
                          </p>
                          <p className="text-indigo-700 mt-1">
                            {p.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <button
            onClick={() => {
              setPracticeSets(null);
              setShowSolutions({});
            }}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Generate New Problems
          </button>
        </div>
      )}
    </div>
  );
}

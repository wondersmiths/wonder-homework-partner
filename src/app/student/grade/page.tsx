"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
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

type InputMode = "text" | "photo";

export default function GradeHomework() {
  const [studentName, setStudentName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("5");
  const [studentId, setStudentId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: student } = await supabase
        .from("students")
        .select("id, name, grade_level")
        .eq("user_id", user.id)
        .single();

      if (student) {
        setStudentId(student.id);
        setStudentName(student.name);
        setGradeLevel(String(student.grade_level));
      }
    }
    loadProfile();
  }, [supabase]);

  const [problems, setProblems] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageType, setImageType] = useState<string>("image/jpeg");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GradeResponse | null>(null);
  const [error, setError] = useState("");

  // Practice from mistakes state
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceSets, setPracticeSets] = useState<PracticeSet[] | null>(null);
  const [showSolutions, setShowSolutions] = useState<Record<string, boolean>>(
    {}
  );

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPEG, PNG, GIF, or WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB.");
      return;
    }

    setError("");
    setImageType(file.type);
    setImagePreview(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImagePreview(null);
    setImageBase64(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    setPracticeSets(null);

    try {
      const body: Record<string, string | null> = {
        studentName,
        gradeLevel,
        studentId,
      };

      if (inputMode === "photo" && imageBase64) {
        body.image = imageBase64;
        body.imageType = imageType;
      } else {
        body.problems = problems;
      }

      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = (await res.text()).trim();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          res.status === 504
            ? "Request timed out. Try submitting fewer problems."
            : `Server error: ${text.substring(0, 100)}`
        );
      }
      if (data.error)
        throw new Error(
          data.debug || data.error || "Failed to grade homework"
        );

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again!"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handlePracticeMistakes() {
    if (!result) return;

    const mistakes = result.grades
      .filter((g) => g.score === 0)
      .map((g) => ({
        problem: g.problem,
        student_answer: g.student_answer,
        correct_answer: g.correct_answer,
        explanation: g.explanation,
      }));

    if (mistakes.length === 0) return;

    setPracticeLoading(true);
    setError("");

    try {
      const res = await fetch("/api/practice-mistakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName, gradeLevel, mistakes }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Failed to load practice problems.");
      }
      if (!res.ok) throw new Error(data.error || "Failed to generate practice");

      setPracticeSets(data.practice_sets);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again!"
      );
    } finally {
      setPracticeLoading(false);
    }
  }

  const hasWrongAnswers =
    result && result.grades.some((g) => g.score === 0);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Grade My Homework
      </h1>
      <p className="text-gray-600 mb-8">
        Type your homework or upload a photo, and I&apos;ll help you check your
        work!
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How would you like to submit?
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setInputMode("text")}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                inputMode === "text"
                  ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Type It
            </button>
            <button
              type="button"
              onClick={() => setInputMode("photo")}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                inputMode === "photo"
                  ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Take a Photo
            </button>
          </div>
        </div>

        {inputMode === "text" ? (
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
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload a photo of your homework
            </label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Homework preview"
                  className="w-full max-h-80 object-contain rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 px-2 py-1 bg-white/90 text-gray-600 text-xs rounded-md border border-gray-300 hover:bg-gray-100"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-indigo-300 rounded-lg cursor-pointer bg-indigo-50/50 hover:bg-indigo-100/50 transition-colors">
                  <div className="text-center">
                    <p className="text-3xl mb-1">📸</p>
                    <p className="text-sm font-medium text-indigo-700">
                      Open Camera
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    capture="environment"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <label className="flex items-center justify-center w-full py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <p className="text-sm text-gray-600">
                    Or choose from gallery
                  </p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={
            loading ||
            (inputMode === "text" && !problems) ||
            (inputMode === "photo" && !imageBase64)
          }
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
                <p className="text-sm font-medium text-gray-700">
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

          {/* Practice My Mistakes button */}
          {hasWrongAnswers && !practiceSets && (
            <button
              onClick={handlePracticeMistakes}
              disabled={practiceLoading}
              className="w-full py-3 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              {practiceLoading
                ? "Generating practice problems..."
                : "Practice My Mistakes"}
            </button>
          )}

          {practiceLoading && (
            <LoadingSpinner message="Creating practice problems from your mistakes..." />
          )}
        </div>
      )}

      {/* Practice from mistakes results */}
      {practiceSets && (
        <div className="mt-8 space-y-8 max-w-2xl">
          <h2 className="text-2xl font-bold text-gray-900">
            Practice Your Mistakes
          </h2>
          <p className="text-gray-600">
            Here are practice problems based on what you got wrong. Try them out!
          </p>

          {practiceSets.map((set, setIdx) => (
            <div
              key={setIdx}
              className="p-5 bg-white rounded-xl border border-gray-200 space-y-4"
            >
              <div>
                <p className="text-xs text-gray-500">Original problem:</p>
                <p className="text-sm text-gray-700 font-medium">
                  {set.original_problem}
                </p>
                <p className="text-xs text-indigo-600 mt-1">
                  Concept: {set.concept}
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
        </div>
      )}
    </div>
  );
}

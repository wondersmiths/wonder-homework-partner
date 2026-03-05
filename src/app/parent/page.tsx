"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import LoadingSpinner from "@/components/LoadingSpinner";

interface ChildStats {
  id: string;
  name: string;
  grade_level: number;
  user_id: string | null;
  total_sessions: number;
  total_problems: number;
  total_correct: number;
}

export default function ParentDashboard() {
  const [children, setChildren] = useState<ChildStats[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: students } = await supabase
      .from("students")
      .select("id, name, grade_level, user_id")
      .eq("parent_id", user.id);

    if (!students?.length) {
      setChildren([]);
      setLoading(false);
      return;
    }

    const stats: ChildStats[] = [];
    for (const student of students) {
      const { data: sessions } = await supabase
        .from("grading_sessions")
        .select("total_problems, correct_count")
        .eq("student_id", student.id);

      const totalSessions = sessions?.length || 0;
      type SessionRow = { total_problems: number; correct_count: number };
      const rows: SessionRow[] = sessions || [];
      const totalProblems = rows.reduce(
        (sum, s) => sum + (s.total_problems || 0),
        0
      );
      const totalCorrect = rows.reduce(
        (sum, s) => sum + (s.correct_count || 0),
        0
      );

      stats.push({
        ...student,
        total_sessions: totalSessions,
        total_problems: totalProblems,
        total_correct: totalCorrect,
      });
    }

    setChildren(stats);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Parent Dashboard
      </h1>
      <p className="text-gray-600 mb-8">
        Track your children&apos;s learning progress and see their growth.
      </p>

      {/* Children overview */}
      {children.length > 0 ? (
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">Your Children</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children.map((child) => (
              <div
                key={child.id}
                className="p-5 bg-white rounded-xl border border-gray-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{child.name}</h3>
                    <p className="text-sm text-gray-500">
                      Grade {child.grade_level}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      child.user_id
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {child.user_id ? "Active" : "Not linked"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">
                      {child.total_sessions}
                    </p>
                    <p className="text-xs text-gray-500">Sessions</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">
                      {child.total_problems}
                    </p>
                    <p className="text-xs text-gray-500">Problems</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">
                      {child.total_problems > 0
                        ? Math.round(
                            (child.total_correct / child.total_problems) * 100
                          )
                        : 0}
                      %
                    </p>
                    <p className="text-xs text-gray-500">Accuracy</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-6 bg-white rounded-xl border border-gray-200 mb-8 text-center">
          <p className="text-gray-600 mb-3">
            Start by adding your children to track their progress.
          </p>
          <Link
            href="/parent/children"
            className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors inline-block"
          >
            Add a Child
          </Link>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/parent/children"
          className="p-6 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
        >
          <div className="text-3xl mb-3">👨‍👩‍👧‍👦</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Manage Children
          </h2>
          <p className="text-sm text-gray-500">
            Add children and get join codes
          </p>
        </Link>

        <Link
          href="/parent/report"
          className="p-6 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
        >
          <div className="text-3xl mb-3">📊</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Weekly Report
          </h2>
          <p className="text-sm text-gray-500">
            AI-generated progress report from real data
          </p>
        </Link>

        <Link
          href="/parent/donate"
          className="p-6 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
        >
          <div className="text-3xl mb-3">💜</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Support Us
          </h2>
          <p className="text-sm text-gray-500">
            Help keep this program free for all students
          </p>
        </Link>
      </div>
    </div>
  );
}

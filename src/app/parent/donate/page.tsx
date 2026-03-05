"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Donate() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMessage() {
      setError("");
      try {
        // Fetch real problem count from parent's children
        let problemsCompleted = 0;
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: students } = await supabase
            .from("students")
            .select("id")
            .eq("parent_id", user.id);

          if (students && students.length > 0) {
            const studentIds = students.map((s: { id: string }) => s.id);

            const { count: gradingCount } = await supabase
              .from("grading_results")
              .select("id", { count: "exact", head: true })
              .in("session_id",
                (await supabase
                  .from("grading_sessions")
                  .select("id")
                  .in("student_id", studentIds)
                ).data?.map((s: { id: string }) => s.id) || []
              );

            const { data: practiceSessions } = await supabase
              .from("practice_sessions")
              .select("problem_count")
              .in("student_id", studentIds);

            const practiceCount = practiceSessions?.reduce(
              (sum: number, s: { problem_count: number }) => sum + (s.problem_count || 0), 0
            ) || 0;

            problemsCompleted = (gradingCount || 0) + practiceCount;
          }
        }

        const res = await fetch("/api/donation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "donation",
            problemsCompleted,
            donorStatus: "non-donor",
          }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setMessage(data.donation_message);
      } catch {
        setError("Failed to load. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadMessage();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Support Wonder Mentorship
      </h1>
      <p className="text-gray-600 mb-8">
        Wonder Mentorship is a nonprofit. Your support keeps this program free
        for every student.
      </p>

      {loading && !message && (
        <LoadingSpinner message="Loading..." />
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-6">
          {error}
        </div>
      )}

      {message && (
        <div className="max-w-lg space-y-6">
          <div className="p-6 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-700">{message}</p>
          </div>

          {/* PayPal QR Code */}
          <div className="p-6 bg-white rounded-xl border border-gray-200 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Scan to Donate via PayPal
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Open your phone camera or PayPal app and scan the code below.
            </p>
            <div className="inline-block p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <Image
                src="/paypal-qr.png"
                alt="PayPal donation QR code"
                width={220}
                height={220}
                className="rounded-lg"
              />
            </div>
            <p className="text-xs text-gray-400 mt-3">
              You can donate any amount you choose.
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              It costs about $0.50 per student per month to run this platform.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

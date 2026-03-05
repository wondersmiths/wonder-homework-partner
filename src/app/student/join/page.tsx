"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function JoinFamily() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alreadyLinked, setAlreadyLinked] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkLink() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setAlreadyLinked(true);
      }
    }
    checkLink();
  }, [supabase]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    const trimmedCode = code.trim().toUpperCase();

    // Find the student record with this join code
    const { data: student, error: findError } = await supabase
      .from("students")
      .select("id, name, user_id")
      .eq("join_code", trimmedCode)
      .single();

    if (findError || !student) {
      setError("Invalid code. Please check with your parent and try again.");
      setLoading(false);
      return;
    }

    if (student.user_id) {
      setError("This code has already been used by another account.");
      setLoading(false);
      return;
    }

    // Link the student record to this user
    const { error: updateError } = await supabase
      .from("students")
      .update({ user_id: user.id })
      .eq("id", student.id);

    if (updateError) {
      setError("Failed to link account. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/student");
  }

  if (alreadyLinked) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          You&apos;re all set!
        </h1>
        <p className="text-gray-600 mb-6">
          Your account is already linked to a parent.
        </p>
        <a
          href="/student"
          className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors inline-block"
        >
          Go to Homework
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Your Family</h1>
      <p className="text-gray-600 mb-8">
        Enter the 6-letter code your parent gave you to connect your account.
      </p>

      <form onSubmit={handleJoin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Join Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            maxLength={6}
            placeholder="e.g., ABC123"
            className="w-full px-4 py-3 text-center text-2xl tracking-widest font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || code.length < 6}
          className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Linking..." : "Join"}
        </button>
      </form>
    </div>
  );
}

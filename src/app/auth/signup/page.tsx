"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"parent" | "student">("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Profile is auto-created by database trigger using the metadata above.
      // If the session is active (email confirmation disabled), redirect now.
      // If email confirmation is enabled, show a message.
      if (data.session) {
        router.push(role === "parent" ? "/parent" : "/student/join");
      } else {
        setError("");
        setLoading(false);
        // Show confirmation message
        router.push(
          `/auth/login?message=${encodeURIComponent("Check your email to confirm your account, then log in.")}`
        );
        return;
      }
    }

    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign Up</h1>
      <p className="text-gray-600 mb-8">
        Create your Wonder Mentorship account.
      </p>

      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            I am a...
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-colors ${
                role === "student"
                  ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole("parent")}
              className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-colors ${
                role === "parent"
                  ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Parent
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <div className="text-sm text-gray-600 text-center space-y-1">
          <p>
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-indigo-600 hover:underline"
            >
              Log in
            </Link>
          </p>
          {role === "student" && (
            <p>
              No email?{" "}
              <Link
                href="/auth/student-login"
                className="text-indigo-600 hover:underline"
              >
                Log in with username + PIN
              </Link>
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

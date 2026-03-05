"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (!signInData.user) {
      setError("Login failed. Please try again.");
      setLoading(false);
      return;
    }

    // Get profile to determine role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", signInData.user.id)
      .single();

    const destination = profile?.role === "parent" ? "/parent" : "/student";

    // Use window.location for a full page navigation to ensure
    // middleware picks up the new auth cookies
    window.location.href = destination;
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Log In</h1>
      <p className="text-gray-600 mb-8">Welcome back to Wonder Mentorship.</p>

      {message && (
        <div className="p-3 bg-indigo-50 text-indigo-700 text-sm rounded-lg mb-4">
          {message}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
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
          {loading ? "Logging in..." : "Log In"}
        </button>

        <div className="text-sm text-gray-600 text-center space-y-1">
          <p>
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-indigo-600 hover:underline"
            >
              Sign up
            </Link>
          </p>
          <p>
            Student without email?{" "}
            <Link
              href="/auth/student-login"
              className="text-indigo-600 hover:underline"
            >
              Log in with username + PIN
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

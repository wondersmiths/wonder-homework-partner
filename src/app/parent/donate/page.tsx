"use client";

import { useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Donate() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [thankYou, setThankYou] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function loadMessage() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/donation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "donation",
          problemsCompleted: 47,
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

  async function handleDonate(amount: number) {
    setSelectedAmount(amount);
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/donation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "thank_you",
          amount,
          frequency: "one-time",
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setThankYou(data.thank_you_message);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Load donation message on first render
  if (!message && !loading && !error) {
    loadMessage();
  }

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

      {thankYou ? (
        <div className="max-w-lg p-8 bg-indigo-50 rounded-2xl text-center">
          <div className="text-4xl mb-4">💜</div>
          <h2 className="text-xl font-semibold text-indigo-900 mb-3">
            Thank You!
          </h2>
          <p className="text-indigo-700">{thankYou}</p>
        </div>
      ) : (
        message && (
          <div className="max-w-lg space-y-6">
            <div className="p-6 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-700">{message}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                Choose an amount:
              </p>
              <div className="flex gap-3">
                {[5, 10, 25].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleDonate(amount)}
                    disabled={loading}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                      selectedAmount === amount
                        ? "bg-indigo-600 text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                    } disabled:opacity-50`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                It costs about $0.50 per student per month to run this platform.
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
}

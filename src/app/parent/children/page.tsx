"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Student {
  id: string;
  name: string;
  grade_level: number;
  join_code: string;
  user_id: string | null;
}

export default function ManageChildren() {
  const [children, setChildren] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGrade, setNewGrade] = useState("5");
  const [error, setError] = useState("");
  const supabase = createClient();

  const loadChildren = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("students")
      .select("*")
      .eq("parent_id", user.id)
      .order("created_at");

    setChildren(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  function generateCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  async function handleAddChild(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in.");
      setAdding(false);
      return;
    }

    const joinCode = generateCode();

    const { error: insertError } = await supabase.from("students").insert({
      parent_id: user.id,
      name: newName,
      grade_level: parseInt(newGrade),
      join_code: joinCode,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        // Unique constraint on join_code, retry
        const retryCode = generateCode();
        const { error: retryError } = await supabase.from("students").insert({
          parent_id: user.id,
          name: newName,
          grade_level: parseInt(newGrade),
          join_code: retryCode,
        });
        if (retryError) {
          setError("Failed to add child. Please try again.");
          setAdding(false);
          return;
        }
      } else {
        setError("Failed to add child. Please try again.");
        setAdding(false);
        return;
      }
    }

    setNewName("");
    setNewGrade("5");
    await loadChildren();
    setAdding(false);
  }

  async function handleRemoveChild(id: string) {
    if (!confirm("Are you sure? This will remove all their homework history.")) {
      return;
    }

    await supabase.from("students").delete().eq("id", id);
    await loadChildren();
  }

  if (loading) return <LoadingSpinner message="Loading..." />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Manage Children
      </h1>
      <p className="text-gray-600 mb-8">
        Add your children and share their join code so they can link their
        account.
      </p>

      {/* Existing children */}
      {children.length > 0 && (
        <div className="space-y-4 mb-8">
          {children.map((child) => (
            <div
              key={child.id}
              className="p-4 bg-white rounded-xl border border-gray-200 flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold text-gray-900">{child.name}</h3>
                <p className="text-sm text-gray-500">
                  Grade {child.grade_level}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  {child.user_id ? (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      Linked
                    </span>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-500">Join Code</p>
                      <p className="text-lg font-mono font-bold text-indigo-600 tracking-wider">
                        {child.join_code}
                      </p>
                      <p className="text-xs text-gray-400">
                        Share this with your child
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveChild(child.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add child form */}
      <div className="p-6 bg-white rounded-xl border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Add a Child
        </h2>
        <form onSubmit={handleAddChild} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Child&apos;s Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
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
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
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

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={adding}
            className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {adding ? "Adding..." : "Add Child"}
          </button>
        </form>
      </div>
    </div>
  );
}

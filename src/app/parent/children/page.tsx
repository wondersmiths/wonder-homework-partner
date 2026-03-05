"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ensureProfile } from "@/lib/ensure-profile";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Student {
  id: string;
  name: string;
  grade_level: number;
  join_code: string;
  user_id: string | null;
  username: string | null;
}

export default function ManageChildren() {
  const [children, setChildren] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGrade, setNewGrade] = useState("5");
  const [newUsername, setNewUsername] = useState("");
  const [newPin, setNewPin] = useState("");
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

    const profile = await ensureProfile(supabase);
    if (!profile) {
      setError("You must be logged in. Please log out and log back in.");
      setAdding(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in.");
      setAdding(false);
      return;
    }

    const joinCode = generateCode();
    const trimmedUsername = newUsername.trim().toLowerCase() || null;

    if (trimmedUsername && !/^[a-z0-9_]{3,20}$/.test(trimmedUsername)) {
      setError("Username must be 3-20 characters: letters, numbers, or underscores.");
      setAdding(false);
      return;
    }

    if (trimmedUsername && (newPin.length < 4 || newPin.length > 6)) {
      setError("PIN must be 4-6 digits.");
      setAdding(false);
      return;
    }

    const insertData: Record<string, string | number | null> = {
      parent_id: user.id,
      name: newName,
      grade_level: parseInt(newGrade),
      join_code: joinCode,
    };

    if (trimmedUsername) {
      insertData.username = trimmedUsername;
      insertData.pin = newPin;
    }

    const { error: insertError } = await supabase
      .from("students")
      .insert(insertData);

    if (insertError) {
      console.error("Add child error:", insertError);

      if (insertError.code === "23505" && insertError.message?.includes("username")) {
        setError("That username is already taken. Try a different one.");
        setAdding(false);
        return;
      }
      if (insertError.code === "23505") {
        // Unique constraint on join_code, retry
        insertData.join_code = generateCode();
        const { error: retryError } = await supabase
          .from("students")
          .insert(insertData);
        if (retryError) {
          console.error("Add child retry error:", retryError);
          setError(`Failed to add child: ${retryError.message}`);
          setAdding(false);
          return;
        }
      } else if (insertError.code === "42501") {
        setError("Permission denied. Please log out and log back in.");
        setAdding(false);
        return;
      } else if (insertError.code === "42703") {
        setError("Database needs updating. Please run the latest migration (migration_add_student_login.sql).");
        setAdding(false);
        return;
      } else {
        setError(`Failed to add child: ${insertError.message}`);
        setAdding(false);
        return;
      }
    }

    setNewName("");
    setNewGrade("5");
    setNewUsername("");
    setNewPin("");
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
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        Linked
                      </span>
                      {child.username && (
                        <p className="text-xs text-gray-500">
                          Username: <span className="font-mono">{child.username}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      {child.username ? (
                        <>
                          <p className="text-xs text-gray-500">Student Login</p>
                          <p className="text-sm font-mono font-bold text-indigo-600">
                            {child.username}
                          </p>
                          <p className="text-xs text-gray-400">
                            Username + PIN set
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-gray-500">Join Code</p>
                          <p className="text-lg font-mono font-bold text-indigo-600 tracking-wider">
                            {child.join_code}
                          </p>
                          <p className="text-xs text-gray-400">
                            Share this with your child
                          </p>
                        </>
                      )}
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

          <div className="border-t border-gray-200 pt-4 mt-2">
            <p className="text-sm font-medium text-gray-700 mb-1">
              Student Login (no email needed)
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Set a username and PIN so your child can log in without an email
              address. Leave blank if they&apos;ll use email sign-up + join code
              instead.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) =>
                    setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                  }
                  maxLength={20}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                  placeholder="e.g., alex123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PIN
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={newPin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (val.length <= 6) setNewPin(val);
                  }}
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono tracking-widest"
                  placeholder="e.g., 1234"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={adding || (!!newUsername && newPin.length < 4)}
            className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {adding ? "Adding..." : "Add Child"}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const studentLinks = [
  { href: "/student", label: "Home" },
  { href: "/student/grade", label: "Grade Homework" },
  { href: "/student/practice", label: "Practice" },
];

const parentLinks = [
  { href: "/parent", label: "Dashboard" },
  { href: "/parent/children", label: "My Children" },
  { href: "/parent/report", label: "Weekly Report" },
  { href: "/parent/donate", label: "Support Us" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        setUser(authUser);

        if (authUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", authUser.id)
            .single();
          setRole(profile?.role || null);
        }
      } catch {
        // Supabase not configured, skip auth
      }
    }
    loadUser();
  }, [pathname]);

  const isAuthPage = pathname.startsWith("/auth");
  const isHome = pathname === "/";
  const isParent = pathname.startsWith("/parent");
  const links = isParent ? parentLinks : studentLinks;

  async function handleLogout() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Supabase not configured
    }
    router.push("/");
  }

  if (isAuthPage || isHome) {
    return (
      <nav className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">
            Wonder Mentorship
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={handleLogout}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Log Out
              </button>
            ) : (
              <>
                <Link
                  href="/auth/student-login"
                  className="text-sm text-gray-600 hover:text-indigo-500"
                >
                  Student Login
                </Link>
                <Link
                  href="/auth/login"
                  className="text-sm text-gray-600 hover:text-indigo-500"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-sm px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-indigo-600">
            Wonder Mentorship
          </Link>
          <div className="flex gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "text-indigo-600"
                    : "text-gray-600 hover:text-indigo-500"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {role === "parent" && !isParent && (
            <Link
              href="/parent"
              className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Parent View
            </Link>
          )}
          {role === "student" && isParent && (
            <Link
              href="/student"
              className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Student View
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
}

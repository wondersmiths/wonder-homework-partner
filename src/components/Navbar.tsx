"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const studentLinks = [
  { href: "/student", label: "Home" },
  { href: "/student/grade", label: "Grade Homework" },
  { href: "/student/practice", label: "Practice" },
];

const parentLinks = [
  { href: "/parent", label: "Dashboard" },
  { href: "/parent/report", label: "Weekly Report" },
  { href: "/parent/donate", label: "Support Us" },
];

export default function Navbar() {
  const pathname = usePathname();
  const isParent = pathname.startsWith("/parent");
  const links = isParent ? parentLinks : studentLinks;
  const portalSwitch = isParent ? "/student" : "/parent";
  const portalLabel = isParent ? "Student View" : "Parent View";

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
        <Link
          href={portalSwitch}
          className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Switch to {portalLabel}
        </Link>
      </div>
    </nav>
  );
}

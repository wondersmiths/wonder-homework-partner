import Link from "next/link";

export default function ParentDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Parent Dashboard
      </h1>
      <p className="text-gray-600 mb-8">
        Track your child&apos;s learning progress and see their growth.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/parent/report"
          className="p-6 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
        >
          <div className="text-3xl mb-3">📊</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Weekly Report
          </h2>
          <p className="text-sm text-gray-500">
            Generate a detailed progress report for your child
          </p>
        </Link>

        <Link
          href="/parent/donate"
          className="p-6 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
        >
          <div className="text-3xl mb-3">💜</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Support Wonder Mentorship
          </h2>
          <p className="text-sm text-gray-500">
            Help us keep this program free for all students
          </p>
        </Link>
      </div>
    </div>
  );
}

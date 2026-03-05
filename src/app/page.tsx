import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Wonder Mentorship
        </h1>
        <p className="text-lg text-gray-600">
          Your AI-powered homework partner for grades 3-8
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <Link
          href="/student"
          className="group p-8 bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all text-center"
        >
          <div className="text-4xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            I&apos;m a Student
          </h2>
          <p className="text-sm text-gray-500">
            Get help with homework, practice problems, and learn new concepts
          </p>
        </Link>

        <Link
          href="/parent"
          className="group p-8 bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all text-center"
        >
          <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            I&apos;m a Parent
          </h2>
          <p className="text-sm text-gray-500">
            View progress reports and see how your child is doing
          </p>
        </Link>
      </div>
    </div>
  );
}

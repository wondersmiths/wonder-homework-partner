import Link from "next/link";

export default function StudentHome() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Hey there, learner!
      </h1>
      <p className="text-gray-600 mb-8">
        What would you like to work on today?
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/student/grade"
          className="p-6 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
        >
          <div className="text-3xl mb-3">📝</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Grade My Homework
          </h2>
          <p className="text-sm text-gray-500">
            Submit your homework and get instant feedback with helpful explanations
          </p>
        </Link>

        <Link
          href="/student/practice"
          className="p-6 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
        >
          <div className="text-3xl mb-3">🎯</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Practice Problems
          </h2>
          <p className="text-sm text-gray-500">
            Get extra practice on topics you want to master
          </p>
        </Link>
      </div>
    </div>
  );
}

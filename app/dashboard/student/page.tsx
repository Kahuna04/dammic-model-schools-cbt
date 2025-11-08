import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'STUDENT') {
    redirect('/login');
  }

  // Fetch available exams
  const exams = await prisma.exam.findMany({
    where: {
      status: 'PUBLISHED',
      AND: [
        {
          OR: [
            { startTime: null },
            { startTime: { lte: new Date() } },
          ],
        },
        {
          OR: [
            { endTime: null },
            { endTime: { gte: new Date() } },
          ],
        },
      ],
    },
    include: {
      _count: {
        select: { questions: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Fetch student's submissions
  const submissions = await prisma.submission.findMany({
    where: {
      studentId: session.user.id,
    },
    include: {
      exam: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="min-h-screen bg-[#F4F1E8]">
      {/* Header */}
      <header className="bg-[#4B5320] text-white p-4 shadow-md">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Student Dashboard</h1>
            <p className="text-xs sm:text-sm opacity-90">Welcome, {session.user.name}</p>
          </div>
          <Link
            href="/api/auth/signout"
            className="bg-white text-[#4B5320] px-4 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm"
          >
            Logout
          </Link>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-6xl">
        {/* Available Exams Section */}
        <section className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-[#4B5320] mb-4">Available Exams</h2>
          
          {exams.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
              No exams available at the moment
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
              {exams.map((exam) => {
                const hasSubmitted = submissions.find(
                  (sub) => sub.examId === exam.id && sub.status !== 'IN_PROGRESS'
                );

                return (
                  <div key={exam.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-semibold text-[#4B5320] mb-2">
                      {exam.title}
                    </h3>
                    {exam.description && (
                      <p className="text-gray-600 mb-4">{exam.description}</p>
                    )}
                    <div className="space-y-2 text-sm text-gray-700 mb-4">
                      <p>📝 Questions: {exam._count.questions}</p>
                      <p>⏱️ Duration: {exam.duration} minutes</p>
                      <p>📊 Total Marks: {exam.totalMarks}</p>
                      <p>✅ Passing Marks: {exam.passingMarks}</p>
                    </div>
                    {hasSubmitted ? (
                      <div className="bg-green-50 text-green-700 px-4 py-2 rounded-md text-sm">
                        ✓ Completed
                      </div>
                    ) : (
                      <Link
                        href={`/exam/${exam.id}`}
                        className="block text-center bg-[#4B5320] text-white px-4 py-2 rounded-md hover:bg-[#3d4419] transition-colors"
                      >
                        Start Exam
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Submissions Section */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#4B5320] mb-4">My Results</h2>
          
          {submissions.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
              No submissions yet
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-[#4B5320] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Exam</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Score</th>
                    <th className="px-4 py-3 text-left">Result</th>
                    <th className="px-4 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{submission.exam.title}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          submission.status === 'GRADED' ? 'bg-green-100 text-green-700' :
                          submission.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {submission.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {submission.totalScore !== null ? (
                          `${submission.totalScore}/${submission.exam.totalMarks}`
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {submission.passed !== null ? (
                          <span className={`font-semibold ${
                            submission.passed ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {submission.passed ? 'PASS' : 'FAIL'}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(submission.startedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  // Fetch statistics
  const [totalUsers, totalExams, totalSubmissions, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.exam.count(),
    prisma.submission.count({ where: { status: 'SUBMITTED' } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
  ]);

  const exams = await prisma.exam.findMany({
    include: {
      createdBy: {
        select: { name: true },
      },
      _count: {
        select: { questions: true, submissions: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-[#F4F1E8]">
      {/* Header */}
      <header className="bg-[#4B5320] text-white p-4 shadow-md">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
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

      <main className="container mx-auto p-6 max-w-7xl">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-[#4B5320]">{totalUsers}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Exams</p>
                <p className="text-3xl font-bold text-[#4B5320]">{totalExams}</p>
              </div>
              <div className="text-4xl">📝</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Submissions</p>
                <p className="text-3xl font-bold text-[#4B5320]">{totalSubmissions}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-[#4B5320] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/dashboard/admin/users"
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center"
            >
              <div className="text-4xl mb-2">👤</div>
              <h3 className="font-semibold text-[#4B5320]">Manage Users</h3>
              <p className="text-sm text-gray-600">Add, edit, or remove users</p>
            </Link>

            <Link
              href="/dashboard/admin/upload-questions"
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center"
            >
              <div className="text-4xl mb-2">📄</div>
              <h3 className="font-semibold text-[#4B5320]">Upload Questions</h3>
              <p className="text-sm text-gray-600">Import from Word document</p>
            </Link>

            <Link
              href="/dashboard/admin/exams/create"
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center"
            >
              <div className="text-4xl mb-2">➕</div>
              <h3 className="font-semibold text-[#4B5320]">Create Exam</h3>
              <p className="text-sm text-gray-600">Create a new exam</p>
            </Link>

            <Link
              href="/dashboard/admin/exams"
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center"
            >
              <div className="text-4xl mb-2">📋</div>
              <h3 className="font-semibold text-[#4B5320]">View All Exams</h3>
              <p className="text-sm text-gray-600">Manage and view exams</p>
            </Link>
          </div>
        </div>

        {/* Recent Users */}
        <section className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-[#4B5320] mb-4">Recent Users</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-[#4B5320] text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{user.name}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                        user.role === 'STAFF' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </section>

        {/* Exams Overview */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#4B5320] mb-4">All Exams</h2>
          {exams.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
              No exams created yet
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-[#4B5320] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Questions</th>
                    <th className="px-4 py-3 text-left">Submissions</th>
                    <th className="px-4 py-3 text-left">Created By</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => (
                    <tr key={exam.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{exam.title}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          exam.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                          exam.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {exam.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{exam._count.questions}</td>
                      <td className="px-4 py-3">{exam._count.submissions}</td>
                      <td className="px-4 py-3">{exam.createdBy.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          <Link
                            href={`/dashboard/admin/exams/${exam.id}/preview`}
                            className="text-purple-600 hover:underline text-sm"
                          >
                            Preview
                          </Link>
                          <Link
                            href={`/dashboard/admin/exams/${exam.id}`}
                            className="text-[#4B5320] hover:underline text-sm"
                          >
                            View
                          </Link>
                          <Link
                            href={`/dashboard/admin/exams/${exam.id}/assign`}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Assign
                          </Link>
                          <a
                            href={`/api/admin/exams/${exam.id}/results`}
                            className="text-green-600 hover:underline text-sm"
                            download
                          >
                            Results
                          </a>
                        </div>
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

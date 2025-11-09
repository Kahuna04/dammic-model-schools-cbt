'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  permissions: {
    can_create_exam?: boolean;
    can_grade?: boolean;
    can_manage_students?: boolean;
  } | null;
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  status: string;
  duration: number;
  totalMarks: number;
  _count: { questions: number; submissions: number };
}

interface Submission {
  id: string;
  status: string;
  totalScore: number | null;
  percentage: number | null;
  submittedAt: string | null;
  student: {
    name: string;
    studentId: string | null;
    classLevel: string | null;
  };
  exam: {
    title: string;
  };
}

export default function StaffDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [permissions, setPermissions] = useState<any>({});
  const [stats, setStats] = useState({ exams: 0, submissions: 0, pendingGrading: 0 });
  const [exams, setExams] = useState<Exam[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user.role !== 'STAFF') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user.role === 'STAFF') {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      const [userRes, examsRes, submissionsRes] = await Promise.all([
        fetch('/api/staff/profile'),
        fetch('/api/staff/exams'),
        fetch('/api/staff/submissions/pending'),
      ]);

      let examsData: Exam[] = [];
      let submissionsData: Submission[] = [];

      if (userRes.ok) {
        const userData: User = await userRes.json();
        setPermissions(userData.permissions || {});
      } else if (userRes.status === 401) {
        router.push('/login');
        return;
      }

      if (examsRes.ok) {
        examsData = await examsRes.json();
        setExams(examsData);
      } else if (examsRes.status === 401) {
        router.push('/login');
        return;
      }

      if (submissionsRes.ok) {
        submissionsData = await submissionsRes.json();
        setPendingSubmissions(submissionsData);
      } else if (submissionsRes.status === 401) {
        router.push('/login');
        return;
      }

      setStats({
        exams: examsData.length,
        submissions: submissionsData.length,
        pendingGrading: submissionsData.length,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F1E8]">
        <div className="text-xl text-[#4B5320]">Loading...</div>
      </div>
    );
  }

  if (session?.user.role !== 'STAFF') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F4F1E8]">
      {/* Header */}
      <header className="bg-[#4B5320] text-white p-4 shadow-md">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Staff Dashboard</h1>
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
                <p className="text-gray-500 text-sm">My Exams</p>
                <p className="text-3xl font-bold text-[#4B5320]">{exams.length}</p>
              </div>
              <div className="text-4xl">📝</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Submissions</p>
                <p className="text-3xl font-bold text-[#4B5320]">{stats.submissions}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending Grading</p>
                <p className="text-3xl font-bold text-orange-600">{pendingSubmissions.length}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>
        </div>

        {/* Permissions Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Your Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-blue-800">
            <div className="flex items-center gap-2">
              {permissions.can_create_exam ? '✅' : '❌'}
              <span>Create Exams</span>
            </div>
            <div className="flex items-center gap-2">
              {permissions.can_grade ? '✅' : '❌'}
              <span>Grade Submissions</span>
            </div>
            <div className="flex items-center gap-2">
              {permissions.can_manage_students ? '✅' : '❌'}
              <span>Manage Students</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-[#4B5320] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {permissions.can_create_exam && (
              <Link
                href="/dashboard/admin/exams/create"
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center"
              >
                <div className="text-4xl mb-2">➕</div>
                <h3 className="font-semibold text-[#4B5320]">Create Exam</h3>
                <p className="text-sm text-gray-600">Create a new exam</p>
              </Link>
            )}

            {permissions.can_create_exam && (
              <Link
                href="/dashboard/admin/upload-questions"
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center"
              >
                <div className="text-4xl mb-2">📄</div>
                <h3 className="font-semibold text-[#4B5320]">Upload Questions</h3>
                <p className="text-sm text-gray-600">Import from Word</p>
              </Link>
            )}

            {permissions.can_grade && (
              <Link
                href="/dashboard/staff/grade"
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center"
              >
                <div className="text-4xl mb-2">📊</div>
                <h3 className="font-semibold text-[#4B5320]">Grade Submissions</h3>
                <p className="text-sm text-gray-600">Review and grade student work</p>
              </Link>
            )}

            <Link
              href="/dashboard/staff/exams"
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center"
            >
              <div className="text-4xl mb-2">📋</div>
              <h3 className="font-semibold text-[#4B5320]">My Exams</h3>
              <p className="text-sm text-gray-600">View all my exams</p>
            </Link>
          </div>
        </div>

        {/* Pending Grading Section */}
        {permissions.can_grade && pendingSubmissions.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-[#4B5320] mb-4">
              Pending Grading ({pendingSubmissions.length})
            </h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-[#4B5320] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-left">Class</th>
                    <th className="px-4 py-3 text-left">Exam</th>
                    <th className="px-4 py-3 text-left">Submitted</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingSubmissions.slice(0, 10).map((submission) => (
                    <tr key={submission.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{submission.student.name}</p>
                          <p className="text-sm text-gray-500">{submission.student.studentId}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">{submission.student.classLevel}</td>
                      <td className="px-4 py-3 font-medium">{submission.exam.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {submission.submittedAt
                          ? new Date(submission.submittedAt).toLocaleString()
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                          {submission.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/staff/grade/${submission.id}`}
                          className="text-[#4B5320] hover:underline text-sm font-medium"
                        >
                          Grade Now
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
            {pendingSubmissions.length > 10 && (
              <div className="text-center mt-4">
                <Link
                  href="/dashboard/staff/grade"
                  className="text-[#4B5320] hover:underline font-medium"
                >
                  View all pending submissions ({pendingSubmissions.length})
                </Link>
              </div>
            )}
          </section>
        )}

        {/* Recent Exams */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#4B5320] mb-4">My Recent Exams</h2>
          {exams.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
              {permissions.can_create_exam
                ? 'No exams created yet. Create your first exam!'
                : 'No exams assigned to you yet.'}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-[#4B5320] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Questions</th>
                    <th className="px-4 py-3 text-left">Submissions</th>
                    <th className="px-4 py-3 text-left">Duration</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.slice(0, 5).map((exam) => (
                    <tr key={exam.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{exam.title}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            exam.status === 'PUBLISHED'
                              ? 'bg-green-100 text-green-700'
                              : exam.status === 'DRAFT'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {exam.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{exam._count.questions}</td>
                      <td className="px-4 py-3">{exam._count.submissions}</td>
                      <td className="px-4 py-3">{exam.duration} min</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard/admin/exams/${exam.id}/preview`}
                            className="text-purple-600 hover:underline text-sm"
                          >
                            Preview
                          </Link>
                          <Link
                            href={`/dashboard/staff/exams/${exam.id}/results`}
                            className="text-[#4B5320] hover:underline text-sm"
                          >
                            Results
                          </Link>
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

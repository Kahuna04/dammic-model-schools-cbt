'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Exam {
  id: string;
  title: string;
  description: string | null;
  status: string;
  duration: number;
  totalMarks: number;
  createdBy: { name: string };
  _count: { questions: number; submissions: number };
}

export default function AdminExamsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [exams, setExams] = useState<Exam[]>([]);
  const [filteredExams, setFilteredExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      fetchExams();
    }
  }, [session]);

  useEffect(() => {
    let filtered = exams;

    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(e => e.status === filterStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query) ||
        e.createdBy.name.toLowerCase().includes(query)
      );
    }

    setFilteredExams(filtered);
  }, [exams, filterStatus, searchQuery]);

  const fetchExams = async () => {
    try {
      const response = await fetch('/api/admin/exams');
      if (response.ok) {
        const data = await response.json();
        setExams(data);
      }
    } catch (error) {
      console.error('Failed to fetch exams:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-[#4B5320]">Loading...</div>
      </div>
    );
  }

  if (session?.user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F4F1E8]">
      <header className="bg-[#4B5320] text-white p-4 shadow-md">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3 sm:mb-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Manage Exams</h1>
              <p className="text-xs sm:text-sm opacity-90">{filteredExams.length} of {exams.length} exams displayed</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <Link
              href="/dashboard/admin/exams/create"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm text-center w-full sm:w-auto"
            >
              Create New Exam
            </Link>
            <Link
              href="/dashboard/admin"
              className="bg-white text-[#4B5320] px-4 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm text-center w-full sm:w-auto"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-7xl">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Exams</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, description, or creator..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
        {filteredExams.length === 0 && exams.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No Exams Yet</h2>
            <p className="text-gray-600 mb-6">
              Get started by creating your first exam
            </p>
            <Link
              href="/dashboard/admin/exams/create"
              className="inline-block bg-[#4B5320] text-white px-6 py-3 rounded-md hover:bg-[#3d4419] transition-colors"
            >
              Create Your First Exam
            </Link>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No Exams Found</h2>
            <p className="text-gray-600 mb-6">
              No exams match your search criteria
            </p>
            <button
              onClick={() => { setSearchQuery(''); setFilterStatus('ALL'); }}
              className="bg-[#4B5320] text-white px-6 py-3 rounded-md hover:bg-[#3d4419] transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-[#4B5320] text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Questions</th>
                  <th className="px-4 py-3 text-left">Submissions</th>
                  <th className="px-4 py-3 text-left">Duration</th>
                  <th className="px-4 py-3 text-left">Total Marks</th>
                  <th className="px-4 py-3 text-left">Created By</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExams.map((exam) => (
                  <tr key={exam.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{exam.title}</p>
                        {exam.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">
                            {exam.description}
                          </p>
                        )}
                      </div>
                    </td>
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
                    <td className="px-4 py-3 text-center">
                      {exam._count.questions}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {exam._count.submissions}
                    </td>
                    <td className="px-4 py-3">{exam.duration} min</td>
                    <td className="px-4 py-3">{exam.totalMarks}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {exam.createdBy.name}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        <Link
                          href={`/dashboard/admin/exams/${exam.id}`}
                          className="text-[#4B5320] hover:underline text-sm font-medium"
                        >
                          View
                        </Link>
                        <Link
                          href={`/dashboard/admin/exams/${exam.id}/submissions`}
                          className="text-orange-600 hover:underline text-sm font-medium"
                        >
                          Submissions
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
      </main>
    </div>
  );
}

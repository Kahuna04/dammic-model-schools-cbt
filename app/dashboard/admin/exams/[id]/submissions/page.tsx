'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Student {
  name: string;
  studentId: string | null;
  classLevel: string | null;
  email: string | null;
}

interface Submission {
  id: string;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  totalScore: number | null;
  percentage: number | null;
  passed: boolean | null;
  student: Student;
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  status: string;
}

export default function ExamSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const examId = params?.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (examId && session?.user.role === 'ADMIN') {
      fetchSubmissions();
    }
  }, [examId, session]);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`/api/admin/exams/${examId}/submissions`);
      if (response.ok) {
        const data = await response.json();
        setExam(data.exam);
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (submissionId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to reset the exam for ${studentName}? This action cannot be undone.`)) {
      return;
    }

    setResettingId(submissionId);
    try {
      const response = await fetch(`/api/admin/submissions/${submissionId}/reset`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the submission from the list
        setSubmissions(submissions.filter(s => s.id !== submissionId));
        alert(`Exam reset successfully for ${studentName}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to reset exam');
      }
    } catch (error) {
      console.error('Error resetting submission:', error);
      alert('Failed to reset exam');
    } finally {
      setResettingId(null);
    }
  };

  const filteredSubmissions = filterStatus === 'ALL' 
    ? submissions 
    : submissions.filter(s => s.status === filterStatus);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F1E8] flex items-center justify-center">
        <div className="text-xl text-[#4B5320]">Loading...</div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-[#F4F1E8] flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-xl font-bold text-red-600 mb-4">Exam not found</h2>
          <Link href="/dashboard/admin/exams" className="text-[#4B5320] hover:underline">
            Back to Exams
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F1E8]">
      <header className="bg-[#4B5320] text-white p-4 shadow-md">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{exam.title} - Submissions</h1>
              <p className="text-sm opacity-90">{submissions.length} total submission(s)</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/dashboard/admin/exams"
                className="bg-white text-[#4B5320] px-4 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm"
              >
                Back to Exams
              </Link>
              <a
                href={`/api/admin/exams/${examId}/results`}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                download
              >
                Export Results
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-7xl">
        {/* Exam Info */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Duration</p>
              <p className="font-semibold">{exam.duration} minutes</p>
            </div>
            <div>
              <p className="text-gray-500">Total Marks</p>
              <p className="font-semibold">{exam.totalMarks}</p>
            </div>
            <div>
              <p className="text-gray-500">Passing Marks</p>
              <p className="font-semibold">{exam.passingMarks}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
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
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="GRADED">Graded</option>
          </select>
        </div>

        {/* Submissions Table */}
        {filteredSubmissions.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No Submissions Found</h2>
            <p className="text-gray-600">
              {filterStatus === 'ALL' 
                ? 'No students have taken this exam yet'
                : `No submissions with status "${filterStatus}"`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-[#4B5320] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-left">Class</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Score</th>
                    <th className="px-4 py-3 text-left">Percentage</th>
                    <th className="px-4 py-3 text-left">Result</th>
                    <th className="px-4 py-3 text-left">Submitted At</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{submission.student.name}</p>
                          {submission.student.studentId && (
                            <p className="text-sm text-gray-500">{submission.student.studentId}</p>
                          )}
                          {submission.student.email && (
                            <p className="text-xs text-gray-400">{submission.student.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {submission.student.classLevel || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            submission.status === 'GRADED'
                              ? 'bg-green-100 text-green-700'
                              : submission.status === 'SUBMITTED'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {submission.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {submission.totalScore !== null 
                          ? `${submission.totalScore} / ${exam.totalMarks}`
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {submission.percentage !== null 
                          ? `${submission.percentage.toFixed(2)}%`
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {submission.passed !== null ? (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              submission.passed
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {submission.passed ? 'Passed' : 'Failed'}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {submission.submittedAt
                          ? new Date(submission.submittedAt).toLocaleString()
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleReset(submission.id, submission.student.name)}
                          disabled={resettingId === submission.id}
                          className="text-red-600 hover:text-red-800 hover:underline text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resettingId === submission.id ? 'Resetting...' : 'Reset Exam'}
                        </button>
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


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
  const [filterClass, setFilterClass] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [showBulkResetDialog, setShowBulkResetDialog] = useState(false);
  const [isBulkResetting, setIsBulkResetting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

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

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedSubmissions(new Set());
  }, [filterStatus, filterClass, searchQuery, sortBy, sortOrder]);

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

  const handleResetClick = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowResetDialog(true);
  };

  const handleResetConfirm = async () => {
    if (!selectedSubmission) return;

    const submissionId = selectedSubmission.id;
    const studentName = selectedSubmission.student.name;

    setResettingId(submissionId);
    setShowResetDialog(false);
    
    try {
      const response = await fetch(`/api/admin/submissions/${submissionId}/reset`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the submission from the list
        setSubmissions(submissions.filter(s => s.id !== submissionId));
        setSelectedSubmissions(prev => {
          const newSet = new Set(prev);
          newSet.delete(submissionId);
          return newSet;
        });
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
      setSelectedSubmission(null);
    }
  };

  const handleBulkReset = async () => {
    if (selectedSubmissions.size === 0) return;

    setIsBulkResetting(true);
    setShowBulkResetDialog(false);

    try {
      const response = await fetch('/api/admin/submissions/bulk-reset', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionIds: Array.from(selectedSubmissions),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Remove reset submissions from the list
        setSubmissions(submissions.filter(s => !selectedSubmissions.has(s.id)));
        setSelectedSubmissions(new Set());
        alert(`Successfully reset ${result.count} exam submission(s)`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to reset exams');
      }
    } catch (error) {
      console.error('Error bulk resetting submissions:', error);
      alert('Failed to reset exams');
    } finally {
      setIsBulkResetting(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubmissions(new Set(paginatedSubmissions.map(s => s.id)));
    } else {
      setSelectedSubmissions(new Set());
    }
  };

  const handleSelectSubmission = (submissionId: string, checked: boolean) => {
    setSelectedSubmissions(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(submissionId);
      } else {
        newSet.delete(submissionId);
      }
      return newSet;
    });
  };

  // Calculate statistics
  const stats = {
    total: submissions.length,
    inProgress: submissions.filter(s => s.status === 'IN_PROGRESS').length,
    submitted: submissions.filter(s => s.status === 'SUBMITTED').length,
    graded: submissions.filter(s => s.status === 'GRADED').length,
    passed: submissions.filter(s => s.passed === true).length,
    failed: submissions.filter(s => s.passed === false).length,
    averageScore: submissions.filter(s => s.totalScore !== null).length > 0
      ? submissions
          .filter(s => s.totalScore !== null)
          .reduce((sum, s) => sum + (s.totalScore || 0), 0) /
        submissions.filter(s => s.totalScore !== null).length
      : 0,
  };

  // Get unique class levels
  const classLevels = Array.from(
    new Set(submissions.map(s => s.student.classLevel).filter((level): level is string => level !== null))
  ).sort();

  // Filter and search submissions
  let filteredSubmissions = submissions.filter(s => {
    // Status filter
    if (filterStatus !== 'ALL' && s.status !== filterStatus) return false;
    
    // Class filter
    if (filterClass !== 'ALL' && s.student.classLevel !== filterClass) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = s.student.name.toLowerCase().includes(query);
      const matchesId = s.student.studentId?.toLowerCase().includes(query) || false;
      const matchesEmail = s.student.email?.toLowerCase().includes(query) || false;
      if (!matchesName && !matchesId && !matchesEmail) return false;
    }
    
    return true;
  });

  // Sort submissions
  filteredSubmissions.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.student.name.localeCompare(b.student.name);
        break;
      case 'score':
        const scoreA = a.totalScore ?? -1;
        const scoreB = b.totalScore ?? -1;
        comparison = scoreA - scoreB;
        break;
      case 'date':
        const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        comparison = dateA - dateB;
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, endIndex);
  const allSelectedOnPage = paginatedSubmissions.length > 0 && 
    paginatedSubmissions.every(s => selectedSubmissions.has(s.id));
  const someSelectedOnPage = paginatedSubmissions.some(s => selectedSubmissions.has(s.id));

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
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={fetchSubmissions}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                Refresh
              </button>
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

      <main className="container mx-auto p-3 sm:p-6 max-w-7xl">
        {/* Statistics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm mb-1">Total Submissions</p>
            <p className="text-2xl font-bold text-[#4B5320]">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm mb-1">Passed</p>
            <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm mb-1">Failed</p>
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm mb-1">Average Score</p>
            <p className="text-2xl font-bold text-blue-600">
              {stats.averageScore > 0 ? stats.averageScore.toFixed(1) : '-'}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, ID, or Email..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="IN_PROGRESS">In Progress ({stats.inProgress})</option>
                <option value="SUBMITTED">Submitted ({stats.submitted})</option>
                <option value="GRADED">Graded ({stats.graded})</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Class
              </label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
              >
                <option value="ALL">All Classes</option>
                {classLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'score' | 'date')}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
                >
                  <option value="name">Name</option>
                  <option value="score">Score</option>
                  <option value="date">Date</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {filteredSubmissions.length > 0 && selectedSubmissions.size > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <span className="font-semibold text-yellow-800 text-sm sm:text-base">
                {selectedSubmissions.size} submission(s) selected
              </span>
              <button
                onClick={() => setSelectedSubmissions(new Set())}
                className="text-sm text-yellow-700 hover:text-yellow-900 underline"
              >
                Clear selection
              </button>
            </div>
            <button
              onClick={() => setShowBulkResetDialog(true)}
              disabled={isBulkResetting}
              className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isBulkResetting ? 'Resetting...' : `Reset ${selectedSubmissions.size} Selected`}
            </button>
          </div>
        )}

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
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left w-10 sm:w-12">
                      <input
                        type="checkbox"
                        checked={allSelectedOnPage}
                        ref={(input) => {
                          if (input) input.indeterminate = someSelectedOnPage && !allSelectedOnPage;
                        }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 text-[#4B5320] bg-gray-100 border-gray-300 rounded focus:ring-[#4B5320]"
                      />
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm">Student</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm hidden sm:table-cell">Class</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm">Status</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm">Score</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm hidden md:table-cell">Percentage</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm">Result</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm hidden lg:table-cell">Submitted At</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSubmissions.map((submission) => (
                    <tr key={submission.id} className={`border-b hover:bg-gray-50 ${selectedSubmissions.has(submission.id) ? 'bg-blue-50' : ''}`}>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <input
                          type="checkbox"
                          checked={selectedSubmissions.has(submission.id)}
                          onChange={(e) => handleSelectSubmission(submission.id, e.target.checked)}
                          className="w-4 h-4 text-[#4B5320] bg-gray-100 border-gray-300 rounded focus:ring-[#4B5320]"
                        />
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <div>
                          <p className="font-medium text-gray-900 text-xs sm:text-sm">{submission.student.name}</p>
                          {submission.student.studentId && (
                            <p className="text-xs text-gray-500">{submission.student.studentId}</p>
                          )}
                          {submission.student.email && (
                            <p className="text-xs text-gray-400 hidden sm:block">{submission.student.email}</p>
                          )}
                          <p className="text-xs text-gray-500 sm:hidden">{submission.student.classLevel || '-'}</p>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
                        {submission.student.classLevel || '-'}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <span
                          className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${
                            submission.status === 'GRADED'
                              ? 'bg-green-100 text-green-700'
                              : submission.status === 'SUBMITTED'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {submission.status === 'IN_PROGRESS' ? 'In Progress' : submission.status}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                        {submission.totalScore !== null 
                          ? `${submission.totalScore} / ${exam.totalMarks}`
                          : '-'}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hidden md:table-cell">
                        {submission.percentage !== null 
                          ? `${submission.percentage.toFixed(2)}%`
                          : '-'}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        {submission.passed !== null ? (
                          <span
                            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${
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
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 hidden lg:table-cell">
                        {submission.submittedAt
                          ? new Date(submission.submittedAt).toLocaleString()
                          : '-'}
                      </td>
                      <td className="px-2 sm:px-4 py-3">
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                          <Link
                            href={`/dashboard/admin/submissions/${submission.id}/view`}
                            className="text-blue-600 hover:text-blue-800 hover:underline text-xs sm:text-sm font-medium"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleResetClick(submission)}
                            disabled={resettingId === submission.id}
                            className="text-red-600 hover:text-red-800 hover:underline text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed text-left sm:text-left"
                          >
                            {resettingId === submission.id ? 'Resetting...' : 'Reset'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-3 sm:px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                  <span className="text-xs sm:text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredSubmissions.length)} of {filteredSubmissions.length} results
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="text-xs sm:text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-[#4B5320] focus:outline-none w-full sm:w-auto"
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap w-full sm:w-auto justify-center sm:justify-end">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-700">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Single Reset Confirmation Dialog */}
        {showResetDialog && selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg sm:text-xl font-bold text-red-600 mb-4">Confirm Reset</h3>
              <div className="mb-4 space-y-2 text-sm sm:text-base">
                <p><strong>Student:</strong> {selectedSubmission.student.name}</p>
                {selectedSubmission.student.studentId && (
                  <p><strong>ID:</strong> {selectedSubmission.student.studentId}</p>
                )}
                {selectedSubmission.student.classLevel && (
                  <p><strong>Class:</strong> {selectedSubmission.student.classLevel}</p>
                )}
                <p><strong>Status:</strong> {selectedSubmission.status}</p>
                {selectedSubmission.totalScore !== null && (
                  <p><strong>Score:</strong> {selectedSubmission.totalScore} / {exam.totalMarks}</p>
                )}
                {selectedSubmission.submittedAt && (
                  <p><strong>Submitted:</strong> {new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
                )}
              </div>
              <p className="text-sm sm:text-base text-red-600 font-semibold mb-4">
                ⚠️ This action cannot be undone. The student will be able to retake the exam.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowResetDialog(false);
                    setSelectedSubmission(null);
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetConfirm}
                  disabled={resettingId === selectedSubmission.id}
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resettingId === selectedSubmission.id ? 'Resetting...' : 'Confirm Reset'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Reset Confirmation Dialog */}
        {showBulkResetDialog && selectedSubmissions.size > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg sm:text-xl font-bold text-red-600 mb-4">Confirm Bulk Reset</h3>
              <div className="mb-4">
                <p className="text-sm sm:text-base text-gray-700 mb-2">
                  You are about to reset <strong>{selectedSubmissions.size}</strong> exam submission(s).
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  This will delete all selected submissions and allow those students to retake the exam.
                </p>
              </div>
              <p className="text-sm sm:text-base text-red-600 font-semibold mb-4">
                ⚠️ This action cannot be undone. All selected students will be able to retake the exam.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
                <button
                  onClick={() => setShowBulkResetDialog(false)}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkReset}
                  disabled={isBulkResetting}
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isBulkResetting ? 'Resetting...' : `Confirm Reset ${selectedSubmissions.size} Submission(s)`}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Answer {
  id: string;
  answer: string;
  isCorrect: boolean | null;
  marks: number | null;
  question: {
    id: string;
    type: string;
    question: string;
    options: string[] | null;
    correctAnswer: string;
    marks: number;
  };
}

interface Submission {
  id: string;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  totalScore: number | null;
  percentage: number | null;
  student: {
    name: string;
    studentId: string | null;
    classLevel: string | null;
  };
  exam: {
    id: string;
    title: string;
    totalMarks: number;
    passingMarks: number;
  };
  answers: Answer[];
}

export default function GradeSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const submissionId = params?.submissionId as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user.role !== 'STAFF') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (submissionId && session?.user.role === 'STAFF') {
      fetchSubmission();
    }
  }, [submissionId, session]);

  const fetchSubmission = async () => {
    try {
      const response = await fetch(`/api/staff/submissions/${submissionId}`);
      if (response.ok) {
        const data = await response.json();
        setSubmission(data);

        // Initialize grades with existing marks
        const initialGrades: Record<string, number> = {};
        data.answers.forEach((answer: Answer) => {
          if (answer.marks !== null) {
            initialGrades[answer.id] = answer.marks;
          }
        });
        setGrades(initialGrades);
      }
    } catch (error) {
      console.error('Failed to fetch submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (answerId: string, marks: number) => {
    setGrades((prev) => ({ ...prev, [answerId]: marks }));
  };

  const handleSaveGrades = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/staff/submissions/${submissionId}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades }),
      });

      if (response.ok) {
        alert('Grades saved successfully!');
        router.push('/dashboard/staff');
      } else {
        throw new Error('Failed to save grades');
      }
    } catch (error) {
      alert('Failed to save grades. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const calculateTotalScore = () => {
    if (!submission) return 0;
    let total = 0;

    submission.answers.forEach((answer) => {
      if (answer.question.type === 'ESSAY') {
        total += grades[answer.id] || 0;
      } else {
        total += answer.marks || 0;
      }
    });

    return total;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F1E8] flex items-center justify-center">
        <div className="text-xl text-[#4B5320]">Loading submission...</div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-[#F4F1E8] flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-xl font-bold text-red-600 mb-4">Submission not found</h2>
          <Link href="/dashboard/staff" className="text-[#4B5320] hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const totalScore = calculateTotalScore();
  const percentage = (totalScore / submission.exam.totalMarks) * 100;
  const passed = totalScore >= submission.exam.passingMarks;

  return (
    <div className="min-h-screen bg-[#F4F1E8]">
      {/* Header */}
      <header className="bg-[#4B5320] text-white p-4 shadow-md sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Grade Submission</h1>
            <p className="text-sm opacity-90">{submission.exam.title}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveGrades}
              disabled={saving}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Grades'}
            </button>
            <Link
              href="/dashboard/staff"
              className="bg-white text-[#4B5320] px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-5xl">
        {/* Student Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-[#4B5320] mb-4">Student Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-500 text-sm">Student Name</p>
              <p className="font-semibold">{submission.student.name}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Admission Number</p>
              <p className="font-semibold">{submission.student.studentId || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Class</p>
              <p className="font-semibold">{submission.student.classLevel || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Submitted At</p>
              <p className="font-semibold">
                {submission.submittedAt
                  ? new Date(submission.submittedAt).toLocaleString()
                  : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Score Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-[#4B5320] mb-4">Score Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-500 text-sm">Current Score</p>
              <p className="text-2xl font-bold text-[#4B5320]">
                {totalScore} / {submission.exam.totalMarks}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Percentage</p>
              <p className="text-2xl font-bold">{percentage.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Passing Marks</p>
              <p className="text-lg font-semibold">{submission.exam.passingMarks}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Status</p>
              <p className={`text-lg font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                {passed ? 'PASSED' : 'FAILED'}
              </p>
            </div>
          </div>
        </div>

        {/* Answers */}
        <div className="space-y-6">
          {submission.answers.map((answer, index) => (
            <div key={answer.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <span className="text-sm text-gray-500">Question {index + 1}</span>
                  <h3 className="text-lg font-semibold text-[#4B5320] mt-1">
                    {answer.question.question}
                  </h3>
                </div>
                <span className="text-sm bg-[#4B5320] text-white px-3 py-1 rounded-full ml-4">
                  {answer.question.marks} marks
                </span>
              </div>

              {/* Question Type: Multiple Choice or True/False */}
              {(answer.question.type === 'MULTIPLE_CHOICE' ||
                answer.question.type === 'TRUE_FALSE') && (
                <div className="space-y-2">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Student's Answer:</p>
                      <p className={`font-semibold ${answer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {answer.answer || 'Not answered'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Correct Answer:</p>
                      <p className="font-semibold text-green-600">
                        {answer.question.correctAnswer}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        answer.isCorrect
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                    <span className="text-sm text-gray-600">
                      Score: {answer.marks || 0} / {answer.question.marks}
                    </span>
                  </div>
                </div>
              )}

              {/* Question Type: Essay */}
              {answer.question.type === 'ESSAY' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Student's Answer:</p>
                    <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
                      <p className="whitespace-pre-wrap">{answer.answer || 'Not answered'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Suggested Answer/Key Points:</p>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900">{answer.question.correctAnswer}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Award Marks (out of {answer.question.marks}):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={answer.question.marks}
                      value={grades[answer.id] || 0}
                      onChange={(e) =>
                        handleGradeChange(answer.id, parseFloat(e.target.value) || 0)
                      }
                      className="w-32 p-3 border-2 border-gray-300 rounded-md focus:border-[#4B5320] focus:outline-none text-lg font-semibold"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold text-gray-700">
                Final Score: <span className="text-2xl text-[#4B5320]">{totalScore}</span> /{' '}
                {submission.exam.totalMarks}
              </p>
              <p className="text-sm text-gray-600">
                Percentage: {percentage.toFixed(1)}% -{' '}
                <span className={passed ? 'text-green-600' : 'text-red-600'}>
                  {passed ? 'PASSED' : 'FAILED'}
                </span>
              </p>
            </div>
            <button
              onClick={handleSaveGrades}
              disabled={saving}
              className="px-8 py-3 bg-[#4B5320] text-white rounded-md hover:bg-[#3d4419] transition-colors disabled:opacity-50 font-semibold text-lg"
            >
              {saving ? 'Saving...' : 'Save & Submit Grades'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

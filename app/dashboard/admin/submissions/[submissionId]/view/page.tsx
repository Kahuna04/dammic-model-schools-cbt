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
    order: number;
  };
}

interface Submission {
  id: string;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  totalScore: number | null;
  percentage: number | null;
  passed: boolean | null;
  student: {
    name: string;
    studentId: string | null;
    classLevel: string | null;
    email: string | null;
  };
  exam: {
    id: string;
    title: string;
    totalMarks: number;
    passingMarks: number;
  };
  answers: Answer[];
}

export default function ViewSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const submissionId = params?.submissionId as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (submissionId && session?.user.role === 'ADMIN') {
      fetchSubmission();
    }
  }, [submissionId, session]);

  const fetchSubmission = async () => {
    try {
      const response = await fetch(`/api/admin/submissions/${submissionId}`);
      if (response.ok) {
        const data = await response.json();
        setSubmission(data);
      }
    } catch (error) {
      console.error('Failed to fetch submission:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F1E8] flex items-center justify-center">
        <div className="text-xl text-[#4B5320]">Loading...</div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-[#F4F1E8] flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-xl font-bold text-red-600 mb-4">Submission not found</h2>
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
              <h1 className="text-xl sm:text-2xl font-bold">Submission Details</h1>
              <p className="text-sm opacity-90">{submission.exam.title}</p>
            </div>
            <Link
              href={`/dashboard/admin/exams/${submission.exam.id}/submissions`}
              className="bg-white text-[#4B5320] px-4 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm"
            >
              Back to Submissions
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-5xl">
        {/* Student Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-[#4B5320] mb-4">Student Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-500 text-sm">Name</p>
              <p className="font-semibold">{submission.student.name}</p>
            </div>
            {submission.student.studentId && (
              <div>
                <p className="text-gray-500 text-sm">Student ID</p>
                <p className="font-semibold">{submission.student.studentId}</p>
              </div>
            )}
            {submission.student.classLevel && (
              <div>
                <p className="text-gray-500 text-sm">Class</p>
                <p className="font-semibold">{submission.student.classLevel}</p>
              </div>
            )}
            {submission.student.email && (
              <div>
                <p className="text-gray-500 text-sm">Email</p>
                <p className="font-semibold text-sm">{submission.student.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Submission Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-[#4B5320] mb-4">Submission Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-500 text-sm">Status</p>
              <span
                className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${
                  submission.status === 'GRADED'
                    ? 'bg-green-100 text-green-700'
                    : submission.status === 'SUBMITTED'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {submission.status}
              </span>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Score</p>
              <p className="font-semibold">
                {submission.totalScore !== null
                  ? `${submission.totalScore} / ${submission.exam.totalMarks}`
                  : 'Not graded'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Percentage</p>
              <p className="font-semibold">
                {submission.percentage !== null
                  ? `${submission.percentage.toFixed(2)}%`
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Result</p>
              {submission.passed !== null ? (
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${
                    submission.passed
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {submission.passed ? 'Passed' : 'Failed'}
                </span>
              ) : (
                <p className="font-semibold">-</p>
              )}
            </div>
            <div>
              <p className="text-gray-500 text-sm">Started At</p>
              <p className="font-semibold text-sm">
                {new Date(submission.startedAt).toLocaleString()}
              </p>
            </div>
            {submission.submittedAt && (
              <div>
                <p className="text-gray-500 text-sm">Submitted At</p>
                <p className="font-semibold text-sm">
                  {new Date(submission.submittedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Answers */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#4B5320]">Answers</h2>
          {submission.answers.map((answer, index) => (
            <div key={answer.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <span className="text-sm text-gray-500">Question {index + 1}</span>
                  <h3 className="text-lg font-semibold text-[#4B5320] mt-1">
                    {answer.question.question}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm bg-[#4B5320] text-white px-3 py-1 rounded-full">
                    {answer.question.marks} marks
                  </span>
                  {answer.isCorrect !== null && (
                    <span
                      className={`text-sm px-3 py-1 rounded-full font-semibold ${
                        answer.isCorrect
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  )}
                  {answer.marks !== null && (
                    <span className="text-sm text-gray-600">
                      ({answer.marks} / {answer.question.marks} marks)
                    </span>
                  )}
                </div>
              </div>

              {/* Multiple Choice or True/False */}
              {(answer.question.type === 'MULTIPLE_CHOICE' ||
                answer.question.type === 'TRUE_FALSE') && (
                <div className="space-y-2">
                  {answer.question.options && (
                    <div className="space-y-2">
                      {answer.question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`p-3 border-2 rounded-lg ${
                            option === answer.answer
                              ? option === answer.question.correctAnswer
                                ? 'border-green-500 bg-green-50'
                                : 'border-red-500 bg-red-50'
                              : option === answer.question.correctAnswer
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="mr-3 font-semibold">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            <span className="flex-1">{option}</span>
                            {option === answer.answer && (
                              <span className="ml-2 text-sm font-semibold text-blue-600">
                                (Student's Answer)
                              </span>
                            )}
                            {option === answer.question.correctAnswer && (
                              <span className="ml-2 text-sm font-semibold text-green-600">
                                ✓ Correct
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Essay */}
              {answer.question.type === 'ESSAY' && (
                <div className="space-y-3">
                  <div className="p-4 border-2 border-gray-300 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-600 mb-2">Student's Answer:</p>
                    <p className="whitespace-pre-wrap">{answer.answer || 'No answer provided'}</p>
                  </div>
                  <div className="p-4 border-2 border-green-300 rounded-lg bg-green-50">
                    <p className="text-sm text-gray-600 mb-2">Suggested Answer:</p>
                    <p className="text-sm">{answer.question.correctAnswer}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}


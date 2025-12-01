'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Question {
  id: string;
  type: string;
  question: string;
  options: string[] | null;
  correctAnswer: string;
  marks: number;
  order: number;
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  status: string;
  questions: Question[];
}

export default function ExamPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const examId = params?.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    questionId: string | null;
    questionText: string;
    deleteAll: boolean;
  }>({
    isOpen: false,
    questionId: null,
    questionText: '',
    deleteAll: false,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user.role !== 'ADMIN' && session?.user.role !== 'STAFF') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (examId && (session?.user.role === 'ADMIN' || session?.user.role === 'STAFF')) {
      fetchExam();
    }
  }, [examId, session]);

  const fetchExam = async () => {
    try {
      // Use appropriate API endpoint based on role
      const apiUrl = session?.user.role === 'STAFF' 
        ? `/api/staff/exams/${examId}`
        : `/api/admin/exams/${examId}`;
      
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        setExam(data);
        // Adjust current question index if it's out of bounds after deletion
        if (data.questions.length > 0 && currentQuestionIndex >= data.questions.length) {
          setCurrentQuestionIndex(data.questions.length - 1);
        } else if (data.questions.length === 0) {
          setCurrentQuestionIndex(0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (questionId: string, questionText: string) => {
    setConfirmDialog({
      isOpen: true,
      questionId,
      questionText,
      deleteAll: false,
    });
  };

  const handleDeleteAllClick = () => {
    setConfirmDialog({
      isOpen: true,
      questionId: null,
      questionText: '',
      deleteAll: true,
    });
  };

  const handleDeleteConfirm = async () => {
    if (confirmDialog.deleteAll) {
      // Delete all questions
      setDeletingAll(true);
      try {
        const apiUrl = session?.user.role === 'STAFF' 
          ? `/api/admin/exams/${examId}/questions`
          : `/api/admin/exams/${examId}/questions`;
        
        const response = await fetch(apiUrl, {
          method: 'DELETE',
        });

        if (response.ok) {
          const result = await response.json();
          // Refresh exam data
          await fetchExam();
          alert(`${result.message}. Exam marks have been reset to zero.`);
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to delete all questions');
        }
      } catch (error) {
        console.error('Error deleting all questions:', error);
        alert('Failed to delete all questions. Please try again.');
      } finally {
        setDeletingAll(false);
        setConfirmDialog({
          isOpen: false,
          questionId: null,
          questionText: '',
          deleteAll: false,
        });
      }
    } else {
      // Delete single question
      if (!confirmDialog.questionId) return;

      setDeletingQuestionId(confirmDialog.questionId);
      try {
        const response = await fetch(`/api/admin/questions/${confirmDialog.questionId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          const result = await response.json();
          // Refresh exam data to get updated questions and marks
          await fetchExam();
          alert('Question deleted successfully. Exam marks have been updated.');
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to delete question');
        }
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('Failed to delete question. Please try again.');
      } finally {
        setDeletingQuestionId(null);
        setConfirmDialog({
          isOpen: false,
          questionId: null,
          questionText: '',
          deleteAll: false,
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F1E8] flex items-center justify-center">
        <div className="text-xl text-[#4B5320]">Loading preview...</div>
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

  const currentQuestion = exam.questions[currentQuestionIndex];

  // If no questions, show empty state
  if (!currentQuestion || exam.questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#F4F1E8]">
        <header className="bg-[#4B5320] text-white p-4 shadow-md sticky top-0 z-10">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">{exam.title} - Preview</h1>
            <Link
              href={session?.user.role === 'STAFF' ? '/dashboard/staff' : `/dashboard/admin/exams`}
              className="bg-white text-[#4B5320] px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              Back to {session?.user.role === 'STAFF' ? 'Dashboard' : 'Exams'}
            </Link>
          </div>
        </header>
        <main className="container mx-auto p-6 max-w-4xl">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-xl font-bold text-gray-700 mb-2">No Questions</h2>
            <p className="text-gray-600">This exam has no questions yet.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F1E8]">
      {/* Header */}
      <header className="bg-[#4B5320] text-white p-4 shadow-md sticky top-0 z-10 print:hidden">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{exam.title} - Preview</h1>
            <p className="text-sm opacity-90">
              Question {currentQuestionIndex + 1} of {exam.questions.length}
            </p>
          </div>
          <div className="flex gap-2">
            {exam.questions.length > 0 && (
              <button
                onClick={handleDeleteAllClick}
                disabled={deletingAll}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title="Delete all questions from this exam"
              >
                {deletingAll ? 'Deleting...' : 'Delete All Questions'}
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Print
            </button>
            <Link
              href={session?.user.role === 'STAFF' ? '/dashboard/staff' : `/dashboard/admin/exams`}
              className="bg-white text-[#4B5320] px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              Back to {session?.user.role === 'STAFF' ? 'Dashboard' : 'Exams'}
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-4xl">
        {/* Exam Info Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-[#4B5320] mb-4">{exam.title}</h2>
          {exam.description && (
            <p className="text-gray-600 mb-4">{exam.description}</p>
          )}
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
              <p className="text-gray-500">Questions</p>
              <p className="font-semibold">{exam.questions.length}</p>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="mb-4">
            <span className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1}
            </span>
            <div className="flex justify-between items-start mt-2">
              <h2 className="text-xl font-semibold text-[#4B5320] flex-1">
                {currentQuestion.question}
              </h2>
              <div className="flex items-center gap-2 ml-4">
                <span className="text-sm bg-[#4B5320] text-white px-3 py-1 rounded-full">
                  {currentQuestion.marks} marks
                </span>
                <button
                  onClick={() => handleDeleteClick(currentQuestion.id, currentQuestion.question)}
                  disabled={deletingQuestionId === currentQuestion.id}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium px-3 py-1 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                  title="Delete question"
                >
                  {deletingQuestionId === currentQuestion.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>

          {/* Answer Section */}
          <div className="mt-6">
            {currentQuestion.type === 'MULTIPLE_CHOICE' && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className={`flex items-center p-4 border-2 rounded-lg ${
                      option === currentQuestion.correctAnswer
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <span className="mr-3 font-semibold">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span className="text-gray-700">{option}</span>
                    {option === currentQuestion.correctAnswer && (
                      <span className="ml-auto text-green-600 font-semibold">✓ Correct</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {currentQuestion.type === 'TRUE_FALSE' && (
              <div className="space-y-3">
                {['True', 'False'].map((option) => (
                  <div
                    key={option}
                    className={`flex items-center p-4 border-2 rounded-lg ${
                      option === currentQuestion.correctAnswer
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <span className="text-gray-700">{option}</span>
                    {option === currentQuestion.correctAnswer && (
                      <span className="ml-auto text-green-600 font-semibold">✓ Correct</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {currentQuestion.type === 'ESSAY' && (
              <div className="p-4 border-2 border-gray-300 rounded-lg bg-gray-50">
                <p className="text-sm text-gray-600 italic">
                  Essay question - requires manual grading
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Suggested answer: {currentQuestion.correctAnswer}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Question Navigation */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 print:hidden">
          <p className="text-sm text-gray-600 mb-3">Question Navigation</p>
          <div className="flex flex-wrap gap-2">
            {exam.questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded-md font-semibold transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-[#4B5320] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center print:hidden">
          <button
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="text-center text-sm text-gray-600">
            {currentQuestionIndex + 1} of {exam.questions.length}
          </div>

          <button
            onClick={() =>
              setCurrentQuestionIndex((prev) =>
                Math.min(exam.questions.length - 1, prev + 1)
              )
            }
            disabled={currentQuestionIndex === exam.questions.length - 1}
            className="px-6 py-3 bg-[#4B5320] text-white rounded-md hover:bg-[#3d4419] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>

        {/* Print View - All Questions */}
        <div className="hidden print:block mt-8">
          <h2 className="text-2xl font-bold mb-4">All Questions</h2>
          {exam.questions.map((q, index) => (
            <div key={q.id} className="mb-6 border-b pb-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">
                  {index + 1}. {q.question}
                </h3>
                <span className="text-sm">({q.marks} marks)</span>
              </div>
              {q.type === 'MULTIPLE_CHOICE' && q.options && (
                <div className="ml-4 space-y-1">
                  {q.options.map((opt, i) => (
                    <p key={i} className={opt === q.correctAnswer ? 'font-semibold' : ''}>
                      {String.fromCharCode(65 + i)}. {opt}
                      {opt === q.correctAnswer && ' ✓'}
                    </p>
                  ))}
                </div>
              )}
              {q.type === 'TRUE_FALSE' && (
                <p className="ml-4 font-semibold">Answer: {q.correctAnswer}</p>
              )}
              {q.type === 'ESSAY' && (
                <p className="ml-4 text-sm text-gray-600 italic">Essay question</p>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.deleteAll ? "Delete All Questions" : "Delete Question"}
        message={confirmDialog.deleteAll 
          ? `Are you sure you want to delete ALL ${exam.questions.length} question(s) from this exam? This will reset the exam's total marks to zero and affect all existing submissions. This action cannot be undone.`
          : `Are you sure you want to delete this question? This will also update the exam's total marks. This action cannot be undone.\n\n"${confirmDialog.questionText.substring(0, 100)}${confirmDialog.questionText.length > 100 ? '...' : ''}"`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false, deleteAll: false })}
        isDangerous={true}
        confirmText="Delete"
      />
    </div>
  );
}

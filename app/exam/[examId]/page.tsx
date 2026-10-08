'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ExamHeader,
  ExamQuestionCard,
  ExamQuestionGrid,
  ExamSubmitModal,
  Question,
} from '@/components/exam';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  totalMarks: number;
  questions: Question[];
}

export default function ExamPage() {
  const router = useRouter();
  const params = useParams();
  const { status } = useSession();
  const examId = params?.examId as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Shuffle array helper
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleSubmit = useCallback(async () => {
    if (!submissionId || isSubmitting) return;

    setShowSubmitModal(false);
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/exams/${examId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, answers }),
      });

      if (!response.ok) throw new Error('Failed to submit exam');
      router.push('/dashboard/student');
    } catch (err) {
      alert('Failed to submit exam. Please try again.');
      setIsSubmitting(false);
    }
  }, [submissionId, isSubmitting, examId, answers, router]);

  // Load exam data
  useEffect(() => {
    if (!examId || status !== 'authenticated') return;

    const startExam = async () => {
      try {
        const examRes = await fetch(`/api/exams/${examId}`);
        if (!examRes.ok) throw new Error('Failed to load exam');
        const examData = await examRes.json();

        const randomizedQuestions = shuffleArray<Question>(examData.questions).map((q: Question) => ({
          ...q,
          options: q.options && q.type === 'MULTIPLE_CHOICE' ? shuffleArray(q.options) : q.options,
        }));

        setExam({ ...examData, questions: randomizedQuestions });
        setTimeRemaining(examData.duration * 60);

        const submissionRes = await fetch(`/api/exams/${examId}/start`, {
          method: 'POST',
        });
        if (!submissionRes.ok) throw new Error('Failed to start exam');
        const submissionData = await submissionRes.json();
        setSubmissionId(submissionData.id);

        if (submissionData.answers && submissionData.answers.length > 0) {
          const existingAnswers: Record<string, string> = {};
          submissionData.answers.forEach((ans: { questionId: string; answer: string }) => {
            existingAnswers[ans.questionId] = ans.answer;
          });
          setAnswers(existingAnswers);
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    startExam();
  }, [examId, status]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0 || !submissionId) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, submissionId, handleSubmit]);

  // Auto-save draft answers every 30 seconds
  useEffect(() => {
    if (!submissionId || Object.keys(answers).length === 0 || isSubmitting) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/exams/${examId}/save-draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId, answers }),
        });
        if (res.ok) {
          const data = await res.json();
          setLastSaved(new Date(data.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      } catch (err) {
        console.error('Draft save error:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [submissionId, examId, answers, isSubmitting]);

  // Tab switch & Window focus lost proctoring detector
  useEffect(() => {
    if (!submissionId || isSubmitting) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          if (newCount >= 5) {
            alert('⚠️ Security Alert: Maximum tab-switch limit reached (5/5). Your exam is being automatically submitted.');
            handleSubmit();
          }
          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [submissionId, isSubmitting, handleSubmit]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const toggleFlagQuestion = (questionId: string) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F1E8] p-6 max-w-4xl mx-auto space-y-4 pt-12">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-[#F4F1E8] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center space-y-4">
          <h2 className="text-xl font-bold text-red-600">Error</h2>
          <p className="text-gray-600 text-sm">{error || 'Exam not found'}</p>
          <button
            onClick={() => router.push('/dashboard/student')}
            className="bg-[#4B5320] text-white px-6 py-2.5 rounded-xl font-semibold text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim()).length;

  return (
    <div
      className="min-h-screen bg-[#F4F1E8] select-none"
      onCopy={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Tab Switch Security Warning Banner */}
      {tabSwitchCount > 0 && (
        <div className="bg-amber-600 text-white text-xs font-bold px-4 py-2 text-center flex items-center justify-center gap-2 shadow-sm animate-pulse">
          <span>⚠️ Security Warning: Tab switch detected ({tabSwitchCount}/5). Switching tabs 5 times will automatically submit your exam.</span>
        </div>
      )}

      {/* Sticky Exam Header */}
      <ExamHeader
        title={exam.title}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={exam.questions.length}
        answeredCount={answeredCount}
        timeRemaining={timeRemaining}
        isSaved={true}
      />

      <main className="container mx-auto p-4 md:p-6 max-w-4xl space-y-6">
        {/* Current Question Card */}
        <ExamQuestionCard
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          currentAnswer={answers[currentQuestion.id] || ''}
          onAnswerChange={(ans) => handleAnswerChange(currentQuestion.id, ans)}
          isFlagged={flaggedQuestions.has(currentQuestion.id)}
          onToggleFlag={() => toggleFlagQuestion(currentQuestion.id)}
        />

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center gap-3">
          <button
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors shadow-sm"
          >
            ← Previous
          </button>

          {lastSaved && (
            <span className="text-[11px] text-gray-500 font-medium">
              Saved at {lastSaved}
            </span>
          )}

          {currentQuestionIndex < exam.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#4B5320] text-white hover:bg-[#3d4419] transition-colors shadow-md"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-md"
            >
              Finish & Submit Exam
            </button>
          )}
        </div>

        {/* Question Palette Grid Navigator */}
        <ExamQuestionGrid
          questions={exam.questions}
          currentQuestionIndex={currentQuestionIndex}
          answers={answers}
          flaggedQuestions={flaggedQuestions}
          onSelectQuestion={(idx) => setCurrentQuestionIndex(idx)}
        />
      </main>

      {/* Submission Confirmation Modal */}
      <ExamSubmitModal
        isOpen={showSubmitModal}
        totalQuestions={exam.questions.length}
        answeredCount={answeredCount}
        flaggedCount={flaggedQuestions.size}
        isSubmitting={isSubmitting}
        onConfirm={handleSubmit}
        onCancel={() => setShowSubmitModal(false)}
      />
    </div>
  );
}

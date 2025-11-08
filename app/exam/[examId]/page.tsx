'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Question {
  id: string;
  type: string;
  question: string;
  options: string[] | null;
  marks: number;
  order: number;
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  totalMarks: number;
  questions: Question[];
}

interface Answer {
  questionId: string;
  answer: string;
}

export default function ExamPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const examId = params?.examId as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenWarnings, setFullscreenWarnings] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Shuffle array utility
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Request fullscreen
  const enterFullscreen = useCallback(() => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    }
  }, []);

  // Exit fullscreen
  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && exam && !isSubmitting) {
        setIsFullscreen(false);
        setFullscreenWarnings(prev => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            alert('You have exited fullscreen mode 3 times. Your exam will be submitted.');
            handleSubmit();
          } else {
            alert(`Warning ${newCount}/3: Please stay in fullscreen mode. After 3 warnings, your exam will be auto-submitted.`);
            enterFullscreen();
          }
          return newCount;
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [exam, isSubmitting, enterFullscreen]);

  // Load exam and start submission
  useEffect(() => {
    if (!examId || status !== 'authenticated') return;

    const startExam = async () => {
      try {
        // Fetch exam details
        const examRes = await fetch(`/api/exams/${examId}`);
        if (!examRes.ok) throw new Error('Failed to load exam');
        const examData = await examRes.json();
        
        // Randomize questions and their options
        const randomizedQuestions = shuffleArray<Question>(examData.questions).map((q: Question) => ({
          ...q,
          options: q.options && q.type === 'MULTIPLE_CHOICE' ? shuffleArray(q.options) : q.options,
        }));
        
        setExam({ ...examData, questions: randomizedQuestions });
        setTimeRemaining(examData.duration * 60); // Convert to seconds

        // Start or resume submission
        const submissionRes = await fetch(`/api/exams/${examId}/start`, {
          method: 'POST',
        });
        if (!submissionRes.ok) throw new Error('Failed to start exam');
        const submissionData = await submissionRes.json();
        setSubmissionId(submissionData.id);

        // Load existing answers if resuming
        if (submissionData.answers && submissionData.answers.length > 0) {
          const existingAnswers: Record<string, string> = {};
          submissionData.answers.forEach((ans: any) => {
            existingAnswers[ans.questionId] = ans.answer;
          });
          setAnswers(existingAnswers);
        }

        setLoading(false);
        
        // Enter fullscreen after exam loads
        setTimeout(() => enterFullscreen(), 500);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    startExam();
  }, [examId, status, enterFullscreen]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!exam || isSubmitting) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent default browser shortcuts
      if ((e.ctrlKey || e.metaKey) && ['p', 's', 'c', 'v', 'a'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }

      // Arrow key navigation
      if (e.key === 'ArrowRight' && currentQuestionIndex < exam.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
        setCurrentQuestionIndex(prev => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [exam, currentQuestionIndex, isSubmitting]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0 || !submissionId) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit(); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, submissionId]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const confirmSubmit = () => {
    setShowSubmitDialog(true);
  };

  const handleSubmit = async () => {
    if (!submissionId || isSubmitting) return;

    setShowSubmitDialog(false);
    setIsSubmitting(true);
    exitFullscreen();
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
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F1E8] flex items-center justify-center">
        <div className="text-xl text-[#4B5320]">Loading exam...</div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-[#F4F1E8] flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Exam not found'}</p>
          <button
            onClick={() => router.push('/dashboard/student')}
            className="bg-[#4B5320] text-white px-6 py-2 rounded-md"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-[#F4F1E8]">
      {/* Header */}
      <header className="bg-[#4B5320] text-white p-3 sm:p-4 shadow-md sticky top-0 z-10">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
          <div className="flex-1">
            <h1 className="text-base sm:text-xl font-bold line-clamp-1">{exam.title}</h1>
            <p className="text-xs sm:text-sm opacity-90">
              Question {currentQuestionIndex + 1} of {exam.questions.length}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xl sm:text-2xl font-bold">{formatTime(timeRemaining)}</div>
            <p className="text-xs opacity-90">Time Remaining</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-3 sm:p-4 md:p-6 max-w-4xl">
        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
          <div className="mb-4">
            <span className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1}
            </span>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0 mt-2">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-[#4B5320] flex-1">
                {currentQuestion.question}
              </h2>
              <span className="text-xs sm:text-sm bg-[#4B5320] text-white px-2 sm:px-3 py-1 rounded-full sm:ml-4 shrink-0">
                {currentQuestion.marks} marks
              </span>
            </div>
          </div>

          {/* Answer Section */}
          <div className="mt-6">
            {currentQuestion.type === 'MULTIPLE_CHOICE' && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <label
                    key={index}
                    className="flex items-center p-3 sm:p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{
                      borderColor:
                        answers[currentQuestion.id] === option
                          ? '#4B5320'
                          : '#e5e7eb',
                    }}
                  >
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      value={option}
                      checked={answers[currentQuestion.id] === option}
                      onChange={(e) =>
                        handleAnswerChange(currentQuestion.id, e.target.value)
                      }
                      className="mr-2 sm:mr-3"
                    />
                    <span className="text-sm sm:text-base text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'TRUE_FALSE' && (
              <div className="space-y-3">
                {['True', 'False'].map((option) => (
                  <label
                    key={option}
                    className="flex items-center p-3 sm:p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{
                      borderColor:
                        answers[currentQuestion.id] === option
                          ? '#4B5320'
                          : '#e5e7eb',
                    }}
                  >
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      value={option}
                      checked={answers[currentQuestion.id] === option}
                      onChange={(e) =>
                        handleAnswerChange(currentQuestion.id, e.target.value)
                      }
                      className="mr-2 sm:mr-3"
                    />
                    <span className="text-sm sm:text-base text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'ESSAY' && (
              <textarea
                value={answers[currentQuestion.id] || ''}
                onChange={(e) =>
                  handleAnswerChange(currentQuestion.id, e.target.value)
                }
                className="w-full p-3 sm:p-4 border-2 border-gray-300 rounded-lg focus:border-[#4B5320] focus:outline-none text-sm sm:text-base"
                rows={6}
                placeholder="Type your answer here..."
              />
            )}
          </div>
        </div>

        {/* Question Navigation */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm text-gray-600 mb-3">Question Navigation</p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {exam.questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-md font-semibold transition-colors text-xs sm:text-base ${
                  index === currentQuestionIndex
                    ? 'bg-[#4B5320] text-white'
                    : answers[q.id]
                    ? 'bg-green-100 text-green-700 border-2 border-green-500'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <button
            onClick={() =>
              setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
            }
            disabled={currentQuestionIndex === 0}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base order-2 sm:order-1"
          >
            Previous
          </button>

          <div className="text-center text-xs sm:text-sm text-gray-600 order-1 sm:order-2 py-2">
            {Object.keys(answers).length} of {exam.questions.length} answered
          </div>

          {currentQuestionIndex === exam.questions.length - 1 ? (
            <button
              onClick={confirmSubmit}
              disabled={isSubmitting}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base order-3"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          ) : (
            <button
              onClick={() =>
                setCurrentQuestionIndex((prev) =>
                  Math.min(exam.questions.length - 1, prev + 1)
                )
              }
              className="px-4 sm:px-6 py-2 sm:py-3 bg-[#4B5320] text-white rounded-md hover:bg-[#3d4419] transition-colors text-sm sm:text-base order-3"
            >
              Next
            </button>
          )}
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mt-3 sm:mt-4">
          <p className="text-xs sm:text-sm text-blue-900 font-semibold mb-2">⌨️ Keyboard Shortcuts:</p>
          <div className="text-xs text-blue-800 space-y-1">
            <p>• <strong>Arrow Right (→)</strong>: Next question</p>
            <p>• <strong>Arrow Left (←)</strong>: Previous question</p>
            {!isFullscreen && (
              <p className="text-red-600 font-semibold mt-2">⚠️ Please stay in fullscreen mode!</p>
            )}
          </div>
        </div>
      </main>

      {/* Submit Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showSubmitDialog}
        title="Submit Exam"
        message={`Are you sure you want to submit your exam? You have answered ${Object.keys(answers).length} of ${exam?.questions.length} questions. This action cannot be undone.`}
        onConfirm={handleSubmit}
        onCancel={() => setShowSubmitDialog(false)}
        confirmText="Submit"
        isDangerous={false}
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'ESSAY';

interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options: string[];
  correctAnswer: string;
  marks: number;
}

export default function CreateExamPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [passingPercentage, setPassingPercentage] = useState(50);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: Date.now().toString(),
    type: 'MULTIPLE_CHOICE',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    marks: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (status === 'unauthenticated' || session?.user.role !== 'ADMIN') {
    router.push('/login');
    return null;
  }

  const addQuestion = () => {
    if (!currentQuestion.question.trim()) {
      alert('Please enter a question');
      return;
    }

    if (currentQuestion.type === 'MULTIPLE_CHOICE') {
      if (currentQuestion.options.some((opt) => !opt.trim())) {
        alert('Please fill all options');
        return;
      }
      if (!currentQuestion.correctAnswer) {
        alert('Please select the correct answer');
        return;
      }
    }

    if (currentQuestion.type === 'TRUE_FALSE' && !currentQuestion.correctAnswer) {
      alert('Please select the correct answer');
      return;
    }

    setQuestions([...questions, currentQuestion]);
    setCurrentQuestion({
      id: Date.now().toString(),
      type: 'MULTIPLE_CHOICE',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      marks: 1,
    });
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleSubmit = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!title.trim()) {
      alert('Please enter exam title');
      return;
    }

    if (questions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    setIsSubmitting(true);

    try {
      const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
      const passingMarks = Math.ceil((totalMarks * passingPercentage) / 100);

      const response = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          duration,
          totalMarks,
          passingMarks,
          status,
          startTime: startTime ? new Date(startTime) : null,
          endTime: endTime ? new Date(endTime) : null,
          questions: questions.map((q, index) => ({
            ...q,
            order: index + 1,
            options: q.type === 'MULTIPLE_CHOICE' ? q.options : null,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create exam');
      }

      router.push('/dashboard/admin/exams');
    } catch (error) {
      alert('Failed to create exam. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1E8]">
      <header className="bg-[#4B5320] text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Create Exam</h1>
          <Link
            href="/dashboard/admin"
            className="bg-white text-[#4B5320] px-4 py-2 rounded-md hover:bg-gray-100"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-5xl">
        {/* Exam Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-[#4B5320] mb-4">Exam Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
                placeholder="e.g., Mathematics Final Exam"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
                rows={3}
                placeholder="Optional exam description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes) *
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passing Percentage *
              </label>
              <input
                type="number"
                value={passingPercentage}
                onChange={(e) => setPassingPercentage(parseInt(e.target.value) || 50)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time (optional)
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time (optional)
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Add Question */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-[#4B5320] mb-4">Add Question</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Type
                </label>
                <select
                  value={currentQuestion.type}
                  onChange={(e) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      type: e.target.value as QuestionType,
                      options: e.target.value === 'MULTIPLE_CHOICE' ? ['', '', '', ''] : [],
                      correctAnswer: '',
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
                >
                  <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                  <option value="TRUE_FALSE">True/False</option>
                  <option value="ESSAY">Essay</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marks
                </label>
                <input
                  type="number"
                  value={currentQuestion.marks}
                  onChange={(e) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      marks: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question *
              </label>
              <textarea
                value={currentQuestion.question}
                onChange={(e) =>
                  setCurrentQuestion({ ...currentQuestion, question: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
                rows={3}
                placeholder="Enter your question here"
              />
            </div>

            {currentQuestion.type === 'MULTIPLE_CHOICE' && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Options *
                  </label>
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={currentQuestion.correctAnswer === option}
                        onChange={() =>
                          setCurrentQuestion({
                            ...currentQuestion,
                            correctAnswer: option,
                          })
                        }
                        className="flex-shrink-0"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...currentQuestion.options];
                          newOptions[index] = e.target.value;
                          setCurrentQuestion({
                            ...currentQuestion,
                            options: newOptions,
                          });
                        }}
                        className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
                        placeholder={`Option ${index + 1}`}
                      />
                    </div>
                  ))}
                  <p className="text-xs text-gray-500">
                    Select the radio button for the correct answer
                  </p>
                </div>
              </>
            )}

            {currentQuestion.type === 'TRUE_FALSE' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Correct Answer *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tfAnswer"
                      value="True"
                      checked={currentQuestion.correctAnswer === 'True'}
                      onChange={(e) =>
                        setCurrentQuestion({
                          ...currentQuestion,
                          correctAnswer: e.target.value,
                        })
                      }
                      className="mr-2"
                    />
                    True
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tfAnswer"
                      value="False"
                      checked={currentQuestion.correctAnswer === 'False'}
                      onChange={(e) =>
                        setCurrentQuestion({
                          ...currentQuestion,
                          correctAnswer: e.target.value,
                        })
                      }
                      className="mr-2"
                    />
                    False
                  </label>
                </div>
              </div>
            )}

            {currentQuestion.type === 'ESSAY' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-sm text-yellow-800">
                  Essay questions require manual grading by staff after submission.
                </p>
              </div>
            )}

            <button
              onClick={addQuestion}
              className="w-full py-3 bg-[#4B5320] text-white rounded-md hover:bg-[#3d4419] transition-colors font-semibold"
            >
              Add Question
            </button>
          </div>
        </div>

        {/* Questions List */}
        {questions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-[#4B5320] mb-4">
              Questions ({questions.length})
            </h2>
            <div className="space-y-4">
              {questions.map((q, index) => (
                <div key={q.id} className="border border-gray-200 rounded-md p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-700">Q{index + 1}.</span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {q.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs bg-[#4B5320] text-white px-2 py-1 rounded">
                          {q.marks} marks
                        </span>
                      </div>
                      <p className="text-gray-800 mb-2">{q.question}</p>
                      {q.type === 'MULTIPLE_CHOICE' && (
                        <ul className="text-sm text-gray-600 space-y-1">
                          {q.options.map((opt, i) => (
                            <li key={i} className={opt === q.correctAnswer ? 'text-green-600 font-semibold' : ''}>
                              {String.fromCharCode(65 + i)}. {opt}
                              {opt === q.correctAnswer && ' ✓'}
                            </li>
                          ))}
                        </ul>
                      )}
                      {q.type === 'TRUE_FALSE' && (
                        <p className="text-sm text-green-600 font-semibold">
                          Correct: {q.correctAnswer}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeQuestion(q.id)}
                      className="text-red-600 hover:text-red-800 ml-4"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">
                <strong>Total Marks:</strong> {questions.reduce((sum, q) => sum + q.marks, 0)}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Passing Marks:</strong>{' '}
                {Math.ceil(
                  (questions.reduce((sum, q) => sum + q.marks, 0) * passingPercentage) / 100
                )}
              </p>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => handleSubmit('DRAFT')}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 font-semibold"
          >
            {isSubmitting ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            onClick={() => handleSubmit('PUBLISHED')}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 font-semibold"
          >
            {isSubmitting ? 'Publishing...' : 'Publish Exam'}
          </button>
        </div>
      </main>
    </div>
  );
}

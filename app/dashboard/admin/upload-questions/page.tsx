'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UploadQuestionsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form fields
  const [file, setFile] = useState<File | null>(null);
  const [examTitle, setExamTitle] = useState('');
  const [examDescription, setExamDescription] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [marksPerQuestion, setMarksPerQuestion] = useState('');
  const [duration, setDuration] = useState('');
  const [passingPercentage, setPassingPercentage] = useState('50');

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-[#4B5320]">Loading...</div>
      </div>
    );
  }

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
    router.push('/dashboard');
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      alert('Please select a Word document');
      return;
    }

    if (!examTitle || !totalQuestions || !marksPerQuestion || !duration) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('examTitle', examTitle);
      formData.append('examDescription', examDescription);
      formData.append('totalQuestions', totalQuestions);
      formData.append('marksPerQuestion', marksPerQuestion);
      formData.append('duration', duration);
      formData.append('passingPercentage', passingPercentage);

      const response = await fetch('/api/admin/questions/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload questions');
      }

      const result = await response.json();
      
      alert(`${result.message}\n\nExam ID: ${result.exam.id}\nTotal Questions: ${result.exam.totalQuestions}\nTotal Marks: ${result.exam.totalMarks}\nDuration: ${result.exam.duration} minutes`);
      
      // Reset form
      setFile(null);
      setExamTitle('');
      setExamDescription('');
      setTotalQuestions('');
      setMarksPerQuestion('');
      setDuration('');
      setPassingPercentage('50');
      
      // Redirect to appropriate dashboard
      router.push(session?.user.role === 'STAFF' ? '/dashboard/staff' : '/dashboard/admin');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to upload questions');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1E8]">
      <header className="bg-[#4B5320] text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Upload Questions from Word</h1>
            <p className="text-sm opacity-90">Import exam questions from a Word document</p>
          </div>
          <Link
            href={session?.user.role === 'STAFF' ? '/dashboard/staff' : '/dashboard/admin'}
            className="bg-white text-[#4B5320] px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-4xl">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="font-bold text-blue-900 mb-3">📋 Document Format Instructions</h2>
          <div className="text-sm text-blue-800 space-y-2">
            <p>Your Word document should follow this format:</p>
            <div className="bg-white p-4 rounded border border-blue-300 font-mono text-xs mt-2">
              <p>1. What is the capital of France?</p>
              <p>A. London</p>
              <p>B. Berlin</p>
              <p>C. Paris*</p>
              <p>D. Madrid</p>
              <p className="mt-2">2. Which planet is known as the Red Planet?</p>
              <p>A. Mars*</p>
              <p>B. Venus</p>
              <p>C. Jupiter</p>
              <p>D. Saturn</p>
            </div>
            <ul className="list-disc list-inside mt-3 space-y-1">
              <li>Number questions sequentially (1., 2., 3., etc.)</li>
              <li>Use A., B., C., D. for options</li>
              <li><strong>Mark the correct answer with an asterisk (*)</strong></li>
              <li>All questions will have equal marks (specified below)</li>
            </ul>
          </div>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-[#4B5320] mb-6">Exam Details</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Word Document *
              </label>
              <input
                type="file"
                accept=".doc,.docx"
                onChange={handleFileChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
                required
              />
              {file && (
                <p className="text-sm text-green-600 mt-2">✓ {file.name}</p>
              )}
            </div>

            {/* Exam Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Title *
              </label>
              <input
                type="text"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
                placeholder="e.g., Mathematics Mid-Term Exam"
                required
              />
            </div>

            {/* Exam Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Description (Optional)
              </label>
              <textarea
                value={examDescription}
                onChange={(e) => setExamDescription(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
                rows={3}
                placeholder="Brief description of the exam"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Total Questions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Number of Questions *
                </label>
                <input
                  type="number"
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
                  placeholder="e.g., 50"
                  min="1"
                  required
                />
              </div>

              {/* Marks Per Question */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marks Per Question *
                </label>
                <input
                  type="number"
                  value={marksPerQuestion}
                  onChange={(e) => setMarksPerQuestion(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
                  placeholder="e.g., 2"
                  min="1"
                  required
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (Minutes) *
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
                  placeholder="e.g., 60"
                  min="1"
                  required
                />
              </div>

              {/* Passing Percentage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passing Percentage *
                </label>
                <input
                  type="number"
                  value={passingPercentage}
                  onChange={(e) => setPassingPercentage(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
                  placeholder="e.g., 50"
                  min="1"
                  max="100"
                  required
                />
              </div>
            </div>

            {/* Calculated Summary */}
            {totalQuestions && marksPerQuestion && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h3 className="font-medium text-gray-700 mb-2">📊 Calculated Summary</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Total Marks:</strong> {parseInt(totalQuestions) * parseInt(marksPerQuestion)}</p>
                  <p><strong>Passing Marks:</strong> {Math.ceil((parseInt(totalQuestions) * parseInt(marksPerQuestion) * parseInt(passingPercentage)) / 100)}</p>
                  <p><strong>Duration:</strong> {duration || '?'} minutes</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-[#4B5320] text-white rounded-md hover:bg-[#3d4419] transition-colors disabled:opacity-50 font-semibold"
              >
                {isSubmitting ? 'Uploading...' : 'Upload and Create Exam'}
              </button>
              <Link
                href={session?.user.role === 'STAFF' ? '/dashboard/staff' : '/dashboard/admin'}
                className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors font-semibold text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

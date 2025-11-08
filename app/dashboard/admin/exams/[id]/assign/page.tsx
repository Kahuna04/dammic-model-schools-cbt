'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const CLASS_LEVELS = ['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3'];

export default function AssignExamPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [examTitle, setExamTitle] = useState('');
  const [examStatus, setExamStatus] = useState('DRAFT');
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && (session.user.role === 'ADMIN' || session.user.role === 'STAFF')) {
      fetchExam();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session]);

  const fetchExam = async () => {
    try {
      const response = await fetch(`/api/admin/exams/${params.id}/assign`);
      if (response.ok) {
        const exam = await response.json();
        setExamTitle(exam.title);
        setExamStatus(exam.status);
        setAssignedClasses(exam.assignedTo || []);
        setStartTime(exam.startTime ? new Date(exam.startTime).toISOString().slice(0, 16) : '');
        setEndTime(exam.endTime ? new Date(exam.endTime).toISOString().slice(0, 16) : '');
      }
    } catch (error) {
      console.error('Failed to fetch exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassToggle = (classLevel: string) => {
    setAssignedClasses(prev => {
      if (prev.includes(classLevel)) {
        return prev.filter(c => c !== classLevel);
      } else {
        return [...prev, classLevel];
      }
    });
  };

  const handleSelectAll = () => {
    if (assignedClasses.length === CLASS_LEVELS.length) {
      setAssignedClasses([]);
    } else {
      setAssignedClasses([...CLASS_LEVELS]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (assignedClasses.length === 0) {
      alert('Please select at least one class');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/exams/${params.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTo: assignedClasses,
          status: examStatus,
          startTime: startTime || null,
          endTime: endTime || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update exam');
      }

      alert('Exam updated successfully!');
      router.push('/dashboard/admin');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-[#4B5320]">Loading...</div>
      </div>
    );
  }

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F4F1E8]">
      <header className="bg-[#4B5320] text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Assign Exam to Classes</h1>
            <p className="text-sm opacity-90">{examTitle}</p>
          </div>
          <Link
            href="/dashboard/admin"
            className="bg-white text-[#4B5320] px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Exam Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Status *
              </label>
              <select
                value={examStatus}
                onChange={(e) => setExamStatus(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
                required
              >
                <option value="DRAFT">Draft (Not visible to students)</option>
                <option value="PUBLISHED">Published (Visible to assigned classes)</option>
                <option value="ARCHIVED">Archived (No longer available)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Only published exams are visible to students
              </p>
            </div>

            {/* Class Selection */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Assign to Classes *
                </label>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sm text-[#4B5320] hover:underline"
                >
                  {assignedClasses.length === CLASS_LEVELS.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CLASS_LEVELS.map(classLevel => (
                  <label
                    key={classLevel}
                    className={`flex items-center p-3 border-2 rounded-md cursor-pointer transition-colors ${
                      assignedClasses.includes(classLevel)
                        ? 'border-[#4B5320] bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={assignedClasses.includes(classLevel)}
                      onChange={() => handleClassToggle(classLevel)}
                      className="mr-2"
                    />
                    <span className="font-medium">{classLevel}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Selected: {assignedClasses.length} {assignedClasses.length === 1 ? 'class' : 'classes'}
              </p>
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for immediate availability
              </p>
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for no deadline
              </p>
            </div>

            {/* Summary */}
            {assignedClasses.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="font-medium text-blue-900 mb-2">📋 Assignment Summary</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Status:</strong> {examStatus}</p>
                  <p><strong>Assigned to:</strong> {assignedClasses.join(', ')}</p>
                  <p><strong>Start Time:</strong> {startTime ? new Date(startTime).toLocaleString() : 'Immediate'}</p>
                  <p><strong>End Time:</strong> {endTime ? new Date(endTime).toLocaleString() : 'No deadline'}</p>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-[#4B5320] text-white rounded-md hover:bg-[#3d4419] transition-colors disabled:opacity-50 font-semibold"
              >
                {isSubmitting ? 'Saving...' : 'Save Assignment'}
              </button>
              <Link
                href="/dashboard/admin"
                className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors font-semibold text-center flex items-center justify-center"
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

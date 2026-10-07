'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  DashboardHeader,
  StatusBadge,
  DataTable,
  Column,
} from '@/components/dashboard';
import { ClassLevel } from '@prisma/client';
import { PROMOTION_MAP } from '@/lib/promotion';

interface CandidateStudent {
  id: string;
  name: string;
  email: string | null;
  studentId: string | null;
  classLevel: ClassLevel | null;
  stats: {
    totalExams: number;
    passedCount: number;
    avgPercentage: number | null;
    isRecommended: boolean;
  };
}

const CLASS_LEVELS: ClassLevel[] = ['SSS3', 'SSS2', 'SSS1', 'JSS3', 'JSS2', 'JSS1'];

export default function StudentPromotionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedClass, setSelectedClass] = useState<ClassLevel>('SSS3'); // Default to SSS3 to encourage senior-first promotion
  const [students, setStudents] = useState<CandidateStudent[]>([]);
  const [decisions, setDecisions] = useState<Record<string, 'PROMOTE' | 'REPEAT'>>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Confirmation dialog state
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (
      session?.user.role !== 'STAFF' &&
      session?.user.role !== 'ADMIN'
    ) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session) {
      fetchStudents(selectedClass);
    }
  }, [session, selectedClass]);

  const fetchStudents = async (cls: ClassLevel) => {
    setLoading(true);
    setSuccessMessage('');
    try {
      const response = await fetch(`/api/staff/students/promotion-candidates?class=${cls}`);
      if (response.ok) {
        const data: CandidateStudent[] = await response.json();
        setStudents(data);

        // Initialize promotion decisions to PROMOTE by default for all students
        const initialDecisions: Record<string, 'PROMOTE' | 'REPEAT'> = {};
        data.forEach((student) => {
          initialDecisions[student.id] = 'PROMOTE';
        });
        setDecisions(initialDecisions);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecisionChange = (studentId: string, action: 'PROMOTE' | 'REPEAT') => {
    setDecisions((prev) => ({ ...prev, [studentId]: action }));
  };

  const handlePromoteAll = () => {
    const allPromote: Record<string, 'PROMOTE' | 'REPEAT'> = {};
    students.forEach((s) => (allPromote[s.id] = 'PROMOTE'));
    setDecisions(allPromote);
  };

  const handleRepeatAll = () => {
    const allRepeat: Record<string, 'PROMOTE' | 'REPEAT'> = {};
    students.forEach((s) => (allRepeat[s.id] = 'REPEAT'));
    setDecisions(allRepeat);
  };

  const handlePromoteConfirm = async () => {
    setShowConfirm(false);
    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const studentPromotions = Object.entries(decisions).map(([studentId, action]) => ({
        studentId,
        action,
      }));

      const response = await fetch('/api/staff/students/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentPromotions,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to promote students');
      }

      const result = await response.json();
      setSuccessMessage(result.message);
      fetchStudents(selectedClass);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to promote students');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextClass = PROMOTION_MAP[selectedClass];
  const promotedCount = Object.values(decisions).filter((d: string) => d === 'PROMOTE').length;
  const repeatedCount = Object.values(decisions).filter((d: string) => d === 'REPEAT').length;

  const columns: Column<CandidateStudent>[] = [
    {
      header: 'Student Name',
      accessor: (s) => (
        <div>
          <span className="font-semibold text-gray-900 block">{s.name}</span>
          <span className="text-xs text-gray-500">{s.email || 'No email'}</span>
        </div>
      ),
    },
    {
      header: 'Admission No.',
      accessor: (s) => <span className="font-mono text-xs font-semibold">{s.studentId || '-'}</span>,
    },
    {
      header: 'Exam Performance',
      accessor: (s) => {
        if (s.stats.avgPercentage === null) {
          return <span className="text-xs text-gray-400 font-medium">No Exams Taken</span>;
        }
        const badgeColor =
          s.stats.avgPercentage >= 70
            ? 'bg-green-100 text-green-800 border-green-300'
            : s.stats.avgPercentage >= 40
            ? 'bg-blue-100 text-blue-800 border-blue-300'
            : 'bg-red-100 text-red-800 border-red-300';
        return (
          <div className="flex flex-col gap-1">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor} w-fit`}>
              <span>{s.stats.avgPercentage}% Avg</span>
              <span className="text-[10px] font-normal">({s.stats.passedCount}/{s.stats.totalExams} Passed)</span>
            </span>
          </div>
        );
      },
    },
    {
      header: 'Promotion Action',
      accessor: (s) => {
        const currentDecision = decisions[s.id] || 'PROMOTE';
        return (
          <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-green-800 cursor-pointer select-none">
              <input
                type="radio"
                name={`decision-${s.id}`}
                checked={currentDecision === 'PROMOTE'}
                onChange={() => handleDecisionChange(s.id, 'PROMOTE')}
                className="w-4 h-4 text-green-600 accent-green-600 cursor-pointer"
              />
              Promote
            </label>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 cursor-pointer select-none">
              <input
                type="radio"
                name={`decision-${s.id}`}
                checked={currentDecision === 'REPEAT'}
                onChange={() => handleDecisionChange(s.id, 'REPEAT')}
                className="w-4 h-4 text-amber-600 accent-amber-600 cursor-pointer"
              />
              Repeat Class
            </label>
          </div>
        );
      },
    },
    {
      header: 'Target Status',
      accessor: (s) => {
        const action = decisions[s.id] || 'PROMOTE';
        if (action === 'REPEAT') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
              🔄 Repeat {selectedClass}
            </span>
          );
        }
        if (nextClass === 'GRADUATED') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              🎓 GRADUATED (Alumni)
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">
            ➔ Move to {nextClass}
          </span>
        );
      },
    },
  ];

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F1E8]">
        <div className="text-xl text-[#4B5320] font-semibold">Loading students for promotion...</div>
      </div>
    );
  }

  const renderStudentMobileCard = (s: CandidateStudent) => {
    const currentDecision = decisions[s.id] || 'PROMOTE';
    const badgeColor =
      s.stats.avgPercentage !== null
        ? s.stats.avgPercentage >= 70
          ? 'bg-green-100 text-green-800 border-green-300'
          : s.stats.avgPercentage >= 40
          ? 'bg-blue-100 text-blue-800 border-blue-300'
          : 'bg-red-100 text-red-800 border-red-300'
        : '';

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
        {/* Student Name & Admission ID */}
        <div className="flex justify-between items-start border-b border-gray-100 pb-2.5">
          <div>
            <p className="font-bold text-gray-900 text-base">{s.name}</p>
            <p className="text-xs text-gray-500">{s.email || 'No email'}</p>
          </div>
          {s.studentId && (
            <span className="font-mono text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded text-gray-700">
              {s.studentId}
            </span>
          )}
        </div>

        {/* Exam Performance */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400 font-semibold uppercase text-[10px]">Performance</span>
          {s.stats.avgPercentage !== null ? (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}>
              {s.stats.avgPercentage}% Avg ({s.stats.passedCount}/{s.stats.totalExams} Passed)
            </span>
          ) : (
            <span className="text-xs text-gray-400 font-medium">No Exams Taken</span>
          )}
        </div>

        {/* Promotion Action Segmented Control */}
        <div className="space-y-1.5 pt-1">
          <span className="text-gray-400 font-semibold uppercase text-[10px] block">Promotion Decision</span>
          <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => handleDecisionChange(s.id, 'PROMOTE')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                currentDecision === 'PROMOTE'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>✓</span>
              <span>Promote</span>
            </button>
            <button
              type="button"
              onClick={() => handleDecisionChange(s.id, 'REPEAT')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                currentDecision === 'REPEAT'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>🔄</span>
              <span>Repeat</span>
            </button>
          </div>
        </div>

        {/* Target Result Status */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
          <span className="text-gray-400 font-semibold uppercase text-[10px]">Target Status:</span>
          {currentDecision === 'REPEAT' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
              🔄 Repeat {selectedClass}
            </span>
          ) : nextClass === 'GRADUATED' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              🎓 GRADUATED (Alumni)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">
              ➔ Move to {nextClass}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F1E8]">
      <DashboardHeader
        title="Student Class Promotion"
        subtitle="Manage end-of-year class promotions and SSS3 graduations"
        showLogout={false}
      >
        <div className="flex gap-2">
          <Link
            href="/dashboard/admin/graduated"
            className="bg-amber-100 text-amber-900 px-4 py-2 rounded-md hover:bg-amber-200 transition-colors text-sm font-medium border border-amber-300 flex items-center gap-1.5"
          >
            <span>🎓</span> View Graduated Alumni
          </Link>
          <Link
            href={session?.user.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/staff'}
            className="bg-white text-[#4B5320] px-4 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium border border-gray-200"
          >
            Back to Dashboard
          </Link>
        </div>
      </DashboardHeader>

      <main className="container mx-auto p-6 max-w-7xl">
        {/* Success Alert Banner */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg mb-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 font-medium">
              <span className="text-xl">✅</span>
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="text-green-600 hover:text-green-800 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Promotion Order UX Banner Notice */}
        <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-900 p-4 rounded-r-lg mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h4 className="font-bold text-amber-900 text-sm sm:text-base">
                Recommended Order of Promotion (Senior Class First)
              </h4>
              <p className="text-xs sm:text-sm text-amber-800 mt-1">
                To prevent class level overlap, promote senior classes first starting with{' '}
                <span className="font-bold underline">SSS3 ➔ GRADUATED</span>. Moving SSS3 students first will archive them into the{' '}
                <Link href="/dashboard/admin/graduated" className="font-bold underline text-amber-950 hover:text-amber-800">
                  Graduated Alumni Directory
                </Link>{' '}
                so SSS2 students moving to SSS3 won&apos;t merge with them!
              </p>
            </div>
          </div>
        </div>

        {/* Class Selection & Action Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Class to Process:
              </label>
              <div className="flex flex-wrap gap-2">
                {CLASS_LEVELS.map((cls) => (
                  <button
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                      selectedClass === cls
                        ? 'bg-[#4B5320] text-white shadow-md ring-2 ring-[#4B5320]/30'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cls} {cls === 'SSS3' ? '🎓' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm text-gray-800">
              <span className="font-semibold text-gray-600">Selected Class: </span>
              <span className="font-bold text-[#4B5320] text-base">{selectedClass}</span>
              <span className="mx-2 font-bold text-gray-400">➔</span>
              <span className="font-bold text-green-700 text-base">
                {nextClass === 'GRADUATED' ? '🎓 GRADUATED (Alumni)' : nextClass}
              </span>
            </div>
          </div>
        </div>

        {/* Promotion Decision Quick Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePromoteAll}
              disabled={students.length === 0}
              className="text-xs bg-green-50 text-green-700 border border-green-300 px-3 py-1.5 rounded font-semibold hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              Set All to Promote ({promotedCount})
            </button>
            <button
              onClick={handleRepeatAll}
              disabled={students.length === 0}
              className="text-xs bg-amber-50 text-amber-700 border border-amber-300 px-3 py-1.5 rounded font-semibold hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              Set All to Repeat ({repeatedCount})
            </button>
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            disabled={students.length === 0 || isSubmitting}
            className="bg-green-600 text-white px-6 py-2.5 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 font-semibold text-sm w-full sm:w-auto shadow"
          >
            {isSubmitting
              ? 'Processing Promotions...'
              : `Submit Promotion Decisions (${students.length})`}
          </button>
        </div>

        {/* Students Table (with Mobile Cards layout) */}
        <DataTable
          columns={columns}
          data={students}
          keyExtractor={(s) => s.id}
          emptyMessage={`No active students found in ${selectedClass}`}
          minWidth="min-w-[850px]"
          renderMobileCard={renderStudentMobileCard}
        />
      </main>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        title={`Confirm Promotion for ${selectedClass}`}
        message={`Are you sure you want to process promotion decisions for ${students.length} student(s) in ${selectedClass}? ${promotedCount} will be promoted to ${
          nextClass === 'GRADUATED' ? 'GRADUATED (Alumni)' : nextClass
        } and ${repeatedCount} will repeat ${selectedClass}.`}
        onConfirm={handlePromoteConfirm}
        onCancel={() => setShowConfirm(false)}
        confirmText={`Confirm Promotions`}
      />
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DashboardHeader,
  SearchFilterBar,
  DataTable,
  Column,
  StatusBadge,
} from '@/components/dashboard';

interface Exam {
  id: string;
  title: string;
  description: string | null;
  status: string;
  duration: number;
  totalMarks: number;
  assignedTo: string[] | null;
  startTime: string | null;
  endTime: string | null;
  createdBy?: { name: string } | null;
  _count: { questions: number; submissions: number };
}

export default function AdminExamsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      fetchExams();
    }
  }, [session]);

  const fetchExams = async () => {
    try {
      const response = await fetch('/api/admin/exams');
      if (response.ok) {
        const data = await response.json();
        setExams(data);
      }
    } catch (error) {
      console.error('Failed to fetch exams:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine if an exam has completed/expired
  const isExamCompleted = (exam: Exam) => {
    if (exam.status === 'ARCHIVED') return true;
    if (exam.endTime && new Date(exam.endTime) < new Date()) return true;
    return false;
  };

  // Filtered exams logic
  const filteredExams = useMemo(() => {
    return exams.filter((exam: Exam) => {
      const now = new Date();

      // Status filtering
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'DRAFT' && exam.status !== 'DRAFT') return false;
        if (statusFilter === 'PUBLISHED') {
          // Active published exam
          if (exam.status !== 'PUBLISHED') return false;
          if (exam.endTime && new Date(exam.endTime) < now) return false;
        }
        if (statusFilter === 'COMPLETED') {
          // Completed or expired exam
          if (!isExamCompleted(exam)) return false;
        }
        if (statusFilter === 'ARCHIVED' && exam.status !== 'ARCHIVED') return false;
      }

      // Class filtering
      if (classFilter !== 'ALL') {
        const assigned = Array.isArray(exam.assignedTo) ? exam.assignedTo : [];
        if (assigned.length > 0 && !assigned.includes(classFilter)) {
          return false;
        }
      }

      // Universal search query matching across all fields
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = exam.title.toLowerCase().includes(q);
        const descMatch = exam.description?.toLowerCase().includes(q) || false;
        const authorMatch = exam.createdBy?.name?.toLowerCase().includes(q) || false;
        const statusMatch = exam.status.toLowerCase().includes(q);
        const idMatch = exam.id.toLowerCase().includes(q);
        const classMatch = Array.isArray(exam.assignedTo) && exam.assignedTo.some((c) => c.toLowerCase().includes(q));

        if (!titleMatch && !descMatch && !authorMatch && !statusMatch && !idMatch && !classMatch) {
          return false;
        }
      }

      return true;
    });
  }, [exams, statusFilter, classFilter, searchQuery]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F1E8]">
        <div className="text-xl text-[#4B5320] font-semibold">Loading exams...</div>
      </div>
    );
  }

  if (session?.user.role !== 'ADMIN') {
    return null;
  }

  const columns: Column<Exam>[] = [
    {
      header: 'Exam Title',
      accessor: (e) => (
        <div>
          <span className="font-semibold text-gray-900 block">{e.title}</span>
          {e.description && <span className="text-xs text-gray-500 line-clamp-1">{e.description}</span>}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (e) => {
        if (e.status === 'DRAFT') {
          return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">📝 DRAFT</span>;
        }
        if (isExamCompleted(e)) {
          return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-300">🏁 COMPLETED</span>;
        }
        if (e.status === 'PUBLISHED') {
          return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">🟢 PUBLISHED</span>;
        }
        return <StatusBadge status={e.status} />;
      },
    },
    {
      header: 'Target Classes',
      accessor: (e) => {
        const assigned = Array.isArray(e.assignedTo) && e.assignedTo.length > 0 ? e.assignedTo : ['ALL'];
        return (
          <div className="flex flex-wrap gap-1">
            {assigned.map((cls) => (
              <span key={cls} className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                {cls}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      header: 'Questions',
      accessor: (e) => <span className="font-semibold text-center block">{e._count.questions}</span>,
    },
    {
      header: 'Submissions',
      accessor: (e) => <span className="font-semibold text-center block">{e._count.submissions}</span>,
    },
    {
      header: 'Duration',
      accessor: (e) => <span className="text-xs text-gray-600 font-medium">{e.duration} mins</span>,
    },
    {
      header: 'Creator',
      accessor: (e) => <span className="text-xs text-gray-700 font-medium">{e.createdBy?.name || 'Unknown'}</span>,
    },
    {
      header: 'Actions',
      accessor: (e) => (
        <div className="flex gap-2 flex-wrap text-sm font-medium">
          <Link href={`/dashboard/admin/exams/${e.id}/preview`} className="text-purple-600 hover:underline">
            Preview
          </Link>
          <Link href={`/dashboard/admin/exams/${e.id}`} className="text-[#4B5320] hover:underline">
            Edit
          </Link>
          <Link href={`/dashboard/admin/exams/${e.id}/assign`} className="text-blue-600 hover:underline">
            Assign
          </Link>
          <Link href={`/dashboard/admin/exams/${e.id}/submissions`} className="text-orange-600 hover:underline">
            Submissions
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F1E8]">
      <DashboardHeader
        title="Manage Exams"
        subtitle={`Total Exams: ${exams.length}`}
        showLogout={false}
      >
        <div className="flex gap-2">
          <Link
            href="/dashboard/admin/exams/create"
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-semibold shadow-sm"
          >
            ➕ Create New Exam
          </Link>
          <Link
            href="/dashboard/admin"
            className="bg-white text-[#4B5320] px-4 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium border border-gray-200"
          >
            Back to Dashboard
          </Link>
        </div>
      </DashboardHeader>

      <main className="container mx-auto p-6 max-w-7xl">
        {/* Universal Search & Filter Bar */}
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Universal search (title, description, author, class, status)..."
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          statusOptions={[
            { label: 'Drafts', value: 'DRAFT' },
            { label: 'Published / Active', value: 'PUBLISHED' },
            { label: 'Completed / Expired', value: 'COMPLETED' },
            { label: 'Archived', value: 'ARCHIVED' },
          ]}
          classFilter={classFilter}
          onClassChange={setClassFilter}
          onClearFilters={() => {
            setSearchQuery('');
            setStatusFilter('ALL');
            setClassFilter('ALL');
          }}
          resultsCount={filteredExams.length}
          totalCount={exams.length}
        />

        {/* Exams Table */}
        <DataTable
          columns={columns}
          data={filteredExams}
          keyExtractor={(e) => e.id}
          emptyMessage="No exams match your search and filter criteria."
          minWidth="min-w-[950px]"
        />
      </main>
    </div>
  );
}

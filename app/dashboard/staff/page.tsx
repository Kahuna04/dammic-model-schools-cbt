'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDateTime } from '@/lib/date';
import {
  DashboardHeader,
  StatCard,
  QuickActionCard,
  StatusBadge,
  DataTable,
  Column,
} from '@/components/dashboard';

interface User {
  permissions: {
    can_create_exam?: boolean;
    can_grade?: boolean;
    can_manage_students?: boolean;
  } | null;
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  status: string;
  duration: number;
  totalMarks: number;
  _count: { questions: number; submissions: number };
}

interface Submission {
  id: string;
  status: string;
  totalScore: number | null;
  percentage: number | null;
  submittedAt: string | null;
  student: {
    name: string;
    studentId: string | null;
    classLevel: string | null;
  };
  exam: {
    title: string;
  };
}

export default function StaffDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [permissions, setPermissions] = useState<any>({});
  const [stats, setStats] = useState({ exams: 0, submissions: 0, pendingGrading: 0 });
  const [exams, setExams] = useState<Exam[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user.role !== 'STAFF') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [userRes, examsRes, submissionsRes] = await Promise.all([
          fetch('/api/staff/profile'),
          fetch('/api/staff/exams'),
          fetch('/api/staff/submissions/pending'),
        ]);

        let examsData: Exam[] = [];
        let submissionsData: Submission[] = [];

        if (userRes.ok) {
          const userData: User = await userRes.json();
          setPermissions(userData.permissions || {});
        } else if (userRes.status === 401) {
          router.push('/login');
          return;
        }

        if (examsRes.ok) {
          examsData = await examsRes.json();
          setExams(examsData);
        } else if (examsRes.status === 401) {
          router.push('/login');
          return;
        }

        if (submissionsRes.ok) {
          submissionsData = await submissionsRes.json();
          setPendingSubmissions(submissionsData);
        } else if (submissionsRes.status === 401) {
          router.push('/login');
          return;
        }

        setStats({
          exams: examsData.length,
          submissions: submissionsData.length,
          pendingGrading: submissionsData.length,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user.role === 'STAFF') {
      fetchDashboardData();
    }
  }, [session, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F1E8]">
        <div className="text-xl text-[#4B5320]">Loading...</div>
      </div>
    );
  }

  if (session?.user.role !== 'STAFF') {
    return null;
  }

  const pendingColumns: Column<Submission>[] = [
    {
      header: 'Student',
      accessor: (s) => (
        <div>
          <p className="font-medium">{s.student.name}</p>
          <p className="text-xs text-gray-500">{s.student.studentId}</p>
        </div>
      ),
    },
    { header: 'Class', accessor: (s) => s.student.classLevel || '-' },
    { header: 'Exam', accessor: (s) => <span className="font-medium">{s.exam.title}</span> },
    {
      header: 'Submitted',
      accessor: (s) => formatDateTime(s.submittedAt),
    },
    { header: 'Status', accessor: (s) => <StatusBadge status={s.status} /> },
    {
      header: 'Actions',
      accessor: (s) => (
        <Link
          href={`/dashboard/staff/grade/${s.id}`}
          className="text-[#4B5320] hover:underline text-sm font-medium"
        >
          Grade Now
        </Link>
      ),
    },
  ];

  const examColumns: Column<Exam>[] = [
    { header: 'Title', accessor: (e) => <span className="font-medium">{e.title}</span> },
    { header: 'Status', accessor: (e) => <StatusBadge status={e.status} /> },
    { header: 'Questions', accessor: (e) => e._count.questions },
    { header: 'Submissions', accessor: (e) => e._count.submissions },
    { header: 'Duration', accessor: (e) => `${e.duration} min` },
    {
      header: 'Actions',
      accessor: (e) => (
        <div className="flex gap-2 text-sm">
          <Link href={`/dashboard/admin/exams/${e.id}/preview`} className="text-purple-600 hover:underline">
            Preview
          </Link>
          <Link href={`/dashboard/staff/exams/${e.id}/results`} className="text-[#4B5320] hover:underline">
            Results
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F1E8]">
      <DashboardHeader title="Staff Dashboard" subtitle={`Welcome, ${session.user.name}`} />

      <main className="container mx-auto p-6 max-w-7xl">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="My Exams" value={exams.length} icon="📝" />
          <StatCard title="Total Submissions" value={stats.submissions} icon="✅" />
          <StatCard
            title="Pending Grading"
            value={pendingSubmissions.length}
            icon="⏳"
            valueColorClass="text-orange-600"
          />
        </div>

        {/* Permissions Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Your Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-blue-800">
            <div className="flex items-center gap-2">
              {permissions.can_create_exam ? '✅' : '❌'}
              <span>Create Exams</span>
            </div>
            <div className="flex items-center gap-2">
              {permissions.can_grade ? '✅' : '❌'}
              <span>Grade Submissions</span>
            </div>
            <div className="flex items-center gap-2">
              {permissions.can_manage_students ? '✅' : '❌'}
              <span>Manage Students</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-[#4B5320] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {permissions.can_create_exam && (
              <QuickActionCard
                href="/dashboard/admin/exams/create"
                icon="➕"
                title="Create Exam"
                description="Create a new exam"
              />
            )}

            {permissions.can_create_exam && (
              <QuickActionCard
                href="/dashboard/admin/upload-questions"
                icon="📄"
                title="Upload Questions"
                description="Import from Word"
              />
            )}

            {permissions.can_grade && (
              <QuickActionCard
                href="/dashboard/staff/grade"
                icon="📊"
                title="Grade Submissions"
                description="Review and grade student work"
              />
            )}

            <QuickActionCard
              href="/dashboard/staff/exams"
              icon="📋"
              title="My Exams"
              description="View all my exams"
            />

            <QuickActionCard
              href="/dashboard/staff/promote"
              icon="🚀"
              title="Promote Students"
              description="Advance students to next class"
            />

            <QuickActionCard
              href="/dashboard/admin/graduated"
              icon="🎓"
              title="Graduated Alumni"
              description="View archived SSS3 graduates"
            />
          </div>
        </div>

        {/* Pending Grading Section */}
        {permissions.can_grade && pendingSubmissions.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-[#4B5320] mb-4">
              Pending Grading ({pendingSubmissions.length})
            </h2>
            <DataTable
              columns={pendingColumns}
              data={pendingSubmissions.slice(0, 10)}
              keyExtractor={(s) => s.id}
              emptyMessage="No pending submissions to grade"
            />
            {pendingSubmissions.length > 10 && (
              <div className="text-center mt-4">
                <Link
                  href="/dashboard/staff/grade"
                  className="text-[#4B5320] hover:underline font-medium text-sm"
                >
                  View all pending submissions ({pendingSubmissions.length})
                </Link>
              </div>
            )}
          </section>
        )}

        {/* Recent Exams */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#4B5320] mb-4">My Recent Exams</h2>
          <DataTable
            columns={examColumns}
            data={exams.slice(0, 5)}
            keyExtractor={(e) => e.id}
            emptyMessage={
              permissions.can_create_exam
                ? 'No exams created yet. Create your first exam!'
                : 'No exams assigned to you yet.'
            }
          />
        </section>
      </main>
    </div>
  );
}


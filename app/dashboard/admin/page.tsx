import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  DashboardHeader,
  StatCard,
  QuickActionCard,
  StatusBadge,
  DataTable,
  Column,
  ExamsTableWithTabs,
} from '@/components/dashboard';

import { formatDate } from '@/lib/date';

interface RecentUser {
  id: string;
  name: string;
  email: string | null;
  role: string;
  createdAt: Date;
}

interface ExamOverview {
  id: string;
  title: string;
  status: string;
  createdBy: { name: string };
  _count: { questions: number; submissions: number };
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  // Fetch statistics
  const [totalUsers, totalExams, totalSubmissions, recentUsers, exams] = await Promise.all([
    prisma.user.count(),
    prisma.exam.count(),
    prisma.submission.count({ where: { status: 'SUBMITTED' } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.exam.findMany({
      include: {
        createdBy: {
          select: { name: true },
        },
        _count: {
          select: { questions: true, submissions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const userColumns: Column<RecentUser>[] = [
    { header: 'Name', accessor: (u) => <span className="font-medium">{u.name}</span> },
    { header: 'Email', accessor: (u) => u.email || '-' },
    { header: 'Role', accessor: (u) => <StatusBadge status={u.role} /> },
    { header: 'Joined', accessor: (u) => formatDate(u.createdAt) },
  ];

  const examColumns: Column<ExamOverview>[] = [
    { header: 'Title', accessor: (e) => <span className="font-medium">{e.title}</span> },
    { header: 'Status', accessor: (e) => <StatusBadge status={e.status} /> },
    { header: 'Questions', accessor: (e) => e._count.questions },
    { header: 'Submissions', accessor: (e) => e._count.submissions },
    { header: 'Created By', accessor: (e) => e.createdBy.name },
    {
      header: 'Actions',
      accessor: (e) => (
        <div className="flex gap-2 flex-wrap text-sm">
          <Link href={`/dashboard/admin/exams/${e.id}/preview`} className="text-purple-600 hover:underline">
            Preview
          </Link>
          <Link href={`/dashboard/admin/exams/${e.id}`} className="text-[#4B5320] hover:underline">
            View
          </Link>
          <Link href={`/dashboard/admin/exams/${e.id}/assign`} className="text-blue-600 hover:underline">
            Assign
          </Link>
          <Link href={`/dashboard/admin/exams/${e.id}/submissions`} className="text-orange-600 hover:underline">
            Submissions
          </Link>
          <a href={`/api/admin/exams/${e.id}/results`} className="text-green-600 hover:underline" download>
            Results
          </a>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F1E8]">
      <DashboardHeader title="Admin Dashboard" subtitle={`Welcome, ${session.user.name}`} />

      <main className="container mx-auto p-6 max-w-7xl">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total Users" value={totalUsers} icon="👥" href="/dashboard/admin/users" />
          <StatCard title="Total Exams" value={totalExams} icon="📝" href="/dashboard/admin/exams" />
          <StatCard title="Total Submissions" value={totalSubmissions} icon="✅" href="/dashboard/admin/exams" />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-[#4B5320] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              href="/dashboard/admin/users"
              icon="👤"
              title="Manage Users"
              description="Add, edit, or remove users"
            />
            <QuickActionCard
              href="/dashboard/admin/upload-questions"
              icon="📄"
              title="Upload Questions"
              description="Import from Word document"
            />
            <QuickActionCard
              href="/dashboard/admin/exams/create"
              icon="➕"
              title="Create Exam"
              description="Create a new exam"
            />
            <QuickActionCard
              href="/dashboard/admin/exams"
              icon="📋"
              title="View All Exams"
              description="Manage and view exams"
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

        {/* Recent Users */}
        <section className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-[#4B5320] mb-4">Recent Users</h2>
          <DataTable
            columns={userColumns}
            data={recentUsers}
            keyExtractor={(u) => u.id}
            emptyMessage="No users registered yet"
            minWidth="min-w-[600px]"
          />
        </section>

        {/* Exams Overview */}
        <section>
          <ExamsTableWithTabs exams={exams} title="All Exams" />
        </section>
      </main>
    </div>
  );
}


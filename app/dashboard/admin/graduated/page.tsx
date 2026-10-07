'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DashboardHeader,
  StatCard,
  SearchFilterBar,
  DataTable,
  Column,
} from '@/components/dashboard';

import { formatDate } from '@/lib/date';

interface GraduatedStudent {
  id: string;
  name: string;
  email: string | null;
  studentId: string | null;
  graduationDate: string;
  stats: {
    totalExams: number;
    passedCount: number;
    avgPercentage: number | null;
  };
}

export default function GraduatedAlumniPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [alumni, setAlumni] = useState<GraduatedStudent[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user.role !== 'ADMIN' && session?.user.role !== 'STAFF') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session) {
      fetchAlumni();
    }
  }, [session, search]);

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/graduated?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setAlumni(data);
      }
    } catch (error) {
      console.error('Failed to fetch graduated alumni:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F1E8]">
        <div className="text-xl text-[#4B5320] font-semibold">Loading graduated alumni roster...</div>
      </div>
    );
  }

  const columns: Column<GraduatedStudent>[] = [
    {
      header: 'Alumni Name',
      accessor: (a) => (
        <div>
          <span className="font-semibold text-gray-900 block">{a.name}</span>
          <span className="text-xs text-gray-500">{a.email || 'No email provided'}</span>
        </div>
      ),
    },
    {
      header: 'Admission No.',
      accessor: (a) => <span className="font-mono text-xs font-semibold">{a.studentId || '-'}</span>,
    },
    {
      header: 'Graduation Date',
      accessor: (a) => (
        <span className="text-xs text-gray-600 font-medium">
          {formatDate(a.graduationDate)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: () => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
          🎓 GRADUATED
        </span>
      ),
    },
    {
      header: 'CBT Performance',
      accessor: (a) => {
        if (a.stats.avgPercentage === null) {
          return <span className="text-xs text-gray-400 font-medium">No Exams Recorded</span>;
        }
        const color =
          a.stats.avgPercentage >= 70
            ? 'bg-green-100 text-green-800 border-green-300'
            : a.stats.avgPercentage >= 50
            ? 'bg-blue-100 text-blue-800 border-blue-300'
            : 'bg-orange-100 text-orange-800 border-orange-300';
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${color}`}>
            <span>{a.stats.avgPercentage}% Avg</span>
            <span className="text-[10px] font-normal">({a.stats.passedCount}/{a.stats.totalExams} Passed)</span>
          </span>
        );
      },
    },
  ];

  // Calculate statistics
  const totalAlumni = alumni.length;
  const passedAlumniCount = alumni.filter(
    (a) => a.stats.avgPercentage !== null && a.stats.avgPercentage >= 50
  ).length;

  return (
    <div className="min-h-screen bg-[#F4F1E8]">
      <DashboardHeader
        title="Graduated Alumni Directory"
        subtitle="Archived roster of all SSS3 graduated students"
        showLogout={false}
      >
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="bg-[#4B5320] text-white px-4 py-2 rounded-md hover:bg-[#3b4219] transition-colors text-sm font-medium shadow-sm flex items-center gap-1.5"
          >
            <span>🖨️</span> Print Roster
          </button>
          <Link
            href={session?.user.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/staff'}
            className="bg-white text-[#4B5320] px-4 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium border border-gray-200"
          >
            Back to Dashboard
          </Link>
        </div>
      </DashboardHeader>

      <main className="container mx-auto p-6 max-w-7xl">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total Graduated Alumni" value={totalAlumni} icon="🎓" />
          <StatCard title="Passed Standard CBT" value={passedAlumniCount} icon="🏆" />
          <StatCard
            title="Archived Records"
            value={totalAlumni}
            icon="📂"
            valueColorClass="text-amber-800"
          />
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchFilterBar
            searchQuery={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search alumni by name, email, or admission number..."
          />
        </div>

        {/* Alumni Table */}
        <DataTable
          columns={columns}
          data={alumni}
          keyExtractor={(a) => a.id}
          emptyMessage="No graduated alumni found."
          minWidth="min-w-[750px]"
        />
      </main>
    </div>
  );
}

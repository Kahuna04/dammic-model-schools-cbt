'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { DataTable, Column } from './DataTable';
import { StatusBadge } from './StatusBadge';

export interface ExamItem {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  duration?: number;
  totalMarks?: number;
  startTime?: string | Date | null;
  endTime?: string | Date | null;
  createdBy?: { name: string } | null;
  _count?: { questions: number; submissions: number };
}

interface ExamsTableWithTabsProps {
  exams: ExamItem[];
  title?: string;
  showCreateButton?: boolean;
}

export function ExamsTableWithTabs({
  exams,
  title = 'All Exams',
  showCreateButton = false,
}: ExamsTableWithTabsProps) {
  const [activeTab, setActiveTab] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to check if exam is completed/expired
  const isExamCompleted = (exam: ExamItem) => {
    if (exam.status === 'ARCHIVED') return true;
    if (exam.endTime && new Date(exam.endTime) < new Date()) return true;
    return false;
  };

  // Compute status counts for tab badges
  const counts = useMemo(() => {
    const now = new Date();
    let published = 0;
    let draft = 0;
    let archived = 0;

    exams.forEach((e) => {
      if (e.status === 'DRAFT') {
        draft++;
      } else if (e.status === 'ARCHIVED' || (e.endTime && new Date(e.endTime) < now)) {
        archived++;
      } else if (e.status === 'PUBLISHED') {
        published++;
      }
    });

    return {
      all: exams.length,
      published,
      draft,
      archived,
    };
  }, [exams]);

  // Filter exams based on activeTab & searchQuery
  const filteredExams = useMemo(() => {
    const now = new Date();
    return exams.filter((e) => {
      // Tab status filter
      if (activeTab === 'PUBLISHED') {
        if (e.status !== 'PUBLISHED') return false;
        if (e.endTime && new Date(e.endTime) < now) return false;
      } else if (activeTab === 'DRAFT') {
        if (e.status !== 'DRAFT') return false;
      } else if (activeTab === 'ARCHIVED') {
        if (!isExamCompleted(e)) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = e.title.toLowerCase().includes(q);
        const descMatch = e.description?.toLowerCase().includes(q) || false;
        const authorMatch = e.createdBy?.name?.toLowerCase().includes(q) || false;
        const statusMatch = e.status.toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !authorMatch && !statusMatch) {
          return false;
        }
      }

      return true;
    });
  }, [exams, activeTab, searchQuery]);

  const columns: Column<ExamItem>[] = [
    {
      header: 'Title',
      accessor: (e) => (
        <div>
          <span className="font-semibold text-gray-900 block">{e.title}</span>
          {e.description && (
            <span className="text-xs text-gray-500 line-clamp-1">{e.description}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (e) => {
        if (e.status === 'DRAFT') {
          return (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
              📝 DRAFT
            </span>
          );
        }
        if (isExamCompleted(e)) {
          return (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-300">
              🏁 COMPLETED
            </span>
          );
        }
        if (e.status === 'PUBLISHED') {
          return (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">
              🟢 PUBLISHED
            </span>
          );
        }
        return <StatusBadge status={e.status} />;
      },
    },
    {
      header: 'Questions',
      accessor: (e) => (
        <span className="font-semibold text-[#4B5320]">{e._count?.questions ?? 0}</span>
      ),
    },
    {
      header: 'Submissions',
      accessor: (e) => (
        <span className="font-semibold text-blue-700">{e._count?.submissions ?? 0}</span>
      ),
    },
    {
      header: 'Created By',
      accessor: (e) => e.createdBy?.name || 'Unknown',
    },
    {
      header: 'Actions',
      accessor: (e) => (
        <div className="flex gap-2.5 flex-wrap text-xs font-medium">
          <Link
            href={`/dashboard/admin/exams/${e.id}/preview`}
            className="text-purple-600 hover:text-purple-800 hover:underline"
          >
            Preview
          </Link>
          <Link
            href={`/dashboard/admin/exams/${e.id}`}
            className="text-[#4B5320] hover:text-[#383e18] hover:underline"
          >
            View
          </Link>
          <Link
            href={`/dashboard/admin/exams/${e.id}/assign`}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            Assign
          </Link>
          <Link
            href={`/dashboard/admin/exams/${e.id}/submissions`}
            className="text-orange-600 hover:text-orange-800 hover:underline"
          >
            Submissions
          </Link>
          <a
            href={`/api/admin/exams/${e.id}/results`}
            className="text-green-600 hover:text-green-800 hover:underline"
            download
          >
            Results
          </a>
        </div>
      ),
    },
  ];

  const tabs = [
    { id: 'ALL', label: 'All Exams', count: counts.all, color: 'bg-gray-100 text-gray-700' },
    { id: 'PUBLISHED', label: 'Published / Active', count: counts.published, color: 'bg-green-100 text-green-800' },
    { id: 'DRAFT', label: 'Drafts', count: counts.draft, color: 'bg-yellow-100 text-yellow-800' },
    { id: 'ARCHIVED', label: 'Archived / Expired', count: counts.archived, color: 'bg-gray-200 text-gray-800' },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-[#4B5320]">{title}</h2>
        {showCreateButton && (
          <Link
            href="/dashboard/admin/exams/create"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold shadow-sm flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>Create New Exam</span>
          </Link>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#4B5320] text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? 'bg-white/20 text-white' : tab.color
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exams by title, author, or status..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4B5320] focus:bg-white transition-colors"
          />
          <span className="absolute left-3.5 top-3 text-gray-400 text-sm">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-2.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-200 px-2 py-1 rounded"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table & Mobile Cards */}
      <DataTable
        columns={columns}
        data={filteredExams}
        keyExtractor={(e) => e.id}
        emptyMessage={`No exams found in "${activeTab === 'ALL' ? 'All' : activeTab}" tab.`}
        minWidth="min-w-[850px]"
      />
    </div>
  );
}

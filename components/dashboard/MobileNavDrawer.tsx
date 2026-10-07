'use client';

import React from 'react';
import Link from 'next/link';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  role?: string;
  userName?: string;
}

export function MobileNavDrawer({ isOpen, onClose, role, userName }: MobileNavDrawerProps) {
  if (!isOpen) return null;

  const links = [
    { label: '📊 Dashboard Overview', href: role === 'STUDENT' ? '/dashboard/student' : role === 'STAFF' ? '/dashboard/staff' : '/dashboard/admin' },
    ...(role === 'ADMIN'
      ? [
          { label: '👥 Manage Users', href: '/dashboard/admin/users' },
          { label: '📝 Manage Exams', href: '/dashboard/admin/exams' },
          { label: '➕ Create Exam', href: '/dashboard/admin/exams/create' },
          { label: '📄 Upload Questions', href: '/dashboard/admin/upload-questions' },
          { label: '🚀 Promote Students', href: '/dashboard/staff/promote' },
          { label: '🎓 Graduated Alumni', href: '/dashboard/admin/graduated' },
        ]
      : []),
    ...(role === 'STAFF'
      ? [
          { label: '📋 View Exams', href: '/dashboard/staff' },
          { label: '🚀 Student Promotion', href: '/dashboard/staff/promote' },
        ]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex md:hidden animate-fade-in">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Slide Drawer */}
      <div className="relative ml-auto w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col p-5 space-y-6 z-10">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Menu</h3>
            {userName && <p className="text-xs text-gray-500 line-clamp-1">{userName}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 p-2 text-xl font-bold rounded-lg hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="block px-3.5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-[#4B5320]/10 hover:text-[#4B5320] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="pt-4 border-t border-gray-100">
          <Link
            href="/api/auth/signout"
            className="block text-center w-full py-2.5 bg-red-50 text-red-700 font-semibold text-sm rounded-lg hover:bg-red-100 transition-colors"
          >
            Logout
          </Link>
        </div>
      </div>
    </div>
  );
}

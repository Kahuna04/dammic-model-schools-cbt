'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { MobileNavDrawer } from './MobileNavDrawer';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  showLogout?: boolean;
  children?: React.ReactNode;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  showLogout = true,
  children,
}) => {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#4B5320]/95 text-white shadow-md border-b border-[#3d4419]">
        <div className="container mx-auto px-4 py-3 max-w-7xl">
          <div className="flex justify-between items-center gap-3">
            {/* Title & Subtitle */}
            <div className="flex items-center gap-3">
              {session?.user?.name && (
                <div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-bold text-xs shadow-inner shrink-0">
                  {getInitials(session.user.name)}
                </div>
              )}
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">{title}</h1>
                {subtitle && <p className="text-xs sm:text-sm text-white/80 line-clamp-1">{subtitle}</p>}
              </div>
            </div>

            {/* Actions & User Profile */}
            <div className="flex items-center gap-2">
              {session?.user?.role && (
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/15 text-white border border-white/20 uppercase tracking-wider">
                  {session.user.role}
                </span>
              )}

              {/* Mobile Drawer Trigger */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden bg-white/15 hover:bg-white/25 p-2 rounded-lg text-white font-bold text-sm transition-colors"
                aria-label="Open Navigation Menu"
              >
                🍔 Menu
              </button>

              {/* Desktop Logout Button */}
              {showLogout && (
                <Link
                  href="/api/auth/signout"
                  className="hidden md:inline-block bg-white text-[#4B5320] px-3.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-xs font-semibold shadow-sm"
                >
                  Logout
                </Link>
              )}
            </div>
          </div>

          {/* Additional Action Children Bar */}
          {children && (
            <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap gap-2 items-center">
              {children}
            </div>
          )}
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileNavDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        role={session?.user?.role}
        userName={session?.user?.name || undefined}
      />
    </>
  );
};

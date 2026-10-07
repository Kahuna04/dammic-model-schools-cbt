import React from 'react';
import Link from 'next/link';

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
  return (
    <header className="bg-[#4B5320] text-white p-4 shadow-md">
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
            {subtitle && <p className="text-xs sm:text-sm opacity-90">{subtitle}</p>}
          </div>
          {showLogout && (
            <Link
              href="/api/auth/signout"
              className="bg-white text-[#4B5320] px-4 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium self-start sm:self-auto"
            >
              Logout
            </Link>
          )}
        </div>
        {children && <div className="mt-3 flex flex-wrap gap-2">{children}</div>}
      </div>
    </header>
  );
};

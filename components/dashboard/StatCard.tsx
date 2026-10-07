'use client';

import React from 'react';
import Link from 'next/link';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  valueColorClass?: string;
  subtitle?: string;
  href?: string;
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  valueColorClass = 'text-[#4B5320]',
  subtitle,
  href,
  trend,
}) => {
  const CardContent = (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-gray-500 text-xs sm:text-sm font-semibold tracking-wide uppercase">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${valueColorClass}`}>{value}</p>
            {trend && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {trend}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-gray-400 font-medium">{subtitle}</p>}
        </div>
        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200 shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {CardContent}
      </Link>
    );
  }

  return CardContent;
};

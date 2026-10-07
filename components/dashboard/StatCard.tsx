import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  valueColorClass?: string;
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  valueColorClass = 'text-[#4B5320]',
  subtitle,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className={`text-3xl font-bold ${valueColorClass}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className="text-4xl select-none">{icon}</div>
      </div>
    </div>
  );
};

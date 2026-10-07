import React from 'react';

type StatusType =
  | 'ADMIN'
  | 'STAFF'
  | 'STUDENT'
  | 'PUBLISHED'
  | 'DRAFT'
  | 'ARCHIVED'
  | 'SUBMITTED'
  | 'IN_PROGRESS'
  | 'GRADED'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  // Roles
  ADMIN: 'bg-red-100 text-red-700 border-red-200',
  STAFF: 'bg-blue-100 text-blue-700 border-blue-200',
  STUDENT: 'bg-green-100 text-green-700 border-green-200',
  
  // Exam statuses
  PUBLISHED: 'bg-green-100 text-green-700 border-green-200',
  DRAFT: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  ARCHIVED: 'bg-gray-100 text-gray-700 border-gray-200',
  
  // Submission statuses
  SUBMITTED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
  GRADED: 'bg-green-100 text-green-700 border-green-200',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className = '',
}) => {
  const normalizedStatus = status ? status.toUpperCase() : '';
  const style = statusStyles[normalizedStatus] || 'bg-gray-100 text-gray-700 border-gray-200';
  const displayLabel = label || status;

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${style} ${className}`}
    >
      {displayLabel}
    </span>
  );
};

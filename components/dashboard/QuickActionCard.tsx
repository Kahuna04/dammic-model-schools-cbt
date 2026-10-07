import React from 'react';
import Link from 'next/link';

interface QuickActionCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  href,
  icon,
  title,
  description,
}) => {
  return (
    <Link
      href={href}
      className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all text-center block group hover:-translate-y-0.5 border border-transparent hover:border-gray-200"
    >
      <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="font-semibold text-[#4B5320] group-hover:text-[#3d4419]">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </Link>
  );
};

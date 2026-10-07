import React from 'react';

interface FilterOption {
  label: string;
  value: string;
}

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  roleFilter?: string;
  onRoleChange?: (value: string) => void;
  classFilter?: string;
  onClassChange?: (value: string) => void;
  classOptions?: string[];
  statusFilter?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: FilterOption[];
  onClearFilters?: () => void;
  resultsCount?: number;
  totalCount?: number;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  roleFilter,
  onRoleChange,
  classFilter,
  onClassChange,
  classOptions = ['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3'],
  statusFilter,
  onStatusChange,
  statusOptions,
  onClearFilters,
  resultsCount,
  totalCount,
}) => {
  const hasActiveFilters =
    searchQuery ||
    (roleFilter && roleFilter !== 'ALL') ||
    (classFilter && classFilter !== 'ALL') ||
    (statusFilter && statusFilter !== 'ALL');

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none text-sm"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-end">
        {onRoleChange && roleFilter !== undefined && (
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
            <select
              value={roleFilter}
              onChange={(e) => onRoleChange(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none text-sm"
            >
              <option value="ALL">All Roles</option>
              <option value="STUDENT">Students</option>
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>
        )}

        {onClassChange && classFilter !== undefined && (
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Class</label>
            <select
              value={classFilter}
              onChange={(e) => onClassChange(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none text-sm"
            >
              <option value="ALL">All Classes</option>
              {classOptions.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
        )}

        {onStatusChange && statusFilter !== undefined && statusOptions && (
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none text-sm"
            >
              <option value="ALL">All Statuses</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {onClearFilters && hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-xs text-red-600 hover:text-red-800 font-medium py-2.5 px-3 border border-red-200 rounded-md hover:bg-red-50 transition-colors w-full sm:w-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {(resultsCount !== undefined || totalCount !== undefined) && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
          <span>
            Showing <strong>{resultsCount ?? 0}</strong> {totalCount !== undefined ? `of ${totalCount}` : ''} results
          </span>
        </div>
      )}
    </div>
  );
};

import React from 'react';

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  minWidth?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data available',
  minWidth = 'min-w-[700px]',
}: DataTableProps<T>) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className={`w-full ${minWidth}`}>
          <thead className="bg-[#4B5320] text-white">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-4 py-3 text-left font-semibold text-sm ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={keyExtractor(item)} className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors">
                  {columns.map((col, idx) => {
                    let cellContent: React.ReactNode = null;
                    if (typeof col.accessor === 'function') {
                      cellContent = col.accessor(item);
                    } else if (col.accessor) {
                      cellContent = item[col.accessor] as unknown as React.ReactNode;
                    }
                    return (
                      <td key={idx} className={`px-4 py-3 text-sm ${col.className || ''}`}>
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React from 'react';

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  minWidth?: string;
  renderMobileCard?: (item: T) => React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data available',
  minWidth = 'min-w-[700px]',
  renderMobileCard,
}: DataTableProps<T>) {
  const getCellValue = (col: Column<T>, item: T): React.ReactNode => {
    if (typeof col.accessor === 'function') {
      return col.accessor(item);
    }
    if (col.accessor) {
      return item[col.accessor] as unknown as React.ReactNode;
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Mobile Card View (hidden on md and larger) */}
      <div className="block md:hidden">
        {data.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm font-medium">
            {emptyMessage}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 p-3 space-y-3">
            {data.map((item) => {
              if (renderMobileCard) {
                return (
                  <div key={keyExtractor(item)}>
                    {renderMobileCard(item)}
                  </div>
                );
              }

              // Default auto-generated card from columns
              const titleCol = columns[0];
              const statusCol = columns.find(
                (c) =>
                  c.header.toLowerCase() === 'status' ||
                  c.header.toLowerCase() === 'role'
              );
              const actionCol = columns.find(
                (c) => c.header.toLowerCase() === 'actions'
              );
              const bodyCols = columns.filter(
                (c, idx) =>
                  idx !== 0 &&
                  c !== statusCol &&
                  c !== actionCol &&
                  !c.hideOnMobile
              );

              return (
                <div
                  key={keyExtractor(item)}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3 hover:border-[#4B5320]/40 transition-colors"
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start gap-2 border-b border-gray-100 pb-2.5">
                    <div className="font-semibold text-gray-900 text-base">
                      {titleCol ? getCellValue(titleCol, item) : null}
                    </div>
                    {statusCol && (
                      <div className="shrink-0">{getCellValue(statusCol, item)}</div>
                    )}
                  </div>

                  {/* Card Body - Key Value Grid */}
                  {bodyCols.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      {bodyCols.map((col, idx) => (
                        <div key={idx} className="flex flex-col gap-0.5">
                          <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                            {col.header}
                          </span>
                          <span className="text-gray-800 font-medium">
                            {getCellValue(col, item)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Card Actions Footer */}
                  {actionCol && (
                    <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-end gap-2">
                      {getCellValue(actionCol, item)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Table View (hidden on mobile, shown on md and larger) */}
      <div className="hidden md:block overflow-x-auto">
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
                  {columns.map((col, idx) => (
                    <td key={idx} className={`px-4 py-3 text-sm ${col.className || ''}`}>
                      {getCellValue(col, item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

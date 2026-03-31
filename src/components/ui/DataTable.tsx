import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  onRowClick,
  isLoading,
  emptyMessage = "No records found.",
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center border border-primary-100 dark:border-primary-800 rounded bg-white dark:bg-surface-900">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-900 rounded-full animate-spin" />
          <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">Loading Data...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center border border-primary-100 dark:border-primary-800 rounded bg-white dark:bg-surface-900">
        <span className="text-sm text-primary-400 font-medium uppercase tracking-tight">{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto border border-primary-100 dark:border-primary-800 rounded shadow-sm bg-white dark:bg-surface-900">
      <table className="w-full text-left border-collapse text-sm">
        <thead className="bg-primary-50 dark:bg-surface-800 border-b border-primary-100 dark:border-primary-800">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-4 py-3 text-[10px] font-bold text-primary-500 dark:text-primary-400 uppercase tracking-widest whitespace-nowrap ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-primary-50 dark:divide-primary-800">
          {data.map((item) => (
            <tr
              key={item.id}
              onClick={() => onRowClick?.(item)}
              className={`group transition-colors ${onRowClick ? 'cursor-pointer hover:bg-primary-50/50 dark:hover:bg-primary-800/30' : ''}`}
            >
              {columns.map((col, idx) => (
                <td
                  key={idx}
                  className={`px-4 py-3 text-primary-800 dark:text-primary-200 ${col.className || ''}`}
                >
                  {typeof col.accessor === 'function'
                    ? col.accessor(item)
                    : (item[col.accessor] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

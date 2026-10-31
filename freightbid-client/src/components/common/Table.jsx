import React from 'react';

export const Table = ({
  columns,
  data = [],
  rowKey = '_id',
  loading = false,
  emptyMessage = 'No records found',
  onRowClick = null,
  rowClassName = null,
  borderless = false,
  className = ''
}) => {
  return (
    <div
      className={`w-full overflow-x-auto ${
        borderless ? '' : 'rounded-2xl border border-brand-border bg-white shadow-xs'
      } ${className}`}
    >
      <table className="w-full text-left text-sm text-brand-text-secondary border-collapse">
        <thead className="bg-brand-bg-secondary text-[11px] font-bold text-brand-text-secondary uppercase tracking-wider border-b border-brand-border">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                className={`py-3.5 px-6 first:pl-7 last:pr-7 whitespace-nowrap ${
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                } ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border/70 font-normal">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="py-12 px-6 text-center text-brand-text-muted">
                <div className="flex items-center justify-center gap-2.5">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
                  />
                  <span className="text-xs font-medium">Loading data...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 px-6 text-center text-brand-text-muted text-xs">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => {
              const key = typeof rowKey === 'function' ? rowKey(row) : row[rowKey] || rowIdx;
              const customClass = typeof rowClassName === 'function' ? rowClassName(row, rowIdx) : '';
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors duration-150 hover:bg-brand-bg-secondary/60 ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${customClass}`}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.key || colIdx}
                      className={`py-4 px-6 first:pl-7 last:pr-7 ${
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      } ${col.cellClassName || ''}`}
                    >
                      {col.render ? col.render(row, rowIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;

import React from 'react';

export const Table = ({
  columns,
  data = [],
  rowKey = '_id',
  loading = false,
  emptyMessage = 'No records found',
  onRowClick = null,
  rowClassName = null
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <table className="w-full text-left text-sm text-slate-600 border-collapse">
        <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/70">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                className={`py-3.5 px-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-normal">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                  <span>Loading data...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-slate-400">
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
                  className={`transition-colors duration-150 hover:bg-slate-50/80 ${onRowClick ? 'cursor-pointer' : ''} ${customClass}`}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.key || colIdx}
                      className={`py-3.5 px-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.cellClassName || ''}`}
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

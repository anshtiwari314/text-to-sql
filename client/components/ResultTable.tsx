interface ResultTableProps {
  columns: string[];
  rows: Record<string, unknown>[];
  truncated?: boolean;
}

/** Shows the rows Flask returned, in a scrollable table. */
export default function ResultTable({ columns, rows, truncated }: ResultTableProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-400 px-4 py-3">Query ran successfully but returned no rows.</p>;
  }

  return (
    <div className="overflow-x-auto max-h-80 overflow-y-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-900/80 sticky top-0">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-3 py-2 font-bold text-slate-300 whitespace-nowrap">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-slate-800 hover:bg-slate-900/50">
              {columns.map((column) => (
                <td key={column} className="px-3 py-2 text-slate-400 whitespace-nowrap">
                  {row[column] === null ? <span className="text-slate-600 italic">null</span> : String(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {truncated && (
        <p className="text-xs text-amber-400 px-3 py-2 border-t border-slate-800">
          Showing only the first {rows.length} rows (row limit reached).
        </p>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Database, ChevronDown, Table2, Loader2 } from "lucide-react";
import { DatabaseConnection } from "@/types";

interface DatabaseSchemasViewProps {
  databases: DatabaseConnection[];
  /** DB whose schemas are shown (card click or load action). */
  focusDbId: string | null;
  schemaTables: { name: string; ddl: string }[];
  schemaRaw: string | null;
  isLoading: boolean;
  error: string | null;
  onSelectDatabaseCard: (db: DatabaseConnection) => void;
}

export default function DatabaseSchemasView({
  databases,
  focusDbId,
  schemaTables,
  schemaRaw,
  isLoading,
  error,
  onSelectDatabaseCard,
}: DatabaseSchemasViewProps) {
  const focusDb = databases.find((d) => d.id === focusDbId) ?? null;
  const [selectedTable, setSelectedTable] = useState<string>("");

  const tableNames = useMemo(() => schemaTables.map((t) => t.name), [schemaTables]);

  useEffect(() => {
    if (tableNames.length && !tableNames.includes(selectedTable)) {
      setSelectedTable(tableNames[0]);
    }
  }, [tableNames, selectedTable]);

  const activeTable =
    schemaTables.find((t) => t.name === selectedTable) ??
    schemaTables[0] ??
    null;

  return (
    <div className="p-10 max-w-6xl mx-auto w-full animate-in fade-in duration-300">
      <div className="mb-8 border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-200 tracking-tight">Schemas</h1>
        <p className="text-slate-400 mt-2 text-sm">
          Pick a database card, then choose a table to view its CREATE TABLE definition.
        </p>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        {isLoading && (
          <p className="mt-3 flex items-center gap-2 text-sm text-indigo-400">
            <Loader2 size={16} className="animate-spin" /> Loading schema from Flask…
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {databases.map((db) => (
          <button
            key={db.id}
            type="button"
            onClick={() => onSelectDatabaseCard(db)}
            className={`text-left bg-slate-900 border rounded-2xl p-6 min-h-[160px] transition-all ${
              focusDbId === db.id ? "border-emerald-500/50 ring-1 ring-emerald-500/30" : "border-slate-800 hover:border-indigo-500"
            }`}
          >
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit mb-3">
              <Database size={22} />
            </div>
            <h3 className="font-bold text-lg text-slate-200">{db.name}</h3>
            <p className="text-xs text-slate-400 mt-1">
              {db.engine} • {db.host}
            </p>
            {focusDbId === db.id && schemaTables.length > 0 && (
              <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 mt-3">
                {schemaTables.length} tables loaded
              </p>
            )}
          </button>
        ))}
      </div>

      {focusDb && schemaTables.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Table2 size={18} className="text-indigo-400" />
              {focusDb.name}
            </div>
            <div className="relative md:ml-auto min-w-[240px]">
              <select
                value={activeTable?.name ?? ""}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full appearance-none bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50"
              >
                {schemaTables.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <pre className="text-sm font-mono text-indigo-200 bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap">
            {activeTable?.ddl ?? schemaRaw}
          </pre>
        </div>
      )}

      {focusDb && !isLoading && schemaTables.length === 0 && !error && (
        <p className="text-slate-500 text-sm">Click a database card above to load its tables.</p>
      )}
    </div>
  );
}

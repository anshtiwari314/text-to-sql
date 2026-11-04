import { Database, Plus, ChevronRight, Server, Check, Loader2, AlertCircle, Settings } from "lucide-react";
import { DatabaseConnection } from "@/types";

interface DatabaseListProps {
  databases: DatabaseConnection[];
  onAddNew: () => void;
  /** Select & load schema - verifies the connection, then opens the chat */
  onSelectDb: (db: DatabaseConnection) => void;
  /** Open the details page to edit the configuration */
  onConfigureDb: (db: DatabaseConnection) => void;
  /** true while Flask is connecting and reading the schema */
  isConnecting: boolean;
  /** error text if the connection failed */
  connectError: string | null;
  /** id of the database whose schema is loaded (= the chat's database) */
  activeDbId: string | null;
}

/**
 * "Select & load schema"  -> /api/schema (Next) -> Flask /api/schema, then the chat opens.
 * "Configure"             -> the details page, where the connection can be edited.
 */
export default function DatabaseList({
  databases,
  onAddNew,
  onSelectDb,
  onConfigureDb,
  isConnecting,
  connectError,
  activeDbId,
}: DatabaseListProps) {
  return (
    <div className="p-10 max-w-6xl mx-auto w-full animate-in fade-in duration-300">
      <div className="mb-8 border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-200 tracking-tight">Data Sources</h1>
        <p className="text-slate-400 mt-2 text-sm">Select a database to verify the connection and load its schema.</p>

        {isConnecting && (
          <p className="mt-4 flex items-center gap-2 text-sm font-medium text-indigo-400">
            <Loader2 size={16} className="animate-spin" /> Connecting and reading the schema from Flask...
          </p>
        )}
        {connectError && (
          <p className="mt-4 flex items-center gap-2 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
            <AlertCircle size={16} /> {connectError}
          </p>
        )}
        {!isConnecting && !connectError && activeDbId && (
          <p className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-400">
            <Check size={16} /> Database connected - schema loaded. Open the chat to ask questions.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Add New Card */}
        <button
          onClick={onAddNew}
          className="group relative border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-500 hover:bg-slate-800 hover:text-indigo-400 transition-all duration-300 min-h-[180px] shadow-sm"
        >
          <div className="bg-slate-800 p-3 rounded-full shadow-sm group-hover:shadow-md transition-all mb-3 text-slate-400 group-hover:text-indigo-400">
            <Plus size={28} />
          </div>
          <span className="font-semibold text-sm">Connect New Source</span>
        </button>

        {/* Existing Database Cards */}
        {databases.map((db) => (
          <div
            key={db.id}
            className={`group relative bg-slate-900 border rounded-2xl p-6 flex flex-col items-start justify-between min-h-[180px] transition-all duration-300 shadow-sm ${
              activeDbId === db.id ? "border-emerald-500/50" : "border-slate-800 hover:border-indigo-500"
            }`}
          >
            <div className="w-full">
              <div className="flex items-center justify-between mb-4 w-full">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <Database size={22} />
                </div>
                {/* Configure opens the details page; it never starts a chat */}
                <button
                  onClick={() => onConfigureDb(db)}
                  title="Edit configuration"
                  className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                >
                  <Settings size={16} />
                </button>
              </div>
              <h3 className="font-bold text-lg text-slate-200 mb-1">{db.name}</h3>
              <div className="flex items-center text-xs font-medium text-slate-400 gap-2">
                <Server size={12} />
                <span>{db.engine} • {db.host}</span>
              </div>
              {activeDbId === db.id && (
                <span className="inline-block mt-3 text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Loaded in chat
                </span>
              )}
            </div>

            <button
              onClick={() => onSelectDb(db)}
              disabled={isConnecting}
              className="w-full mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-sm text-indigo-400 font-semibold hover:text-indigo-300 disabled:opacity-60"
            >
              Select &amp; load schema
              <ChevronRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

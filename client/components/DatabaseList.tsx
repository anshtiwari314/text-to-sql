import { Database, Plus, Server, Loader2, AlertCircle } from "lucide-react";
import { DatabaseConnection } from "@/types";

interface DatabaseListProps {
  databases: DatabaseConnection[];
  onAddNew: () => void;
  onOpenConfiguration: (db: DatabaseConnection) => void;
  isConnecting: boolean;
  connectError: string | null;
}

/** Configuration screen. Schemas live under Database → Schemas in the sidebar. */
export default function DatabaseList({
  databases,
  onAddNew,
  onOpenConfiguration,
  isConnecting,
  connectError,
}: DatabaseListProps) {
  return (
    <div className="p-10 max-w-6xl mx-auto w-full">
      <div className="mb-8 border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-200">Configuration</h1>
        <p className="text-slate-400 mt-2 text-sm">Add a source or click a card to edit its connection.</p>
        {isConnecting && (
          <p className="mt-4 flex items-center gap-2 text-sm text-indigo-400">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </p>
        )}
        {connectError && (
          <p className="mt-4 flex items-center gap-2 text-sm text-red-400">
            <AlertCircle size={16} /> {connectError}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button
          onClick={onAddNew}
          className="border-2 border-dashed border-slate-700 rounded-2xl p-6 min-h-[180px] text-slate-400 hover:border-indigo-500 flex flex-col items-center justify-center"
        >
          <Plus size={28} className="mb-3" />
          Connect New Source
        </button>
        {databases.map((db) => (
          <button
            key={db.id}
            type="button"
            onClick={() => onOpenConfiguration(db)}
            className="text-left bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-2xl p-6 min-h-[180px]"
          >
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit mb-3">
              <Database size={22} />
            </div>
            <h3 className="font-bold text-lg text-slate-200">{db.name}</h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <Server size={12} /> {db.engine} • {db.host}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

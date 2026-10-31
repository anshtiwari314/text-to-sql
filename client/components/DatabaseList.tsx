import { Database, Plus, ChevronRight, Server } from "lucide-react";
import { DatabaseConnection, ViewState } from "@/types";

interface DatabaseListProps {
  databases: DatabaseConnection[];
  onAddNew: () => void;
  onSelectDb: (db: DatabaseConnection) => void;
}

export default function DatabaseList({ databases, onAddNew, onSelectDb }: DatabaseListProps) {
  return (
    <div className="p-10 max-w-6xl mx-auto w-full animate-in fade-in duration-300">
      <div className="mb-8 border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Data Sources</h1>
        <p className="text-slate-500 mt-2 text-sm">Manage your connected databases and data warehouses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Add New Card */}
        <button 
          onClick={onAddNew}
          className="group relative border-2 border-dashed border-slate-300 bg-slate-50 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-500 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-300 min-h-[180px] shadow-sm"
        >
          <div className="bg-white p-3 rounded-full shadow-sm group-hover:shadow-md transition-all mb-3 text-slate-400 group-hover:text-indigo-500">
            <Plus size={28} />
          </div>
          <span className="font-semibold text-sm">Connect New Source</span>
        </button>

        {/* Existing Database Cards */}
        {databases.map((db) => (
          <button 
            key={db.id}
            onClick={() => onSelectDb(db)}
            className="group relative bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-start justify-between text-left min-h-[180px] hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-900/5 transition-all duration-300"
          >
            <div className="w-full">
              <div className="flex items-center justify-between mb-4 w-full">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Database size={22} />
                </div>
                {db.readOnly && (
                  <span className="text-[10px] uppercase tracking-wider font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Read Only</span>
                )}
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">{db.name}</h3>
              <div className="flex items-center text-xs font-medium text-slate-500 gap-2">
                <Server size={12} />
                <span>{db.engine} • {db.host}</span>
              </div>
            </div>

            <div className="w-full mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm text-indigo-600 font-semibold group-hover:text-indigo-700">
              Configure
              <ChevronRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
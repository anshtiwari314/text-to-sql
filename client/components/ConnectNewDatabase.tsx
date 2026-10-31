import { useState } from "react";
import { Database, Server, Cloud, ArrowLeft } from "lucide-react";

interface ConnectNewDatabaseProps {
  onBack: () => void;
  onSuccess: () => void; 
}

export default function ConnectNewDatabase({ onBack, onSuccess }: ConnectNewDatabaseProps) {
  const [step, setStep] = useState<"engine" | "hosting">("engine");
  const [engine, setEngine] = useState<string | null>(null);
  const [host, setHost] = useState<string | null>(null);

  if (step === "engine") {
    return (
      <div className="p-10 max-w-4xl mx-auto w-full animate-in slide-in-from-right-4 duration-300">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 font-medium mb-8 hover:text-indigo-600 transition-colors">
          <ArrowLeft size={16} /> Back to Databases
        </button>
        
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Select Engine</h1>
        <p className="text-slate-500 mb-10 text-lg">Choose the database provider you want to connect to.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["PostgreSQL", "MySQL", "SQLite", "SQL Server"].map((dbEngine) => (
            <button 
              key={dbEngine}
              onClick={() => { setEngine(dbEngine); setStep("hosting"); }}
              className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center hover:border-indigo-400 hover:ring-4 hover:ring-indigo-50 transition-all shadow-sm"
            >
              <Database size={40} className="text-slate-700 mb-4" />
              <span className="font-bold text-slate-800">{dbEngine}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-3xl mx-auto w-full animate-in slide-in-from-right-4 duration-300">
      <button onClick={() => setStep("engine")} className="flex items-center gap-2 text-sm text-slate-500 font-medium mb-8 hover:text-indigo-600 transition-colors">
        <ArrowLeft size={16} /> Back to Engines
      </button>
      
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">Where is your {engine} hosted?</h1>
      
      <div className="flex flex-wrap gap-3 mb-10">
        {["Locally", "Supabase", "AWS", "Azure"].map((hostOption) => (
          <button 
            key={hostOption}
            onClick={() => setHost(hostOption)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${
              host === hostOption 
                ? "bg-slate-900 text-white shadow-md ring-2 ring-slate-900 ring-offset-2" 
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {hostOption === "Locally" ? <Server size={14} className="inline mr-2"/> : <Cloud size={14} className="inline mr-2"/>}
            {hostOption}
          </button>
        ))}
      </div>

      {host && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5 animate-in fade-in">
          <h3 className="font-bold text-lg text-slate-900 mb-2">Connection Details</h3>
          
          <div>
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Connection Name</label>
             <input type="text" placeholder="e.g., Production DB" className="w-full border border-slate-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white" />
          </div>
          
          <div>
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Host</label>
             <input type="text" placeholder={host === "Locally" ? "localhost" : "db.example.com"} className="w-full border border-slate-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white" />
          </div>
          
          <div className="flex gap-4">
            <div className="w-1/2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Username</label>
               <input type="text" placeholder="postgres" className="w-full border border-slate-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white" />
            </div>
            <div className="w-1/2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Password</label>
               <input type="password" placeholder="••••••••" className="w-full border border-slate-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white" />
            </div>
          </div>
          
          <button 
            onClick={onSuccess}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-3.5 rounded-xl font-bold hover:from-indigo-700 hover:to-violet-700 shadow-md shadow-indigo-200 mt-6 transition-all transform hover:-translate-y-0.5"
          >
            Save Connection
          </button>
        </div>
      )}
    </div>
  );
}
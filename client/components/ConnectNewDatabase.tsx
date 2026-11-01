"use client";

import { useState } from "react";
import { Database, Server, Cloud, ArrowLeft, Loader2 } from "lucide-react";

interface ConnectNewDatabaseProps {
  onBack: () => void;
  onSuccess: () => void; 
}

export default function ConnectNewDatabase({ onBack, onSuccess }: ConnectNewDatabaseProps) {
  const [step, setStep] = useState<"engine" | "hosting">("engine");
  const [engine, setEngine] = useState<string | null>(null);
  const [hostType, setHostType] = useState<string | null>(null);
  
  // Form State mapping exactly to your backend API
  const [connName, setConnName] = useState("");
  const [hostUrl, setHostUrl] = useState("");
  const [port, setPort] = useState("");
  const [dbUsername, setDbUsername] = useState("");
  const [dbPassword, setDbPassword] = useState("");
  const [dbName, setDbName] = useState("");
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveConnection = async () => {
    if (!connName || !hostUrl || !dbUsername || !dbPassword || !dbName) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conn_name: connName,
          engine: engine,
          host: hostUrl,
          port: parseInt(port) || 5432, // Default to 5432 if empty
          db_username: dbUsername,
          db_password: dbPassword,
          db_name: dbName
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save connection");
      }

      // Automatically route back to the database list on success
      onSuccess();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // STEP 1: SELECT ENGINE
  // ==========================================
  if (step === "engine") {
    return (
      <div className="p-10 max-w-4xl mx-auto w-full animate-in slide-in-from-right-4 duration-300">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-400 font-medium mb-8 hover:text-indigo-400 transition-colors">
          <ArrowLeft size={16} /> Back to Databases
        </button>
        
        <h1 className="text-3xl font-extrabold text-slate-200 tracking-tight mb-3">Select Engine</h1>
        <p className="text-slate-400 mb-10 text-lg">Choose the database provider you want to connect to.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["PostgreSQL", "MySQL", "SQLite", "SQL Server"].map((dbEngine) => (
            <button 
              key={dbEngine}
              onClick={() => { setEngine(dbEngine); setStep("hosting"); }}
              className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center hover:border-indigo-500 hover:bg-slate-800 transition-all shadow-sm group"
            >
              <Database size={40} className="text-slate-500 mb-4 group-hover:text-indigo-400 transition-colors" />
              <span className="font-bold text-slate-300 group-hover:text-slate-200">{dbEngine}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ==========================================
  // STEP 2: SELECT HOSTING & ENTER CREDENTIALS
  // ==========================================
  return (
    <div className="p-10 max-w-3xl mx-auto w-full animate-in slide-in-from-right-4 duration-300 pb-32">
      <button onClick={() => setStep("engine")} className="flex items-center gap-2 text-sm text-slate-400 font-medium mb-8 hover:text-indigo-400 transition-colors">
        <ArrowLeft size={16} /> Back to Engines
      </button>
      
      <h1 className="text-3xl font-extrabold text-slate-200 tracking-tight mb-8">Where is your {engine} hosted?</h1>
      
      <div className="flex flex-wrap gap-3 mb-10">
        {["Locally", "Supabase", "AWS", "Azure"].map((option) => (
          <button 
            key={option}
            onClick={() => setHostType(option)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${
              hostType === option 
                ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-500/50 ring-offset-2 ring-offset-slate-950" 
                : "bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 hover:text-slate-300"
            }`}
          >
            {option === "Locally" ? <Server size={14} className="inline mr-2"/> : <Cloud size={14} className="inline mr-2"/>}
            {option}
          </button>
        ))}
      </div>

      {hostType && (
        <div className="bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl border border-slate-800 shadow-xl space-y-5 animate-in fade-in">
          <h3 className="font-bold text-lg text-slate-200 mb-2 border-b border-slate-800 pb-3">Connection Details</h3>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Connection Name</label>
               <input 
                 value={connName} onChange={(e) => setConnName(e.target.value)}
                 type="text" placeholder="e.g., Production AWS DB" 
                 className="w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-600 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all" 
               />
            </div>
            
            <div className="col-span-2 sm:col-span-1">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Host URL</label>
               <input 
                 value={hostUrl} onChange={(e) => setHostUrl(e.target.value)}
                 type="text" placeholder={hostType === "Locally" ? "localhost" : "db.example.com"} 
                 className="w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-600 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all" 
               />
            </div>

            <div className="col-span-2 sm:col-span-1">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Port</label>
               <input 
                 value={port} onChange={(e) => setPort(e.target.value)}
                 type="number" placeholder="5432" 
                 className="w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-600 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all" 
               />
            </div>

            <div className="col-span-2">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Database Name</label>
               <input 
                 value={dbName} onChange={(e) => setDbName(e.target.value)}
                 type="text" placeholder="postgres" 
                 className="w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-600 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all" 
               />
            </div>
            
            <div className="col-span-2 sm:col-span-1">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Username</label>
               <input 
                 value={dbUsername} onChange={(e) => setDbUsername(e.target.value)}
                 type="text" placeholder="admin" 
                 className="w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-600 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all" 
               />
            </div>

            <div className="col-span-2 sm:col-span-1">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Password</label>
               <input 
                 value={dbPassword} onChange={(e) => setDbPassword(e.target.value)}
                 type="password" placeholder="••••••••" 
                 className="w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-600 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all" 
               />
            </div>
          </div>
          
          <button 
            onClick={handleSaveConnection}
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-indigo-500 shadow-md shadow-indigo-900/20 mt-6 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
            {isLoading ? "Saving..." : "Test Connection & Save"}
          </button>
        </div>
      )}
    </div>
  );
}
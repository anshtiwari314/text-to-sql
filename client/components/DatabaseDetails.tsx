"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, Settings } from "lucide-react";
import { DatabaseConnection } from "../types";

interface DatabaseDetailsProps {
  db: DatabaseConnection;
  onBack: () => void;
  /** id of the database currently connected to the chat */
  activeDbId: string | null;
  /** called after a successful save so the list can refresh */
  onSaved: () => void;
}

/**
 * Edit a saved connection. Reached from the "Configure" gear on a database card,
 * so it never starts a chat - saving keeps you here.
 */
export default function DatabaseDetails({ db, onBack, activeDbId, onSaved }: DatabaseDetailsProps) {
  // Empty password = keep the saved one (we never send passwords to the browser)
  const [form, setForm] = useState({
    conn_name: db.name,
    engine: db.engine,
    host: db.host,
    port: db.port?.toString() ?? "",
    db_name: db.db_name ?? "",
    db_username: "",
    db_password: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/databases/${db.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conn_name: form.conn_name,
          engine: form.engine,
          host: form.host,
          port: form.port ? parseInt(form.port) : null,
          db_name: form.db_name,
          db_username: form.db_username || null,
          db_password: form.db_password || null, // empty -> keeps the old password
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save");

      setMessage({ type: "ok", text: "Saved. Click 'Select & load schema' to test the new settings." });
      onSaved();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Could not save" });
    } finally {
      setIsSaving(false);
    }
  };

  const field = "w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-600 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all";
  const label = "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block";

  return (
    <div className="p-10 max-w-3xl mx-auto w-full animate-in fade-in duration-300">
      <button onClick={onBack} className="text-sm text-slate-400 mb-6 hover:text-indigo-400 transition-colors flex items-center gap-2">
        <ArrowLeft size={16} /> Back to Data Sources
      </button>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-200 tracking-tight">{db.name}</h1>
          <p className="text-slate-400 mt-1">
            {db.engine} hosted on {db.host}
            {activeDbId === db.id && <span className="text-emerald-400"> • connected to chat</span>}
          </p>
        </div>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl border border-slate-800 shadow-xl space-y-5">
        <h3 className="font-bold text-lg text-slate-200 mb-2 border-b border-slate-800 pb-3 flex items-center gap-2">
          <Settings size={18} className="text-indigo-400" /> Configuration
        </h3>

        {message && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium border ${
            message.type === "ok"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-2 gap-5">
          <div className="col-span-2">
            <label className={label}>Connection Name</label>
            <input value={form.conn_name} onChange={update("conn_name")} className={field} />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className={label}>Engine</label>
            <select value={form.engine} onChange={update("engine")} className={field}>
              {["PostgreSQL", "MySQL", "SQL Server"].map((engine) => (
                <option key={engine} value={engine}>{engine}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className={label}>Host</label>
            <input value={form.host} onChange={update("host")} className={field} />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className={label}>Port</label>
            <input value={form.port} onChange={update("port")} type="number" placeholder="5432" className={field} />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className={label}>Database Name</label>
            <input value={form.db_name} onChange={update("db_name")} className={field} />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className={label}>Username</label>
            <input value={form.db_username} onChange={update("db_username")} placeholder="leave empty to keep current" className={field} />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className={label}>Password</label>
            <input
              value={form.db_password}
              onChange={update("db_password")}
              type="password"
              placeholder="leave empty to keep current"
              className={field}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-indigo-500 shadow-md shadow-indigo-900/20 mt-2 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isSaving && <Loader2 size={18} className="animate-spin" />}
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

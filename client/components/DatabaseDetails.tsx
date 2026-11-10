"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, Settings } from "lucide-react";
import { DatabaseConnection } from "../types";
import DatabaseConnectionForm from "@/components/DatabaseConnectionForm";
import { useSyncedConnectionFields } from "@/lib/useSyncedConnectionFields";

interface DatabaseDetailsProps {
  db: DatabaseConnection;
  onBack: () => void;
  activeDbId: string | null;
  onSaved: () => void;
}

export default function DatabaseDetails({ db, onBack, activeDbId, onSaved }: DatabaseDetailsProps) {
  const { fields, setField, connectionUrl, onConnectionUrlChange, urlParseError } = useSyncedConnectionFields({
    engine: db.engine,
    host: db.host,
    port: db.port?.toString() ?? "",
    db_name: db.db_name ?? "",
    db_username: db.db_username ?? "",
    db_password: "",
  });

  const [connName, setConnName] = useState(db.name);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/databases/${db.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conn_name: connName,
          engine: fields.engine,
          host: fields.host,
          port: fields.port ? parseInt(fields.port, 10) : null,
          db_name: fields.db_name,
          db_username: fields.db_username || null,
          db_password: fields.db_password || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save");

      setMessage({ type: "ok", text: "Saved. Reload schema to test." });
      onSaved();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Could not save" });
    } finally {
      setIsSaving(false);
    }
  };

  const label = "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block";
  const field =
    "w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-600 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all";

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
          <div
            className={`px-4 py-3 rounded-xl text-sm font-medium border ${
              message.type === "ok"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        <div>
          <label className={label}>Connection name</label>
          <input value={connName} onChange={(e) => setConnName(e.target.value)} className={field} />
        </div>

        <p className="text-sm text-slate-500">Leave username/password blank to keep saved credentials — paste a full URL to replace all fields.</p>

        <DatabaseConnectionForm
          fields={fields}
          setField={setField}
          connectionUrl={connectionUrl}
          onConnectionUrlChange={onConnectionUrlChange}
          urlParseError={urlParseError}
          showEngineSelect
          usernamePlaceholder="leave empty to keep current"
          passwordPlaceholder="leave empty to keep current"
        />

        <button
          onClick={handleSave}
          disabled={isSaving || !!urlParseError}
          className="w-full bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-indigo-500 shadow-md shadow-indigo-900/20 mt-2 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isSaving && <Loader2 size={18} className="animate-spin" />}
          {isSaving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}

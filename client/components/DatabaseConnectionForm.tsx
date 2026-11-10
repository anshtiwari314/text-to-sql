"use client";

import PasswordInput from "./PasswordInput";
import { ConnectionFields } from "@/lib/buildDatabaseUrl";

const field =
  "w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-600 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all";
const label = "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block";

type Props = {
  fields: ConnectionFields;
  setField: (key: keyof ConnectionFields, value: string) => void;
  connectionUrl: string;
  onConnectionUrlChange: (url: string) => void;
  urlParseError: string | null;
  showEngineSelect?: boolean;
  hostPlaceholder?: string;
  usernamePlaceholder?: string;
  passwordPlaceholder?: string;
  connectionUrlPlaceholder?: string;
};

const NGROK_URL_PLACEHOLDER = "mysql://user:password@0.tcp.in.ngrok.io:24026/dbname";

export default function DatabaseConnectionForm({
  fields,
  setField,
  connectionUrl,
  onConnectionUrlChange,
  urlParseError,
  showEngineSelect = false,
  hostPlaceholder = "localhost",
  usernamePlaceholder = "admin",
  passwordPlaceholder = "",
  connectionUrlPlaceholder = NGROK_URL_PLACEHOLDER,
}: Props) {
  const engines = ["PostgreSQL", "MySQL", "SQLite", "SQL Server"];

  return (
    <div className="grid grid-cols-2 gap-5">
      {showEngineSelect && (
        <div className="col-span-2 sm:col-span-1">
          <label className={label}>Engine</label>
          <select
            value={fields.engine}
            onChange={(e) => setField("engine", e.target.value)}
            className={field}
          >
            {engines.map((engine) => (
              <option key={engine} value={engine}>
                {engine}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={showEngineSelect ? "col-span-2 sm:col-span-1" : "col-span-2 sm:col-span-1"}>
        <label className={label}>Host</label>
        <input
          type="text"
          value={fields.host}
          onChange={(e) => setField("host", e.target.value)}
          placeholder={hostPlaceholder}
          className={field}
        />
      </div>

      <div className="col-span-2 sm:col-span-1">
        <label className={label}>Port</label>
        <input
          type="number"
          value={fields.port}
          onChange={(e) => setField("port", e.target.value)}
          placeholder="5432"
          className={field}
        />
      </div>

      <div className="col-span-2 sm:col-span-1">
        <label className={label}>Database name</label>
        <input
          type="text"
          value={fields.db_name}
          onChange={(e) => setField("db_name", e.target.value)}
          placeholder="postgres"
          className={field}
        />
      </div>

      <div className="col-span-2 sm:col-span-1">
        <label className={label}>Username</label>
        <input
          type="text"
          value={fields.db_username}
          onChange={(e) => setField("db_username", e.target.value)}
          placeholder={usernamePlaceholder}
          autoComplete="username"
          className={field}
        />
      </div>

      <div className="col-span-2 sm:col-span-1">
        <label className={label}>Password</label>
        <PasswordInput
          value={fields.db_password}
          onChange={(v) => setField("db_password", v)}
          placeholder={passwordPlaceholder}
          className={field}
        />
      </div>

      <div className="col-span-2">
        <label className={label}>Connection URL</label>
        <textarea
          value={connectionUrl}
          onChange={(e) => onConnectionUrlChange(e.target.value)}
          rows={2}
          placeholder={connectionUrlPlaceholder}
          className={`${field} font-mono text-sm`}
        />
        {urlParseError ? (
          <p className="text-xs text-amber-400 mt-1.5">{urlParseError} — finish editing or fix the URL.</p>
        ) : (
          <p className="text-xs text-slate-500 mt-1.5">
            URL stays in sync with the fields above. For ngrok use the public port from the ngrok UI (not 3306).
          </p>
        )}
      </div>
    </div>
  );
}

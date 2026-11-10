"use client";

import { useCallback, useEffect, useState } from "react";
import { LogOut, User, Database, ChevronDown, Check, Zap } from "lucide-react";
import { signOut } from "next-auth/react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { toggleSelectedDb } from "@/store/appSlice";

type QuotaState = {
  used: number;
  limit: number;
  remaining: number | null;
  isAdmin: boolean;
};

interface HeaderProps {
  user?: { name?: string | null; email?: string | null; image?: string | null; };
}

export default function Header({ user }: HeaderProps) {
  const dispatch = useDispatch();
  const databases = useSelector((state: RootState) => state.app.connectedDatabases);
  const selectedDbs = useSelector((state: RootState) => state.app.selectedDbIds);
  const [isDbDropdownOpen, setIsDbDropdownOpen] = useState(false);
  const [quota, setQuota] = useState<QuotaState | null>(null);

  const loadQuota = useCallback(() => {
    fetch("/api/query-quota")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.limit === "number") setQuota(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadQuota();
    const onRefresh = () => loadQuota();
    window.addEventListener("query-quota-refresh", onRefresh);
    return () => window.removeEventListener("query-quota-refresh", onRefresh);
  }, [loadQuota]);

  return (
    <header className="relative z-30 flex h-16 w-full shrink-0 items-center justify-between border-b border-slate-800/60 bg-slate-950/70 px-8 shadow-sm backdrop-blur-lg">
      <div className="relative">
        <button
          onClick={() => setIsDbDropdownOpen(!isDbDropdownOpen)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-200 transition-colors shadow-sm"
        >
          <Database size={16} className="text-indigo-400" />
          <span>{selectedDbs.length} Database{selectedDbs.length !== 1 ? "s" : ""} Selected</span>
          <ChevronDown size={14} className="text-slate-500 ml-1" />
        </button>

        {isDbDropdownOpen && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
            <div className="px-3 pb-2 mb-2 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Query Scope
            </div>
            {databases.map((db) => (
              <label
                key={db.id}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 cursor-pointer transition-colors"
                onClick={() => dispatch(toggleSelectedDb(db.id.toString()))}
              >
                <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${
                    selectedDbs.includes(db.id.toString()) ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-600 bg-slate-900"
                  }`}>
                  {selectedDbs.includes(db.id.toString()) && <Check size={12} strokeWidth={3} />}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-200">{db.name}</div>
                  <div className="text-xs text-slate-400">{db.engine}</div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
      {quota && !quota.isAdmin && quota.remaining !== null && (
        <div
          className="flex items-center gap-2 rounded-lg border border-indigo-500/25 bg-indigo-500/10 px-3 py-1.5 text-sm font-semibold text-indigo-300"
          title={`${quota.used} of ${quota.limit} queries used`}
        >
          <Zap size={14} className="text-cyan-400" />
          <span>
            {quota.remaining} query{quota.remaining !== 1 ? "ies" : ""} left
          </span>
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex flex-col items-end text-sm">
          <span className="font-bold text-slate-200">{user?.name || "User"}</span>
          <span className="text-xs text-slate-400">{user?.email}</span>
        </div>

        {user?.image ? (
          <img
            src={user.image}
            alt="Profile"
            className="w-10 h-10 rounded-full border-2 border-slate-800 shadow-sm object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-800 text-indigo-400 flex items-center justify-center border border-slate-700 shadow-sm">
            <User size={20} />
          </div>
        )}
      </div>

      <div className="h-8 w-px bg-slate-800 mx-2"></div>

      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-slate-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-950/50 flex items-center gap-2 text-sm font-bold"
        title="Sign Out"
      >
        <LogOut size={18} />
        <span className="hidden md:inline">Sign out</span>
      </button>
      </div>
    </header>
  );
}


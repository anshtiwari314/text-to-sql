"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Calendar, Database, ChevronRight, Loader2 } from "lucide-react";
import { SavedChatSummary } from "@/types";

interface ChatHistoryProps {
  onSelectChat: (chatId: string) => void;
}

export default function ChatHistory({ onSelectChat }: ChatHistoryProps) {
  const [chats, setChats] = useState<SavedChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/chats")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setChats(data.chats ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="p-10 max-w-5xl mx-auto w-full animate-in fade-in duration-300">
      <div className="mb-8 border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-200 tracking-tight">Chat History</h1>
        <p className="text-slate-400 mt-2 text-sm">Saved in your app Postgres — continue any past conversation.</p>
      </div>

      {loading && (
        <p className="flex items-center gap-2 text-slate-400">
          <Loader2 className="animate-spin" size={18} /> Loading…
        </p>
      )}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && !error && chats.length === 0 && (
        <p className="text-slate-500 text-sm">No chats yet. Start one from New Chat.</p>
      )}

      <div className="flex flex-col gap-4">
        {chats.map((chat) => (
          <button
            key={chat.id}
            type="button"
            onClick={() => onSelectChat(chat.id)}
            className="group flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-indigo-500/50 text-left w-full"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-800 text-indigo-400 rounded-lg">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-200 group-hover:text-indigo-300">{chat.title}</h3>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Database size={14} /> {chat.db_name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} /> {formatDate(chat.updated_at || chat.created_at)}
                  </span>
                </div>
              </div>
            </div>
            <span className="mt-4 md:mt-0 flex items-center text-sm font-semibold text-indigo-400">
              Continue <ChevronRight size={16} className="ml-1" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

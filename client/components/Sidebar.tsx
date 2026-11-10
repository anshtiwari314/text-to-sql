import { useState } from "react";
import { Database, MessageSquare, Zap, ChevronDown, ChevronRight, Plus, History } from "lucide-react";
import { ViewState } from "@/types";

interface SidebarProps {
  activeView: ViewState;
  setActiveView: (view: ViewState) => void;
}

export default function Sidebar({ activeView, setActiveView }: SidebarProps) {
  const [isChatDropdownOpen, setIsChatDropdownOpen] = useState(true);
  const [isDbOpen, setIsDbOpen] = useState(true);
  const isChatActive = activeView === "chat" || activeView === "chat_history";
  const isDbActive =
    activeView === "db_list" || activeView === "db_schemas" || activeView === "new_db" || activeView === "db_details";

  return (
    <aside className="z-20 flex w-64 flex-col border-r border-slate-800/60 bg-slate-950 shadow-xl">
      <div className="flex items-center gap-2 border-b border-slate-800/60 p-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 text-white">
          <Zap size={18} />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">
          Query<span className="text-indigo-400">AI</span>
        </span>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {/* Chat Dropdown Parent */}
        <div>
          <button 
            onClick={() => setIsChatDropdownOpen(!isChatDropdownOpen)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
              isChatActive 
                ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare size={18} /> Chat
            </div>
            {isChatDropdownOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {/* Dropdown Children */}
          {isChatDropdownOpen && (
            <div className="mt-1 flex flex-col gap-1 pl-4 border-l-2 border-slate-800 ml-4 mb-2">
              <button 
                onClick={() => setActiveView("chat")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm font-medium ${
                  activeView === "chat" ? "text-indigo-400 bg-slate-800" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                }`}
              >
                <Plus size={14} /> New Chat
              </button>
              <button 
                onClick={() => setActiveView("chat_history")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm font-medium ${
                  activeView === "chat_history" ? "text-indigo-400 bg-slate-800" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                }`}
              >
                <History size={14} /> History
              </button>
            </div>
          )}
        </div>
        
        <div>
          <button
            onClick={() => setIsDbOpen(!isDbOpen)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
              isDbActive
                ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent"
            }`}
          >
            <span className="flex items-center gap-3">
              <Database size={18} /> Database
            </span>
            {isDbOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {isDbOpen && (
            <div className="mt-1 flex flex-col gap-1 pl-4 border-l-2 border-slate-800 ml-4">
              <button
                onClick={() => setActiveView("db_list")}
                className={`px-3 py-2 rounded-md text-sm text-left ${
                  activeView === "db_list" || activeView === "new_db" || activeView === "db_details"
                    ? "text-indigo-400 bg-slate-800"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Configuration
              </button>
              <button
                onClick={() => setActiveView("db_schemas")}
                className={`px-3 py-2 rounded-md text-sm text-left ${
                  activeView === "db_schemas" ? "text-indigo-400 bg-slate-800" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Schemas
              </button>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
import { useState } from "react";
import { Database, MessageSquare, Zap, ChevronDown, ChevronRight, Plus, History } from "lucide-react";
import { ViewState } from "@/types";

interface SidebarProps {
  activeView: ViewState;
  setActiveView: (view: ViewState) => void;
}

export default function Sidebar({ activeView, setActiveView }: SidebarProps) {
  const [isChatDropdownOpen, setIsChatDropdownOpen] = useState(true);

  const isChatActive = activeView === "chat" || activeView === "chat_history";

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shadow-xl z-20">
      <div className="p-5 border-b border-slate-800 flex items-center gap-2">
        <div className="bg-gradient-to-br from-indigo-500 to-violet-500 p-1.5 rounded-lg text-white">
          <Zap size={20} />
        </div>
        <span className="font-bold text-xl text-white tracking-tight">SQL AI</span>
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
        
        {/* Databases Navigation */}
        <button 
          onClick={() => setActiveView("db_list")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
            activeView !== "chat" && activeView !== "chat_history"
              ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20" 
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent"
          }`}
        >
          <Database size={18} /> Databases
        </button>
      </nav>
    </aside>
  );
}
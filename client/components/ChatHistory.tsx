import { MessageSquare, Calendar, Database, ChevronRight } from "lucide-react";

interface ChatHistoryProps {
  onSelectChat: (chatId: number) => void;
}

export default function ChatHistory({ onSelectChat }: ChatHistoryProps) {
  // Mock data for chat history
  const historyData = [
    { id: 1, title: "Total revenue by month for 2026", date: "Today, 10:30 AM", db: "Production DB" },
    { id: 2, title: "Show me active users who haven't ordered in 30 days", date: "Yesterday, 2:15 PM", db: "Production DB" },
    { id: 3, title: "Find top 10 products by refund rate", date: "Oct 28, 2026", db: "Local Test" },
    { id: 4, title: "Count of new signups from marketing campaign", date: "Oct 25, 2026", db: "Production DB" },
  ];

  return (
    <div className="p-10 max-w-5xl mx-auto w-full animate-in fade-in duration-300">
      <div className="mb-8 border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Chat History</h1>
        <p className="text-slate-500 mt-2 text-sm">Review and continue your previous database queries.</p>
      </div>

      <div className="flex flex-col gap-4">
        {historyData.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className="group flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 p-5 rounded-xl hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-900/5 transition-all text-left w-full"
          >
            <div className="flex items-start md:items-center gap-4">
              <div className="p-3 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">
                  "{chat.title}"
                </h3>
                <div className="flex items-center gap-4 mt-2 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Database size={14} className="text-slate-400" /> {chat.db}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-400" /> {chat.date}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center text-sm font-semibold text-slate-400 group-hover:text-indigo-600 transition-colors">
              Continue <ChevronRight size={16} className="ml-1 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
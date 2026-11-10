import { Terminal, User, Zap, Play, Check, Sparkles, Copy } from "lucide-react";
import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { addMessage, setActiveChatSessionId } from "@/store/appSlice";
import { HISTORY_LIMIT } from "@/lib/flask";
import { ChatMessage, QueryResult } from "@/types";
import ResultTable from "@/components/ResultTable";

export default function ChatView() {
  const dispatch = useDispatch();

  // ---- everything shared comes from Redux ----
  // activeDbId is set when "Select & load schema" succeeds - it is the chat's database.
  const activeDbId = useSelector((state: RootState) => state.app.activeDbId);
  const selectedDbIds = useSelector((state: RootState) => state.app.selectedDbIds);
  const activeChatSessionId = useSelector((state: RootState) => state.app.activeChatSessionId);
  const messages = useSelector((state: RootState) => state.app.messages);

  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view
  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  const handleGenerate = async () => {
    const currentPrompt = prompt.trim();
    if (!currentPrompt || isLoading) return;

    // Which DB to query: explicit "load schema" pick, or the header query scope
    const databaseId = activeDbId ?? selectedDbIds[0] ?? null;
    if (!databaseId) {
      alert("No database selected. Open Data Sources, pick a database in the header, or load schemas first.");
      return;
    }

    // Show the user's message immediately
    const userMessage: ChatMessage = { id: Date.now(), role: "user", content: currentPrompt };
    dispatch(addMessage(userMessage));
    setPrompt("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsLoading(true);

    try {
      // Only the last few messages go to the LLM, so it remembers the conversation
      const history = messages.slice(-HISTORY_LIMIT);

      const response = await fetch('/api/fullfill_query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          databaseId,
          history,
          chatSessionId: activeChatSessionId,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        window.dispatchEvent(new Event("query-quota-refresh"));
        throw new Error(data.error || "Request failed");
      }

      const result = data as QueryResult & { chatSessionId?: string };
      if (result.chatSessionId) dispatch(setActiveChatSessionId(result.chatSessionId));
      dispatch(
        addMessage({
          id: Date.now() + 1,
          role: "ai",
          content: result.message,
          sql: result.sql,
          columns: result.columns ?? [],
          rows: result.rows ?? [],
        })
      );
      window.dispatchEvent(new Event("query-quota-refresh"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      dispatch(addMessage({ id: Date.now() + 1, role: "ai", content: `Error: ${message}` }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (sql: string, messageId: number) => {
    navigator.clipboard.writeText(sql);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Enter sends, Shift+Enter makes a new line
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  // =========================================
  // VIEW 1: EMPTY STATE (VERTICALLY CENTERED)
  // =========================================
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full animate-in fade-in duration-500 p-8 relative z-0">
        <div className="w-full max-w-3xl flex flex-col items-center">
          <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 p-3 rounded-2xl mb-6 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
            <Sparkles size={32} />
          </div>
          <h2 className="mb-8 bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-center text-4xl font-extrabold tracking-tight text-transparent">
            What data do you need?
          </h2>

          <div className="group relative w-full rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 p-px shadow-2xl shadow-indigo-900/20">
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-20 blur transition duration-500 group-hover:opacity-40" />
            <div className="relative rounded-2xl border border-slate-800 bg-slate-950/90 backdrop-blur-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/50">
            <textarea
              ref={textareaRef}
              rows={1}
              value={prompt}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question... (Shift + Enter for new line)"
              className="w-full bg-transparent px-6 py-5 pr-40 text-slate-200 placeholder-slate-500 font-medium focus:outline-none text-lg resize-none min-h-[68px] max-h-[200px] overflow-y-auto"
            />
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="absolute bottom-3 right-3 flex h-[44px] items-center gap-2 rounded-xl bg-indigo-600 px-6 font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 hover:bg-indigo-500 active:scale-95 disabled:opacity-60"
            >
              <Terminal size={18} /> {isLoading ? "Working..." : "Generate"}
            </button>
            </div>
          </div>
          <p className="text-slate-500 text-sm mt-4 font-medium">
            {activeDbId || selectedDbIds.length
              ? "Ask a question — Flask will connect and read the schema when you generate."
              : "Add a data source and select it in the header."}{" "}
            Press Enter to run.
          </p>
        </div>
      </div>
    );
  }

  // =========================================
  // VIEW 2: ACTIVE CHAT (INPUT AT BOTTOM)
  // =========================================
  return (
    <div className="flex flex-col h-full relative animate-in fade-in duration-300 z-0">

      <div className="flex-1 overflow-y-auto p-8 space-y-8 pb-40">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === "user" ? "flex-row-reverse" : ""}`}>

            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
              msg.role === "user" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-gradient-to-br from-indigo-500 to-cyan-500 text-white"
            }`}>
              {msg.role === "user" ? <User size={20} /> : <Zap size={20} />}
            </div>

            <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`px-5 py-3.5 rounded-2xl text-sm font-medium shadow-sm whitespace-pre-wrap ${
                msg.role === "user" ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-sm shadow-md"
              }`}>
                {msg.content}
              </div>

              {/* SQL Code Block */}
              {msg.sql && (
                <div className="w-full mt-2 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-md">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-b border-slate-800">
                    <span className="text-xs font-mono text-slate-400">Generated SQL</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleCopy(msg.sql!, msg.id)} className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium px-2 py-1">
                        {copiedId === msg.id ? <Check size={14} className="text-green-400" /> : <Copy size={12} />} Copy
                      </button>
                      <button className="bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-md">
                        <Play size={12} fill="currentColor" /> Run
                      </button>
                    </div>
                  </div>
                  <div className="p-4 overflow-x-auto">
                    <pre className="text-sm font-mono text-indigo-300 leading-relaxed">
                      <code>{msg.sql}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Data table */}
              {msg.role === "ai" && msg.columns && msg.columns.length > 0 && (
                <div className="w-full bg-slate-950 rounded-xl border border-slate-800 shadow-md overflow-hidden">
                  <ResultTable columns={msg.columns} rows={msg.rows ?? []} />
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="max-w-4xl mx-auto flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-white">
              <Zap size={20} />
            </div>
            <div className="px-5 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-sm font-medium animate-pulse">
              Thinking, generating SQL and running it...
            </div>
          </div>
        )}
        <div ref={scrollAnchorRef} />
      </div>

      {/* Input bar fixed at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pt-12">
        <div className="group relative mx-auto w-full max-w-4xl rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 p-px shadow-2xl shadow-indigo-900/20">
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-20 blur transition duration-500 group-hover:opacity-40" />
          <div className="relative rounded-2xl border border-slate-700 bg-slate-950/90 backdrop-blur-md focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/50">
          <textarea
            ref={textareaRef}
            rows={1}
            value={prompt}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask a follow-up question..."
            className="w-full bg-transparent px-5 py-4 pr-40 text-slate-200 placeholder-slate-500 font-medium focus:outline-none text-base resize-none min-h-[58px] max-h-[200px] overflow-y-auto rounded-2xl"
          />
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="absolute bottom-2 right-2 flex h-[42px] items-center gap-2 rounded-xl bg-indigo-600 px-6 font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 disabled:opacity-60"
          >
            <Terminal size={18} /> {isLoading ? "Working..." : "Generate"}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}

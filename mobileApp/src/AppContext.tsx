import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import * as Linking from "expo-linking";
import { api, setAuthToken } from "./api";
import { tokenFromAuthUrl } from "./authLink";
import { clearToken, loadToken, saveToken } from "./sessionStore";
import { AuthUser, ChatMessage, DatabaseConnection } from "./types";

type AppContextValue = {
  ready: boolean;
  user: AuthUser | null;
  databases: DatabaseConnection[];
  selectedDbIds: string[];
  activeDbId: string | null;
  messages: ChatMessage[];
  chatSessionId: string | null;
  signInWithToken: (token: string, known?: AuthUser) => Promise<void>;
  signOut: () => Promise<void>;
  refreshDatabases: () => Promise<void>;
  selectDatabase: (id: string) => void;
  setActiveDbId: (id: string | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setChatSessionId: (id: string | null) => void;
  startNewChat: () => void;
  loadChat: (id: string) => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

function asDatabases(rows: DatabaseConnection[]): DatabaseConnection[] {
  return rows.map((row) => ({
    ...row,
    id: String(row.id),
    readOnly: Boolean(row.readOnly),
  }));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [databases, setDatabases] = useState<DatabaseConnection[]>([]);
  const [selectedDbIds, setSelectedDbIds] = useState<string[]>([]);
  const [activeDbId, setActiveDbId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const activeRef = useRef<string | null>(null);

  const signInWithToken = useCallback(async (token: string, known?: AuthUser) => {
    setAuthToken(token);
    await saveToken(token);
    if (known) {
      console.log("[mobile] signed in", known.email);
      setUser(known);
      return;
    }
    const data = await api<{ user: AuthUser }>("/api/auth/mobile/me");
    console.log("[mobile] signed in", data.user.email);
    setUser(data.user);
  }, []);

  const signOut = useCallback(async () => {
    console.log("[mobile] sign out");
    activeRef.current = null;
    await clearToken();
    setAuthToken(null);
    setUser(null);
    setDatabases([]);
    setSelectedDbIds([]);
    setActiveDbId(null);
    setMessages([]);
    setChatSessionId(null);
  }, []);

  const refreshDatabases = useCallback(async () => {
    const data = await api<{ databases: DatabaseConnection[] }>("/api/databases");
    const list = asDatabases(data.databases || []);
    console.log("[mobile] databases", list.length);
    setDatabases(list);
    const current = activeRef.current;
    const next = current && list.some((db) => db.id === current) ? current : list[0]?.id ?? null;
    activeRef.current = next;
    setActiveDbId(next);
    setSelectedDbIds(next ? [next] : []);
  }, []);

  const selectDatabase = useCallback((id: string) => {
    console.log("[mobile] select database", id);
    if (activeRef.current !== id) {
      setMessages([]);
      setChatSessionId(null);
    }
    activeRef.current = id;
    setActiveDbId(id);
    setSelectedDbIds([id]);
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const startNewChat = useCallback(() => {
    console.log("[mobile] new chat");
    setMessages([]);
    setChatSessionId(null);
  }, []);

  const loadChat = useCallback(async (id: string) => {
    const data = await api<{ chat: { id: string; database_id: string }; messages: ChatMessage[] }>(
      `/api/chats/${id}`
    );
    console.log("[mobile] open chat", id, data.messages.length);
    setChatSessionId(data.chat.id);
    const dbId = String(data.chat.database_id);
    activeRef.current = dbId;
    setActiveDbId(dbId);
    setSelectedDbIds([dbId]);
    setMessages(data.messages || []);
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      const initial = await Linking.getInitialURL();
      const fromLink = initial ? tokenFromAuthUrl(initial) : null;
      const saved = fromLink || (await loadToken());
      if (saved) {
        try {
          await signInWithToken(saved);
        } catch (error) {
          console.log("[mobile] stored session rejected", error);
          await clearToken();
          setAuthToken(null);
        }
      }
      if (live) setReady(true);
    })();

    const sub = Linking.addEventListener("url", ({ url }) => {
      const token = tokenFromAuthUrl(url);
      if (!token) return;
      signInWithToken(token).catch((error) => console.log("[mobile] deep link login failed", error));
    });
    return () => {
      live = false;
      sub.remove();
    };
  }, [signInWithToken]);

  useEffect(() => {
    if (!user) return;
    refreshDatabases().catch((error) => console.log("[mobile] database list failed", error));
  }, [user, refreshDatabases]);

  return (
    <AppContext.Provider
      value={{
        ready,
        user,
        databases,
        selectedDbIds,
        activeDbId,
        messages,
        chatSessionId,
        signInWithToken,
        signOut,
        refreshDatabases,
        selectDatabase,
        setActiveDbId,
        setMessages,
        addMessage,
        setChatSessionId,
        startNewChat,
        loadChat,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

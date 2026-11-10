import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { api } from "../api";
import { useApp } from "../AppContext";
import { AppHeader } from "../components/AppHeader";
import { ResultTable } from "../components/ResultTable";
import { ChatMessage } from "../types";
import { colors } from "../theme";

const HISTORY_LIMIT = 4;

export function ChatScreen() {
  const { activeDbId, messages, chatSessionId, addMessage, setChatSessionId } = useApp();
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const databaseId = activeDbId;

  const send = async () => {
    const text = prompt.trim();
    if (!text || busy) return;
    if (!databaseId) {
      addMessage({ id: Date.now(), role: "ai", content: "Add a data source and select it before asking a question." });
      return;
    }
    const userMessage: ChatMessage = { id: Date.now(), role: "user", content: text };
    addMessage(userMessage);
    setPrompt("");
    setBusy(true);
    console.log("[mobile] generate", databaseId);
    try {
      const history = messages.slice(-HISTORY_LIMIT);
      const data = await api<{
        message: string;
        sql: string | null;
        columns?: string[];
        rows?: Record<string, unknown>[];
        chatSessionId?: string;
      }>("/api/fullfill_query", {
        method: "POST",
        body: JSON.stringify({ prompt: text, databaseId, history, chatSessionId }),
      });
      if (data.chatSessionId) setChatSessionId(data.chatSessionId);
      addMessage({
        id: Date.now() + 1,
        role: "ai",
        content: data.message,
        sql: data.sql,
        columns: data.columns ?? [],
        rows: data.rows ?? [],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      addMessage({ id: Date.now() + 1, role: "ai", content: `Error: ${message}` });
    } finally {
      setBusy(false);
    }
  };

  const copySql = async (sql: string, id: number) => {
    await Clipboard.setStringAsync(sql);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const empty = messages.length === 0;

  return (
    <View style={styles.page}>
      <AppHeader mode="chat" />

      {empty ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>What data do you need?</Text>
          <Text style={styles.hint}>
            {databaseId
              ? "Ask in plain English. The server reads the schema when you generate."
              : "Pick a database from the dropdown in the header."}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.thread} contentContainerStyle={styles.threadContent}>
        {messages.map((msg) => (
          <View key={msg.id} style={[styles.bubbleWrap, msg.role === "user" && styles.userWrap]}>
            <View style={[styles.bubble, msg.role === "user" ? styles.userBubble : styles.aiBubble]}>
              <Text style={styles.bubbleText}>{msg.content}</Text>
            </View>
            {msg.sql ? (
              <View style={styles.sqlBox}>
                <View style={styles.sqlHead}>
                  <Text style={styles.sqlLabel}>Generated SQL</Text>
                  <Pressable onPress={() => void copySql(msg.sql || "", msg.id)}>
                    <Text style={styles.copy}>{copiedId === msg.id ? "Copied" : "Copy"}</Text>
                  </Pressable>
                </View>
                <Text style={styles.sql}>{msg.sql}</Text>
              </View>
            ) : null}
            {msg.role === "ai" && msg.columns && msg.columns.length > 0 ? (
              <View style={styles.table}>
                <ResultTable columns={msg.columns} rows={msg.rows ?? []} />
              </View>
            ) : null}
          </View>
        ))}
        {busy && <Text style={styles.hint}>Thinking, generating SQL and running it...</Text>}
      </ScrollView>
      )}

      <View style={styles.composer}>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Ask a question..."
          placeholderTextColor={colors.faint}
          style={styles.input}
          multiline
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Generate" style={styles.send} disabled={busy} onPress={() => void send()}>
          <Text style={styles.sendText}>{busy ? "..." : "Generate"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  thread: { flex: 1 },
  threadContent: { padding: 16, gap: 12 },
  emptyTitle: { color: colors.text, fontSize: 28, fontWeight: "800", marginBottom: 8, textAlign: "center" },
  hint: { color: colors.muted, textAlign: "center" },
  bubbleWrap: { alignItems: "flex-start", gap: 8 },
  userWrap: { alignItems: "flex-end" },
  bubble: { maxWidth: "90%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { backgroundColor: colors.indigo },
  aiBubble: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  bubbleText: { color: colors.text },
  sqlBox: { width: "100%", backgroundColor: "#020617", borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12 },
  sqlHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  sqlLabel: { color: colors.muted, fontSize: 12 },
  copy: { color: colors.indigoSoft, fontWeight: "700" },
  sql: { color: "#a5b4fc", fontFamily: "monospace" },
  table: { width: "100%", borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: "hidden" },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    color: colors.text,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  send: { backgroundColor: colors.indigo, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14 },
  sendText: { color: "white", fontWeight: "800" },
});

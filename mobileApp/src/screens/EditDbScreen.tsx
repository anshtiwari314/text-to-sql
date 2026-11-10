import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api";
import { useApp } from "../AppContext";
import { Field } from "../components/Field";
import { AppStackParamList } from "../nav/types";
import { colors } from "../theme";

const ENGINES = ["PostgreSQL", "MySQL", "SQLite", "SQL Server"];

type Props = NativeStackScreenProps<AppStackParamList, "EditDb">;

export function EditDbScreen({ route }: Props) {
  const { databases, activeDbId, refreshDatabases } = useApp();
  const db = databases.find((item) => item.id === route.params.id);
  const [connName, setConnName] = useState(db?.name || "");
  const [engine, setEngine] = useState(db?.engine || "PostgreSQL");
  const [host, setHost] = useState(db?.host || "");
  const [port, setPort] = useState(db?.port?.toString() || "");
  const [dbName, setDbName] = useState(db?.db_name || "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!db) {
    return <Text style={styles.missing}>This connection is no longer in the list.</Text>;
  }

  const save = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    console.log("[mobile] update database", db.id);
    try {
      await api(`/api/databases/${db.id}`, {
        method: "PUT",
        body: JSON.stringify({
          conn_name: connName,
          engine,
          host,
          port: port ? parseInt(port, 10) : null,
          db_name: dbName,
          db_username: username || null,
          db_password: password || null,
        }),
      });
      await refreshDatabases();
      setMessage("Saved.");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.h1}>{db.name}</Text>
      <Text style={styles.sub}>
        {db.engine} on {db.host}
        {activeDbId === db.id ? " · selected for chat" : ""}
      </Text>
      <Text style={styles.sub}>Leave username and password empty to keep the saved ones.</Text>
      <Field label="Connection name" value={connName} onChangeText={setConnName} />
      <Text style={styles.label}>Engine</Text>
      <ScrollView horizontal contentContainerStyle={styles.engines}>
        {ENGINES.map((item) => (
          <Pressable key={item} style={[styles.chip, engine === item && styles.chipOn]} onPress={() => setEngine(item)}>
            <Text style={styles.chipText}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Field label="Host" value={host} onChangeText={setHost} autoCapitalize="none" />
      <Field label="Port" value={port} onChangeText={setPort} keyboardType="number-pad" />
      <Field label="Database name" value={dbName} onChangeText={setDbName} autoCapitalize="none" />
      <Field label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="leave empty to keep current" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="leave empty to keep current" />
      {error && <Text style={styles.error}>{error}</Text>}
      {message && <Text style={styles.ok}>{message}</Text>}
      <Pressable style={styles.primary} disabled={busy} onPress={() => void save()}>
        <Text style={styles.primaryText}>{busy ? "Saving..." : "Save changes"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16 },
  missing: { color: colors.muted, padding: 24, backgroundColor: colors.bg, flex: 1 },
  h1: { color: colors.text, fontSize: 26, fontWeight: "800" },
  sub: { color: colors.muted, marginBottom: 8 },
  label: { color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 6 },
  engines: { gap: 8, marginBottom: 12 },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipOn: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  chipText: { color: colors.text, fontWeight: "700" },
  error: { color: colors.danger, marginBottom: 8 },
  ok: { color: colors.ok, marginBottom: 8 },
  primary: { backgroundColor: colors.indigo, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  primaryText: { color: "white", fontWeight: "800" },
});

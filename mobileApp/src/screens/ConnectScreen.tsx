import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api";
import { useApp } from "../AppContext";
import { Field } from "../components/Field";
import { AppStackParamList } from "../nav/types";
import { colors } from "../theme";

const ENGINES = ["PostgreSQL", "MySQL", "SQLite", "SQL Server"];
const HOSTS = ["Locally", "Supabase", "AWS", "Azure"];

type Props = NativeStackScreenProps<AppStackParamList, "Connect">;

export function ConnectScreen({ navigation }: Props) {
  const { refreshDatabases } = useApp();
  const [step, setStep] = useState<"engine" | "form">("engine");
  const [engine, setEngine] = useState("PostgreSQL");
  const [hostType, setHostType] = useState<string | null>(null);
  const [connName, setConnName] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [dbName, setDbName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!connName || !host || !username || !password || !dbName) {
      setError("Please fill in all required fields.");
      return;
    }
    setBusy(true);
    setError(null);
    console.log("[mobile] save database", engine, hostType);
    try {
      await api("/api/databases", {
        method: "POST",
        body: JSON.stringify({
          conn_name: connName,
          engine,
          host,
          port: parseInt(port, 10) || 5432,
          db_username: username,
          db_password: password,
          db_name: dbName,
        }),
      });
      await refreshDatabases();
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save connection");
    } finally {
      setBusy(false);
    }
  };

  if (step === "engine") {
    return (
      <ScrollView style={styles.page} contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Select Engine</Text>
        <Text style={styles.sub}>Choose the database provider you want to connect to.</Text>
        {ENGINES.map((item) => (
          <Pressable
            key={item}
            style={styles.card}
            onPress={() => {
              setEngine(item);
              setStep("form");
            }}
          >
            <Text style={styles.cardTitle}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => setStep("engine")}>
        <Text style={styles.link}>Back to engines</Text>
      </Pressable>
      <Text style={styles.h1}>Where is your {engine} hosted?</Text>
      <View style={styles.hosts}>
        {HOSTS.map((item) => (
          <Pressable key={item} style={[styles.host, hostType === item && styles.hostOn]} onPress={() => setHostType(item)}>
            <Text style={styles.hostText}>{item}</Text>
          </Pressable>
        ))}
      </View>
      {hostType && (
        <View>
          <Field label="Connection name" value={connName} onChangeText={setConnName} placeholder="Production DB" />
          <Field label="Host URL" value={host} onChangeText={setHost} autoCapitalize="none" placeholder={hostType === "Locally" ? "localhost" : "db.example.com"} />
          <Field label="Port" value={port} onChangeText={setPort} keyboardType="number-pad" placeholder="5432" />
          <Field label="Database name" value={dbName} onChangeText={setDbName} autoCapitalize="none" placeholder="postgres" />
          <Field label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable style={styles.primary} disabled={busy} onPress={() => void save()}>
            <Text style={styles.primaryText}>{busy ? "Saving..." : "Save connection"}</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12 },
  h1: { color: colors.text, fontSize: 26, fontWeight: "800" },
  sub: { color: colors.muted, marginBottom: 8 },
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 18 },
  cardTitle: { color: colors.text, fontWeight: "800", fontSize: 16 },
  link: { color: colors.indigoSoft, fontWeight: "700" },
  hosts: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  host: { borderWidth: 1, borderColor: colors.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  hostOn: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  hostText: { color: colors.text, fontWeight: "700" },
  error: { color: colors.danger, marginBottom: 8 },
  primary: { backgroundColor: colors.indigo, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  primaryText: { color: "white", fontWeight: "800" },
});

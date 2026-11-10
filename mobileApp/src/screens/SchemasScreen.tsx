import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../api";
import { useApp } from "../AppContext";
import { AppHeader } from "../components/AppHeader";
import { parseSchemaDdl } from "../parseSchemaDdl";
import { ParsedTableSchema } from "../types";
import { colors } from "../theme";

export function SchemasScreen() {
  const { databases, setActiveDbId } = useApp();
  const [focusId, setFocusId] = useState<string | null>(null);
  const [tables, setTables] = useState<ParsedTableSchema[]>([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (id: string) => {
    setFocusId(id);
    setActiveDbId(id);
    setLoading(true);
    setError(null);
    setTables([]);
    console.log("[mobile] load schema", id);
    try {
      const data = await api<{ schema: string }>("/api/schema", {
        method: "POST",
        body: JSON.stringify({ databaseId: id }),
      });
      const parsed = parseSchemaDdl(data.schema || "");
      setTables(parsed);
      setSelected(parsed[0]?.name || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load schema");
    } finally {
      setLoading(false);
    }
  };

  const focus = databases.find((db) => db.id === focusId);
  const ddl = tables.find((table) => table.name === selected)?.ddl || tables[0]?.ddl || "";

  return (
    <View style={styles.page}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.list}>
        <Text style={styles.h1}>Schemas</Text>
        <Text style={styles.sub}>Pick a database, then a table, to see its CREATE TABLE definition.</Text>
        {loading && <Text style={styles.sub}>Loading schema…</Text>}
        {error && <Text style={styles.error}>{error}</Text>}
        {databases.map((db) => (
          <Pressable key={db.id} style={[styles.card, focusId === db.id && styles.cardOn]} onPress={() => void load(db.id)}>
            <Text style={styles.cardTitle}>{db.name}</Text>
            <Text style={styles.sub}>
              {db.engine} · {db.host}
            </Text>
            {focusId === db.id && tables.length > 0 && <Text style={styles.ok}>{tables.length} tables loaded</Text>}
          </Pressable>
        ))}
        {focus && tables.length > 0 && (
          <View style={styles.ddlBox}>
            <Text style={styles.cardTitle}>{focus.name}</Text>
            <ScrollView horizontal contentContainerStyle={styles.tables}>
              {tables.map((table) => (
                <Pressable key={table.name} style={[styles.chip, selected === table.name && styles.chipOn]} onPress={() => setSelected(table.name)}>
                  <Text style={styles.chipText}>{table.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.ddl}>{ddl}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, gap: 12 },
  h1: { color: colors.text, fontSize: 28, fontWeight: "800" },
  sub: { color: colors.muted },
  error: { color: colors.danger },
  ok: { color: colors.ok, marginTop: 8, fontWeight: "700" },
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16 },
  cardOn: { borderColor: "#34d399" },
  cardTitle: { color: colors.text, fontWeight: "800", fontSize: 18, marginBottom: 4 },
  ddlBox: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  tables: { gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipOn: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  chipText: { color: colors.text, fontWeight: "700" },
  ddl: { color: "#c7d2fe", fontFamily: "monospace" },
});

import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { api } from "../api";
import { useApp } from "../AppContext";
import { AppHeader } from "../components/AppHeader";
import { MainTabParamList } from "../nav/types";
import { SavedChatSummary } from "../types";
import { colors } from "../theme";

export function HistoryScreen() {
  const { loadChat } = useApp();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [chats, setChats] = useState<SavedChatSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      setLoading(true);
      api<{ chats: SavedChatSummary[] }>("/api/chats")
        .then((data) => {
          if (!live) return;
          console.log("[mobile] history", data.chats?.length || 0);
          setChats(data.chats || []);
          setError(null);
        })
        .catch((err) => {
          if (live) setError(err instanceof Error ? err.message : "Failed to load");
        })
        .finally(() => {
          if (live) setLoading(false);
        });
      return () => {
        live = false;
      };
    }, [])
  );

  const open = async (id: string) => {
    try {
      await loadChat(id);
      navigation.navigate("Chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chat");
    }
  };

  return (
    <View style={styles.page}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.list}>
        <Text style={styles.h1}>Chat History</Text>
        <Text style={styles.sub}>Saved conversations. Tap one to continue.</Text>
        {loading && <Text style={styles.sub}>Loading…</Text>}
        {error && <Text style={styles.error}>{error}</Text>}
        {!loading && !error && chats.length === 0 && <Text style={styles.sub}>No chats yet. Start one from Chat.</Text>}
        {chats.map((chat) => (
          <Pressable key={chat.id} style={styles.card} onPress={() => void open(chat.id)}>
            <Text style={styles.cardTitle}>{chat.title}</Text>
            <Text style={styles.sub}>
              {chat.db_name} · {new Date(chat.updated_at || chat.created_at).toLocaleString()}
            </Text>
            <Text style={styles.continue}>Continue</Text>
          </Pressable>
        ))}
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
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 14 },
  cardTitle: { color: colors.text, fontWeight: "800", fontSize: 16, marginBottom: 4 },
  continue: { color: colors.indigoSoft, fontWeight: "700", marginTop: 8 },
});

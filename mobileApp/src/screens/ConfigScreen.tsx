import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CompositeNavigationProp, useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useApp } from "../AppContext";
import { AppHeader } from "../components/AppHeader";
import { AppStackParamList, MainTabParamList } from "../nav/types";
import { colors } from "../theme";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Config">,
  NativeStackNavigationProp<AppStackParamList>
>;

export function ConfigScreen() {
  const { databases } = useApp();
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.page}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.list}>
        <Text style={styles.h1}>Configuration</Text>
        <Text style={styles.sub}>Add a source or tap a card to edit its connection.</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Connect New Source" style={styles.add} onPress={() => navigation.navigate("Connect")}>
          <Text style={styles.addText}>+ Connect New Source</Text>
        </Pressable>
        {databases.map((db) => (
          <Pressable key={db.id} style={styles.card} onPress={() => navigation.navigate("EditDb", { id: db.id })}>
            <Text style={styles.cardTitle}>{db.name}</Text>
            <Text style={styles.sub}>
              {db.engine} · {db.host}
            </Text>
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
  add: {
    minHeight: 110,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.line,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: { color: colors.muted, fontWeight: "700" },
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16, minHeight: 100 },
  cardTitle: { color: colors.text, fontWeight: "800", fontSize: 18, marginBottom: 6 },
});

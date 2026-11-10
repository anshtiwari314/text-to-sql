import { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../AppContext";
import { colors } from "../theme";

type Props = {
  /** Chat tab: SQL AI | database dropdown | profile. Other tabs: SQL AI | profile only. */
  mode?: "chat" | "default";
};

function BrandMark() {
  return (
    <Text style={styles.brand}>
      SQL<Text style={styles.brandAi}>AI</Text>
    </Text>
  );
}

export function AppHeader({ mode = "default" }: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, databases, activeDbId, selectDatabase } = useApp();
  const [open, setOpen] = useState(false);
  const current = databases.find((db) => db.id === activeDbId);
  const letter = (user?.name || user?.email || "?").slice(0, 1).toUpperCase();
  const showDb = mode === "chat";

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <View style={styles.left}>
        <BrandMark />
      </View>

      {showDb ? (
        <View style={styles.center}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select database"
            style={styles.dbBtn}
            onPress={() => setOpen(true)}
          >
            <Text style={styles.dbText} numberOfLines={1}>
              {current?.name || "Select database"}
            </Text>
            <Text style={styles.chevron}>▾</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.centerSpacer} />
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Profile"
        style={styles.circle}
        onPress={() => {
          console.log("[mobile] open profile");
          navigation.navigate("Profile" as never);
        }}
      >
        {user?.image ? (
          <Image source={{ uri: user.image }} style={styles.circle} />
        ) : (
          <Text style={styles.letter}>{letter}</Text>
        )}
      </Pressable>

      {showDb && (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
            <View style={[styles.menu, { marginTop: insets.top + 56 }]}>
              <Text style={styles.menuTitle}>Database</Text>
              {databases.length === 0 && <Text style={styles.empty}>No databases yet. Add one under Config.</Text>}
              {databases.map((db) => {
                const on = db.id === activeDbId;
                return (
                  <Pressable
                    key={db.id}
                    accessibilityRole="button"
                    accessibilityLabel={db.name}
                    style={[styles.row, on && styles.rowOn]}
                    onPress={() => {
                      selectDatabase(db.id);
                      setOpen(false);
                    }}
                  >
                    <View>
                      <Text style={styles.rowName}>{db.name}</Text>
                      <Text style={styles.rowMeta}>{db.engine}</Text>
                    </View>
                    {on && <Text style={styles.check}>✓</Text>}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  left: { minWidth: 56 },
  brand: { color: colors.text, fontWeight: "800", fontSize: 16 },
  brandAi: { color: colors.indigoSoft },
  center: { flex: 1, alignItems: "center", minWidth: 0 },
  centerSpacer: { flex: 1 },
  dbBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "100%",
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dbText: { color: colors.text, fontWeight: "700", flexShrink: 1 },
  chevron: { color: colors.muted },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  letter: { color: colors.text, fontWeight: "800" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  menu: {
    marginHorizontal: 16,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
  },
  menuTitle: {
    color: colors.faint,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  empty: { color: colors.muted, padding: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
  },
  rowOn: { backgroundColor: "#1e1b4b" },
  rowName: { color: colors.text, fontWeight: "700" },
  rowMeta: { color: colors.muted, fontSize: 12 },
  check: { color: colors.indigoSoft, fontWeight: "800" },
});

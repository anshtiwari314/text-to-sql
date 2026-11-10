import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useApp } from "../AppContext";
import { colors } from "../theme";

export function ProfileScreen() {
  const { user, signOut } = useApp();
  const letter = (user?.name || user?.email || "?").slice(0, 1).toUpperCase();

  return (
    <View style={styles.page}>
      {user?.image ? (
        <Image source={{ uri: user.image }} style={styles.photo} />
      ) : (
        <View style={styles.photo}>
          <Text style={styles.letter}>{letter}</Text>
        </View>
      )}
      <Text style={styles.name}>{user?.name || "Account"}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Sign out" style={styles.out} onPress={() => void signOut()}>
        <Text style={styles.outText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg, alignItems: "center", paddingTop: 48, paddingHorizontal: 24 },
  photo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  letter: { color: colors.text, fontSize: 32, fontWeight: "800" },
  name: { color: colors.text, fontSize: 22, fontWeight: "800", marginTop: 16 },
  email: { color: colors.muted, marginTop: 4 },
  out: {
    marginTop: 28,
    backgroundColor: "#7f1d1d",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  outText: { color: "white", fontWeight: "800" },
});

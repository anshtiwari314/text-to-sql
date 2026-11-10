import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api";
import { Field } from "../components/Field";
import { AuthStackParamList } from "../nav/types";
import { colors } from "../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Reset">;

export function ResetScreen({ navigation, route }: Props) {
  const [token, setToken] = useState(route.params?.token || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setInfo(null);
    console.log("[mobile] reset password");
    try {
      await api("/api/auth/reset", {
        method: "POST",
        body: JSON.stringify({ token: token.trim(), password }),
      });
      setInfo("Password updated. You can sign in now.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
    }
  };

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Set a new password</Text>
      <Text style={styles.sub}>Paste the token from the email link, or open the app link on this phone.</Text>
      <Field label="Reset token" value={token} onChangeText={setToken} autoCapitalize="none" />
      <Field label="New password" value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 8 characters" />
      {error && <Text style={styles.error}>{error}</Text>}
      {info && <Text style={styles.info}>{info}</Text>}
      <Pressable style={styles.primary} onPress={() => void submit()}>
        <Text style={styles.primaryText}>Update password</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate("Auth")}>
        <Text style={styles.link}>Back to sign in</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg, padding: 24, paddingTop: 32 },
  title: { color: colors.text, fontSize: 26, fontWeight: "800", marginBottom: 8 },
  sub: { color: colors.muted, marginBottom: 20 },
  error: { color: colors.danger, marginBottom: 8 },
  info: { color: colors.ok, marginBottom: 8 },
  primary: { backgroundColor: colors.indigo, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  primaryText: { color: "white", fontWeight: "800" },
  link: { color: colors.indigoSoft, fontWeight: "700", textAlign: "center", marginTop: 16 },
});

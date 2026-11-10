import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { API_URL, loginRequest, api } from "../api";
import { signInWithGitHub, signInWithGoogle } from "../auth/nativeProviders";
import { useApp } from "../AppContext";
import { Field } from "../components/Field";
import { GitHubIcon, GoogleIcon } from "../components/OAuthIcons";
import { AuthStackParamList } from "../nav/types";
import { colors } from "../theme";

type Mode = "login" | "signup" | "forgot";
type Props = NativeStackScreenProps<AuthStackParamList, "Auth">;

export function AuthScreen({ navigation }: Props) {
  const { signInWithToken } = useApp();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showGoogle, setShowGoogle] = useState(true);
  const [showGitHub, setShowGitHub] = useState(true);

  useEffect(() => {
    console.log("[mobile] next server", API_URL);
    fetch(`${API_URL}/api/auth/providers`)
      .then((res) => res.json())
      .then((data) => {
        const google = Boolean(data?.google);
        const github = Boolean(data?.github);
        console.log("[mobile] oauth providers", google, github);
        setShowGoogle(google);
        setShowGitHub(github);
      })
      .catch((err) => {
        console.log("[mobile] providers request failed, keeping Google and GitHub visible", err);
      });
  }, []);

  const oauth = async (provider: "google" | "github") => {
    setError(null);
    setBusy(true);
    console.log("[mobile] oauth tap", provider);
    try {
      const token = provider === "google" ? await signInWithGoogle() : await signInWithGitHub();
      await signInWithToken(token);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not finish sign-in";
      if (message !== "cancelled") setError(message);
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setError(null);
    setInfo(null);
    setBusy(true);
    console.log("[mobile] auth submit", mode);
    try {
      if (mode === "forgot") {
        const data = await api<{ message?: string }>("/api/auth/forgot", {
          method: "POST",
          body: JSON.stringify({ email }),
        });
        setInfo(data.message || "Check your inbox for a reset link.");
        return;
      }
      if (mode === "signup") {
        await api("/api/auth/signup", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
      }
      const data = await loginRequest(email.trim(), password);
      await signInWithToken(data.token, data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const title = mode === "login" ? "Welcome back" : mode === "signup" ? "Create an account" : "Reset password";

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <LinearGradient colors={["#6366f1", "#06b6d4"]} style={styles.mark}>
        <Text style={styles.markText}>⚡</Text>
      </LinearGradient>
      <Text style={styles.word}>
        SQL<Text style={styles.wordAi}>AI</Text>
      </Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>
        {mode === "forgot" ? "We will email you a one-time link." : "Use Google, GitHub, or email."}
      </Text>

      {mode !== "forgot" && (showGoogle || showGitHub) && (
        <View style={styles.oauth}>
          {showGoogle && (
            <Pressable accessibilityRole="button" accessibilityLabel="Continue with Google" style={[styles.oauthBtn, styles.google]} onPress={() => void oauth("google")}>
              <GoogleIcon />
              <Text style={styles.googleText}>Continue with Google</Text>
            </Pressable>
          )}
          {showGitHub && (
            <Pressable accessibilityRole="button" accessibilityLabel="Continue with GitHub" style={[styles.oauthBtn, styles.github]} onPress={() => void oauth("github")}>
              <GitHubIcon />
              <Text style={styles.oauthText}>Continue with GitHub</Text>
            </Pressable>
          )}
        </View>
      )}

      {mode === "signup" && (
        <Field label="Full name" value={name} onChangeText={setName} placeholder="Jane Doe" />
      )}
      <Field
        label="Email address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@company.com"
      />
      {mode !== "forgot" && (
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="At least 8 characters"
        />
      )}
      {mode === "login" && (
        <Pressable accessibilityRole="button" accessibilityLabel="Forgot password?" onPress={() => setMode("forgot")}>
          <Text style={styles.link}>Forgot password?</Text>
        </Pressable>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
      {info && <Text style={styles.info}>{info}</Text>}

      <Pressable accessibilityRole="button" accessibilityLabel={mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send reset link"} style={styles.primary} disabled={busy} onPress={() => void submit()}>
        {busy ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.primaryText}>
            {mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send reset link"}
          </Text>
        )}
      </Pressable>

      {mode === "login" ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Don't have an account? Sign up" onPress={() => setMode("signup")}>
          <Text style={styles.link}>Don't have an account? Sign up</Text>
        </Pressable>
      ) : (
        <Pressable accessibilityRole="button" accessibilityLabel="Back to sign in" onPress={() => setMode("login")}>
          <Text style={styles.link}>Back to sign in</Text>
        </Pressable>
      )}
      {mode === "forgot" && (
        <Pressable accessibilityRole="button" accessibilityLabel="I have a reset token" onPress={() => navigation.navigate("Reset")}>
          <Text style={styles.link}>I have a reset token</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, backgroundColor: colors.bg, padding: 24, paddingTop: 72 },
  mark: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  markText: { color: "white", fontSize: 22 },
  word: { color: colors.text, fontSize: 28, fontWeight: "800", marginTop: 16 },
  wordAi: { color: colors.indigoSoft },
  title: { color: colors.text, fontSize: 26, fontWeight: "800", marginTop: 18 },
  sub: { color: colors.muted, marginTop: 6, marginBottom: 20 },
  oauth: { gap: 10, marginBottom: 16 },
  oauthBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  google: { backgroundColor: "#ffffff", borderColor: "#e2e8f0" },
  github: { backgroundColor: "#24292F", borderColor: "#24292F" },
  googleText: { color: "#0f172a", fontWeight: "700" },
  oauthText: { color: "#ffffff", fontWeight: "700" },
  link: { color: colors.indigoSoft, fontWeight: "700", marginBottom: 12 },
  error: { color: colors.danger, marginBottom: 8 },
  info: { color: colors.ok, marginBottom: 8 },
  primary: {
    backgroundColor: colors.indigo,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  primaryText: { color: "white", fontWeight: "800" },
});

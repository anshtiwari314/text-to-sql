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

type Mode = "login" | "signup" | "forgot" | "otp";
type OtpStep = "email" | "code";
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
  const [otpStep, setOtpStep] = useState<OtpStep>("email");
  const [otpCode, setOtpCode] = useState("");
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
      if (mode === "otp") {
        if (otpStep === "email") {
          const data = await api<{ message?: string }>("/api/auth/otp/send", {
            method: "POST",
            body: JSON.stringify({ email }),
          });
          setInfo(data.message || "Check your email for the code.");
          setOtpStep("code");
          return;
        }
        const data = await api<{ token: string; user: { id: string; name: string; email: string } }>(
          "/api/auth/mobile/otp/verify",
          { method: "POST", body: JSON.stringify({ email, code: otpCode, name }) }
        );
        await signInWithToken(data.token, data.user);
        return;
      }

      if (mode === "forgot") {
        const data = await api<{ message?: string }>("/api/auth/forgot", {
          method: "POST",
          body: JSON.stringify({ email }),
        });
        setInfo(data.message || "Check your inbox for a reset link.");
        return;
      }
      if (mode === "signup") {
        const signup = await api<{ needsVerification?: boolean; message?: string }>("/api/auth/signup", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
        if (signup.needsVerification) {
          setInfo(signup.message || "Verify your email before signing in.");
          setMode("login");
          return;
        }
      }
      const data = await loginRequest(email.trim(), password);
      await signInWithToken(data.token, data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const title =
    mode === "login"
      ? "Welcome back"
      : mode === "signup"
        ? "Create an account"
        : mode === "otp"
          ? otpStep === "email"
            ? "Sign in with OTP"
            : "Enter your code"
          : "Reset password";

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <LinearGradient colors={["#6366f1", "#06b6d4"]} style={styles.mark}>
        <Text style={styles.markText}>⚡</Text>
      </LinearGradient>
      <Text style={styles.word}>
        Query<Text style={styles.wordAi}>AI</Text>
      </Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>
        {mode === "forgot" ? "We will email you a one-time link." : "Use Google, GitHub, or email."}
      </Text>

      {mode !== "forgot" && mode !== "otp" && (
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign in with Email OTP"
            style={[styles.oauthBtn, styles.otp]}
            onPress={() => {
              setOtpStep("email");
              setOtpCode("");
              setError(null);
              setInfo(null);
              setMode("otp");
            }}
          >
            <Text style={styles.otpMark}>✉</Text>
            <Text style={styles.oauthText}>
              {mode === "signup" ? "Sign up with Email OTP" : "Sign in with Email OTP"}
            </Text>
          </Pressable>
        </View>
      )}

      {mode === "signup" && (
        <Field label="Full name" value={name} onChangeText={setName} placeholder="Jane Doe" />
      )}
      {mode === "otp" && otpStep === "email" && (
        <Field label="Name (optional)" value={name} onChangeText={setName} placeholder="Jane Doe" />
      )}
      {mode === "otp" && otpStep === "code" && (
        <Field
          label="6-digit code"
          value={otpCode}
          onChangeText={(t) => setOtpCode(t.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          placeholder="123456"
        />
      )}
      <Field
        label="Email address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@company.com"
      />
      {mode !== "forgot" && mode !== "otp" && (
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
            {mode === "login"
              ? "Sign In"
              : mode === "signup"
                ? "Create Account"
                : mode === "otp"
                  ? otpStep === "email"
                    ? "Send code"
                    : "Verify & sign in"
                  : "Send reset link"}
          </Text>
        )}
      </Pressable>

      {mode === "login" && (
        <Pressable accessibilityRole="button" onPress={() => setMode("signup")}>
          <Text style={styles.link}>Don't have an account? Sign up</Text>
        </Pressable>
      )}
      {mode !== "login" && (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setMode("login");
            setOtpStep("email");
            setOtpCode("");
          }}
        >
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
  otp: { backgroundColor: "#0f172a", borderColor: "#6366f1" },
  otpMark: { color: "#67e8f9", fontSize: 18, fontWeight: "700" },
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

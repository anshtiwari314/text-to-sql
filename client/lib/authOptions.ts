import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { ensureAuthTables } from "@/lib/ensureAuthTables";
import { githubOAuthCreds, googleOAuthCreds, oauthCallbackUrls } from "@/lib/oauthEnv";
import { notifyAdminLogin } from "@/lib/notifyLogin";
import { verifyEmailOtp } from "@/lib/emailOtpStore";
import { ensureUserAfterOtp } from "@/lib/ensureUserAfterOtp";

function buildProviders(): NextAuthOptions["providers"] {
  const list: NextAuthOptions["providers"] = [];

  const google = googleOAuthCreds();
  if (google) {
    list.push(
      GoogleProvider({
        clientId: google.clientId,
        clientSecret: google.clientSecret,
      })
    );
    console.log("[auth] Google OAuth provider enabled");
  }

  const github = githubOAuthCreds();
  if (github) {
    const callbackUrl = oauthCallbackUrls().github;
    list.push(
      GitHubProvider({
        clientId: github.clientId,
        clientSecret: github.clientSecret,
        authorization: { params: { scope: "read:user user:email" } },
      })
    );
    console.log("[auth] GitHub OAuth enabled; register callback URL in GitHub OAuth App:", callbackUrl);
  }

  list.push(
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim();
        const password = credentials?.password || "";
        if (!email || !password) return null;

        await ensureAuthTables();
        const found = await query(
          "SELECT id, name, email, image, password_hash, email_verified FROM users WHERE LOWER(email) = LOWER($1)",
          [email]
        );
        const row = found.rows[0];
        if (!row?.password_hash) return null;
        const ok = await bcrypt.compare(password, row.password_hash);
        if (!ok) return null;
        if (!row.email_verified) {
          console.log("[auth] credentials blocked unverified", email);
          return null;
        }
        return { id: row.id, name: row.name, email: row.email, image: row.image };
      },
    }),
    CredentialsProvider({
      id: "email-otp",
      name: "Email OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim();
        const code = credentials?.code?.trim();
        if (!email || !code) return null;

        const verifiedEmail = await verifyEmailOtp(email, code);
        if (!verifiedEmail) {
          console.log("[auth] otp sign-in rejected", email);
          return null;
        }
        const row = await ensureUserAfterOtp(verifiedEmail);
        return { id: row.id, name: row.name, email: row.email, image: row.image };
      },
    })
  );

  return list;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: buildProviders(),
  pages: {
    signIn: "/auth",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "credentials") return true;

      const profileEmail =
        profile && typeof profile === "object" && "email" in profile
          ? String((profile as { email?: string | null }).email || "").trim()
          : "";
      const email = (user.email || profileEmail).trim();
      if (!email) {
        console.error("[auth] OAuth denied: no email from", account?.provider);
        return false;
      }

      try {
        await ensureAuthTables();
        const existingUser = await query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [email]);

        if (existingUser.rows.length > 0) {
          await query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE LOWER(email) = LOWER($1)", [
            email,
          ]);
        } else {
          await query(
            "INSERT INTO users (name, email, image, email_verified, welcome_mailed) VALUES ($1, $2, $3, true, false)",
            [user.name || email, email, user.image]
          );
        }
        return true;
      } catch (error) {
        console.error("[auth] OAuth signIn DB error:", account?.provider, error);
        return false;
      }
    },

    async session({ session }) {
      if (session.user?.email) {
        try {
          const dbUser = await query("SELECT id FROM users WHERE email = $1", [session.user.email]);
          if (dbUser.rows.length > 0) {
            session.user.id = dbUser.rows[0].id;
          }
        } catch (error) {
          console.error("[auth] session user id lookup error:", error);
        }
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      console.log("[auth] signIn event", user.email, account?.provider);
      await notifyAdminLogin(
        { email: user.email, name: user.name },
        account?.provider || "unknown"
      );
    },
  },
};

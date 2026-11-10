import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { ensureAuthTables } from "@/lib/ensureAuthTables";
import { githubOAuthCreds, googleOAuthCreds, oauthCallbackUrls } from "@/lib/oauthEnv";
import { notifyAdminLogin } from "@/lib/notifyLogin";

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
          "SELECT id, name, email, image, password_hash FROM users WHERE email = $1",
          [email]
        );
        const row = found.rows[0];
        if (!row?.password_hash) return null;
        const ok = await bcrypt.compare(password, row.password_hash);
        if (!ok) return null;
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
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;
      if (!user.email) return false;

      try {
        await ensureAuthTables();
        const existingUser = await query("SELECT id FROM users WHERE email = $1", [user.email]);

        if (existingUser.rows.length > 0) {
          await query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE email = $1", [user.email]);
        } else {
          await query(
            "INSERT INTO users (name, email, image, welcome_mailed) VALUES ($1, $2, $3, false)",
            [user.name, user.email, user.image]
          );
        }
        return true;
      } catch (error) {
        console.error("[auth] OAuth signIn DB error:", error);
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

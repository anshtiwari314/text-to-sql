import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { query } from "@/lib/db"; // Ensure this points to your pg connection pool

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    // 1. Intercept the sign-in process
    async signIn({ user }: { user: { email?: string | null; name?: string | null; image?: string | null } }) {
      if (!user.email) return false;

      try {
        // Check if the user already exists in your Postgres database
        const existingUser = await query(
          "SELECT id FROM users WHERE email = $1",
          [user.email]
        );

        if (existingUser.rows.length > 0) {
          // User exists: Update their last_login timestamp
          await query(
            "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE email = $1",
            [user.email]
          );
        } else {
          // New user: Insert them into the database
          await query(
            "INSERT INTO users (name, email, image) VALUES ($1, $2, $3)",
            [user.name, user.email, user.image]
          );
        }
        
        return true; // Allow the sign-in to complete
      } catch (error) {
        console.error("Error saving user to database:", error);
        return false; // Deny sign-in if the database operation fails
      }
    },

    // 2. Attach the Postgres UUID to the session
    async session({ session }) {
      if (session.user?.email) {
        try {
          // Fetch the user's Postgres UUID to attach to the session
          const dbUser = await query(
            "SELECT id FROM users WHERE email = $1", 
            [session.user.email]
          );
          
          if (dbUser.rows.length > 0) {
            session.user.id = dbUser.rows[0].id;
          }
        } catch (error) {
          console.error("Error fetching user ID for session:", error);
        }
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
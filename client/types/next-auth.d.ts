import "next-auth";

// The auth session callback adds our Postgres user id to the session,
// so TypeScript must know about it.
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

"use client";

import AuthView from "./AuthView";

export default function AuthWrapper() {
  // Since NextAuth securely handles the session via server cookies,
  // we no longer need a manual state update function. 
  // When signIn("google") completes in AuthView, NextAuth will automatically 
  // refresh the route and the Server Component (page.tsx) will see the new session.
  
  return (
    <AuthView 
      onLoginSuccess={() => {
        // Optional: Leave empty or add custom client-side logic 
        // if you implement the email/password login later.
        return <div>Login Sucess</div>
      }} 
    />
  );
}
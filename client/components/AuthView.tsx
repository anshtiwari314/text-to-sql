"use client"
import { useState } from "react";
import { Zap, Mail, ArrowRight } from "lucide-react";
import { signIn } from "next-auth/react";

interface AuthViewProps {
  onLoginSuccess: () => void;
}

export default function AuthView({ onLoginSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="flex h-screen w-full bg-white font-sans overflow-hidden">
      
      {/* LEFT SIDE: Branding / Value Prop */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-violet-900/40 z-0"></div>
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-500/20 blur-3xl"></div>
        
        <div className="relative z-10 flex items-center gap-2 mb-10">
          <div className="bg-gradient-to-br from-indigo-500 to-violet-500 p-2 rounded-lg text-white">
            <Zap size={24} />
          </div>
          <span className="font-bold text-2xl text-white tracking-tight">SQL AI</span>
        </div>

        <div className="relative z-10 mb-20">
          <h1 className="text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            Chat with your database in plain English.
          </h1>
          <p className="text-slate-400 text-lg max-w-md">
            Connect your PostgreSQL, MySQL, or Snowflake databases securely and generate complex SQL queries in seconds using AI.
          </p>
        </div>

        <div className="relative z-10 text-slate-500 text-sm font-medium">
          © 2026 SQL AI Inc. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              {isLogin ? "Welcome back" : "Create an account"}
            </h2>
            <p className="text-slate-500">
              {isLogin ? "Enter your credentials to access your workspace." : "Sign up to start chatting with your data."}
            </p>
          </div>

          {/* Social Auth Buttons */}
          <div className="space-y-3 mb-8">
            <button 
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
            >
              {/* Google Brand SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <button className="w-full flex items-center justify-center gap-3 bg-[#24292F] text-white px-4 py-3 rounded-xl font-bold hover:bg-[#1b1f23] transition-all shadow-sm">
  {/* GitHub Brand SVG */}
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.45-1.15-1.11-1.46-1.11-1.46-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
  </svg>
  Continue with GitHub
</button>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 border-t border-slate-200"></div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Or continue with email</span>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>

          {/* Email / Password Form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); onLoginSuccess(); }} 
            className="space-y-4"
          >
            {!isLogin && (
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Full Name</label>
                <input type="text" placeholder="Jane Doe" required className="w-full border border-slate-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white" />
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input type="email" placeholder="you@company.com" required className="w-full border border-slate-300 pl-11 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Password</label>
              <input type="password" placeholder="••••••••" required className="w-full border border-slate-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white" />
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button type="button" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Forgot password?</button>
              </div>
            )}

            <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-3.5 rounded-xl font-bold hover:from-indigo-700 hover:to-violet-700 shadow-md shadow-indigo-200 mt-2 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
              {isLogin ? "Sign In" : "Create Account"} <ArrowRight size={18} />
            </button>
          </form>

          {/* Toggle Login / Signup */}
          <div className="mt-8 text-center text-sm font-medium text-slate-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
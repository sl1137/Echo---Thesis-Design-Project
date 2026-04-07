"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleGoogle() {
    setLoading(true);
    await supabaseBrowser.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function handleEmail() {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    setError("");
    const { error: signInError } = await supabaseBrowser.auth.signInWithPassword({ email, password });
    if (signInError) {
      if (signInError.message.toLowerCase().includes("invalid login credentials") || signInError.message.toLowerCase().includes("email not confirmed")) {
        // Try sign up
        const { error: signUpError } = await supabaseBrowser.auth.signUp({ email, password });
        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
        }
        // onAuthStateChange in page.tsx handles redirect on success
      } else {
        setError(signInError.message);
        setLoading(false);
      }
    }
    // on success, onAuthStateChange fires automatically
  }

  return (
    <div className="relative flex flex-col h-dvh max-w-md mx-auto overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: "url('/enter page.png') center center / cover no-repeat",
        }}
      />

      {/* Echo title */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <h1
          className="text-6xl font-bold tracking-tight animate-fade-in-slow"
          style={{
            color: "#FFFFFF",
            textShadow: "0 2px 20px rgba(111,75,216,0.15), 0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          Echo
        </h1>
      </div>

      {/* Login area */}
      <div className="relative z-10 px-8 pb-10 space-y-3 animate-fade-in delay-300">

        {showEmail ? (
          /* ── Email form ── */
          <div className="space-y-2">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              className="w-full py-4 px-4 shadow-echo-sm text-[15px] text-echo-ink placeholder:text-echo-ink/40 outline-none"
              style={{
                borderRadius: "var(--radius-md)",
                background: "rgba(255,255,255,0.82)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.7)",
              }}
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleEmail()}
              className="w-full py-4 px-4 shadow-echo-sm text-[15px] text-echo-ink placeholder:text-echo-ink/40 outline-none"
              style={{
                borderRadius: "var(--radius-md)",
                background: "rgba(255,255,255,0.82)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.7)",
              }}
              autoComplete="current-password"
            />
            {error && (
              <p
                className="text-xs text-center px-3 py-2 rounded-lg"
                style={{ background: "rgba(255,255,255,0.7)", color: "#c0392b" }}
              >
                {error}
              </p>
            )}
            <button
              onClick={handleEmail}
              disabled={loading}
              className="w-full flex items-center justify-center py-4 shadow-echo-sm text-[15px] font-semibold text-echo-ink transition-all active:scale-[0.98] disabled:opacity-70"
              style={{
                borderRadius: "var(--radius-md)",
                background: "rgba(255,255,255,0.82)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.7)",
              }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-echo-ink/30 border-t-echo-ink rounded-full animate-spin" />
              ) : (
                "Continue with email"
              )}
            </button>
            <button
              onClick={() => { setShowEmail(false); setError(""); setEmail(""); setPassword(""); }}
              className="w-full text-center text-sm text-echo-ink/55 py-1 transition-opacity active:opacity-60"
            >
              ← Back to Google
            </button>
          </div>
        ) : (
          /* ── Google + email toggle ── */
          <>
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 glass-strong shadow-echo-sm text-[15px] font-semibold text-echo-ink transition-all active:scale-[0.98] disabled:opacity-70"
              style={{ borderRadius: "var(--radius-md)" }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-echo-ink/30 border-t-echo-ink rounded-full animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Continue with Google
            </button>
            <button
              onClick={() => setShowEmail(true)}
              className="w-full text-center text-sm text-echo-ink/55 py-1 transition-opacity active:opacity-60"
            >
              Use email instead
            </button>
          </>
        )}

        <p className="pt-2 text-center text-xs text-echo-ink-secondary/70 leading-relaxed">
          By signing up and using Echo, you agree to
          <br />
          our{" "}
          <span className="underline underline-offset-2">Terms of Service</span>
          {" "}and{" "}
          <span className="underline underline-offset-2">Privacy Policy</span>.
        </p>
      </div>

      <div className="relative z-10 flex justify-center pb-3">
        <div className="w-32 h-1 rounded-full bg-echo-ink/15" />
      </div>
    </div>
  );
}

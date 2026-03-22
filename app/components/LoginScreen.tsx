import DreamyBackground from "./DreamyBackground";

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  return (
    <div className="relative flex flex-col h-dvh max-w-md mx-auto overflow-hidden">
      <DreamyBackground />

      {/* Echo title — centered in upper-middle area */}
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

      {/* Login buttons */}
      <div className="relative z-10 px-8 pb-10 space-y-3 animate-fade-in delay-300">
        {/* Continue with Apple */}
        <button
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-3 py-4 glass-strong shadow-echo-sm text-[15px] font-semibold text-echo-ink transition-all active:scale-[0.98]"
          style={{ borderRadius: "var(--radius-md)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          Continue with Apple
        </button>

        {/* Continue with Google */}
        <button
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-3 py-4 glass-strong shadow-echo-sm text-[15px] font-semibold text-echo-ink transition-all active:scale-[0.98]"
          style={{ borderRadius: "var(--radius-md)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Terms of Service */}
        <p className="pt-3 text-center text-xs text-echo-ink-secondary/70 leading-relaxed">
          By signing up and using Echo, you agree to
          <br />
          our{" "}
          <span className="underline underline-offset-2">Terms of Service</span>
          {" "}and{" "}
          <span className="underline underline-offset-2">Privacy Policy</span>.
        </p>
      </div>

      {/* Bottom home indicator */}
      <div className="relative z-10 flex justify-center pb-3">
        <div className="w-32 h-1 rounded-full bg-echo-ink/15" />
      </div>
    </div>
  );
}

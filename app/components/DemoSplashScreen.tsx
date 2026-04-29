interface DemoSplashScreenProps {
  onContinue: () => void;
}

export default function DemoSplashScreen({ onContinue }: DemoSplashScreenProps) {
  return (
    <div className="relative flex flex-col h-dvh max-w-md mx-auto overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{ background: "url('/enter page.png') center center / cover no-repeat" }}
      />

      <div className="relative z-10 flex-1 flex flex-col justify-between px-6 pt-16 pb-10">
        {/* Top: title */}
        <div>
          <h1
            className="text-[30px] font-bold leading-tight"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--on_surface)",
              textShadow: "0 2px 12px rgba(255,255,255,0.7)",
            }}
          >
            Echo
          </h1>
          <p
            className="mt-1 text-[14px]"
            style={{
              fontFamily: "var(--font-sans)",
              color: "#6A7A8A",
              textShadow: "0 1px 6px rgba(255,255,255,0.6)",
            }}
          >
            A prototype demo — emotional support for international grad students
          </p>
        </div>

        {/* Middle: explanation card */}
        <div
          className="rounded-2xl px-5 py-5"
          style={{
            background: "rgba(255,255,255,0.78)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.6)",
          }}
        >
          {/* Guest */}
          <div className="flex gap-3 items-start">
            <span className="text-[22px] mt-0.5">👤</span>
            <div>
              <p className="text-[14px] font-semibold" style={{ color: "#1A2A3A" }}>
                Continue as Guest
              </p>
              <p className="text-[13px] leading-relaxed mt-0.5" style={{ color: "#5A6A7A" }}>
                Sample content is pre-filled — mood logs, drift bottles, and replies — so you can explore the full experience right away.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div
            className="my-4"
            style={{ height: 1, background: "rgba(100,130,160,0.12)" }}
          />

          {/* Email */}
          <div className="flex gap-3 items-start">
            <span className="text-[22px] mt-0.5">✉️</span>
            <div>
              <p className="text-[14px] font-semibold" style={{ color: "#1A2A3A" }}>
                Sign in with email
              </p>
              <p className="text-[13px] leading-relaxed mt-0.5" style={{ color: "#5A6A7A" }}>
                Creates a real account. Everything starts empty — no sample data, just you building from scratch.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom: CTA */}
        <button
          onClick={onContinue}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-[15px] font-semibold transition-all active:scale-95 hover:opacity-90"
          style={{
            borderRadius: "var(--radius-pill)",
            background: "rgba(255,245,243,0.85)",
            color: "#2D1B4E",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.5)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="13 17 18 12 13 7" />
            <polyline points="6 17 11 12 6 7" />
          </svg>
          Enter the demo
        </button>
      </div>

      <div className="relative z-10 flex justify-center pb-3">
        <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.5)" }} />
      </div>
    </div>
  );
}

interface EnterScreenProps {
  onEnter: () => void;
}

export default function EnterScreen({ onEnter }: EnterScreenProps) {
  return (
    <div className="relative flex flex-col h-dvh max-w-md mx-auto overflow-hidden">
      {/* Background: new enter page illustration */}
      <div
        className="absolute inset-0"
        style={{
          background: "url('/enter page.png') center center / cover no-repeat",
        }}
      />

      {/* Content overlay - positioned to harmonize with the illustration */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-6 pb-10 pt-8">
        {/* Title - uses Noto Serif for editorial feel */}
        <h1
          className="text-[28px] font-bold leading-tight animate-fade-in"
          style={{
            fontFamily: "var(--font-serif)",
            color: "var(--on_surface)",
            textShadow: "0 2px 12px rgba(255,255,255,0.7), 0 1px 3px rgba(45,21,19,0.15)",
          }}
        >
          Hold Space for
          <br />
          Your Mind and Heart
        </h1>

        {/* Subtitle - uses Plus Jakarta Sans */}
        <p
          className="mt-3 text-[15px] leading-relaxed animate-fade-in delay-200"
          style={{
            fontFamily: "var(--font-sans)",
            color: "var(--on_surface)",
            textShadow: "0 1px 8px rgba(255,255,255,0.5)",
          }}
        >
          Understand your emotions, reflect more clearly,
          <br />
          and receive gentle support — all in one place.
        </p>

        {/* Primary CTA Button - matches screenshot style */}
        <button
          onClick={onEnter}
          className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3.5 text-[15px] font-semibold transition-all active:scale-95 hover:opacity-90 animate-fade-in delay-400"
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
          Enter the Island
        </button>
      </div>

      {/* Bottom navigation hint - subtle indicator */}
      <div className="relative z-10 flex justify-center pb-3">
        <div
          className="w-10 h-1 rounded-full"
          style={{
            backgroundColor: "rgba(255,255,255,0.5)",
            backdropFilter: "blur(4px)",
          }}
        />
      </div>
    </div>
  );
}

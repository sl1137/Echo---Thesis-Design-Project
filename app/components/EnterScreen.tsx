import DreamyBackground from "./DreamyBackground";

interface EnterScreenProps {
  onEnter: () => void;
}

export default function EnterScreen({ onEnter }: EnterScreenProps) {
  return (
    <div className="relative flex flex-col h-dvh max-w-md mx-auto overflow-hidden">
      <DreamyBackground />

      {/* Content pinned to bottom */}
      <div className="relative z-10 mt-auto px-7 pb-14">
        <h1 className="text-[28px] font-bold leading-tight text-echo-ink animate-fade-in">
          Hold Space for
          <br />
          Your Mind and Heart
        </h1>

        <p className="mt-3 text-[15px] leading-relaxed text-echo-ink-secondary animate-fade-in delay-200">
          Understand your emotions, reflect more clearly,
          <br />
          and receive gentle support — all in one place.
        </p>

        <button
          onClick={onEnter}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3.5 glass-strong shadow-echo-lg text-[15px] font-semibold text-echo-ink transition-all active:scale-95 hover:shadow-echo-lg animate-fade-in delay-400"
          style={{ borderRadius: "var(--radius-pill)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="13 17 18 12 13 7" />
            <polyline points="6 17 11 12 6 7" />
          </svg>
          Enter the Island
        </button>
      </div>

      {/* Bottom home indicator hint */}
      <div className="relative z-10 flex justify-center pb-3">
        <div className="w-32 h-1 rounded-full bg-echo-ink/15" />
      </div>
    </div>
  );
}

import BottomNav from "./BottomNav";

const RECENT_TOPICS = [
  "Explore yourself",
  "Anxiety",
  "Analyze personal growth",
  "The perfectionism trap",
];

const MICRO_PRACTICES = [
  { id: 1, title: "3-Minute Breathing", color: "#DDEBFA" },
  { id: 2, title: "Gratitude Check-in", color: "#F6DDE9" },
  { id: 3, title: "Body Scan", color: "#E9E2F8" },
  { id: 4, title: "Thought Reframe", color: "#F7E8B8" },
];

interface HomeScreenProps {
  onStartChat: () => void;
  onNavigate: (tab: "home" | "drift" | "history") => void;
}

export default function HomeScreen({ onStartChat, onNavigate }: HomeScreenProps) {
  return (
    <div
      className="flex flex-col h-dvh max-w-md mx-auto overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #FBF6F0 0%, #F6F0EA 50%, #F0EBF5 100%)",
      }}
    >
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 pt-5 pb-2">
        <button
          className="w-11 h-11 rounded-full glass flex items-center justify-center shadow-echo-sm"
          aria-label="Menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E1F5E" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>

        {/* Avatar placeholder */}
        <div
          className="w-11 h-11 rounded-full shadow-echo-sm overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #DDEBFA, #E9E2F8, #F6DDE9)",
          }}
        >
          <div className="w-full h-full flex items-center justify-center text-lg">
            🌿
          </div>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Greeting section */}
        <section className="px-6 pt-4 pb-2 animate-fade-in">
          <p className="text-[15px] text-echo-ink-secondary font-medium">Good morning,</p>
          <h1 className="text-[26px] font-bold leading-snug text-echo-ink mt-0.5">
            How have things
            <br />
            been today?
          </h1>

          {/* Start New Chat CTA */}
          <button
            onClick={onStartChat}
            className="mt-4 inline-flex items-center gap-2 px-5 py-3 bg-echo-ink text-white text-[14px] font-semibold shadow-echo-sm transition-all active:scale-95"
            style={{ borderRadius: "var(--radius-sm)" }}
          >
            Start New Chat
          </button>
        </section>

        {/* Recent Chat */}
        <section className="px-6 pt-6 animate-fade-in delay-200">
          <h2 className="text-[16px] font-bold text-echo-ink mb-3">Recent Chat</h2>
          <div className="flex flex-wrap gap-2">
            {RECENT_TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={onStartChat}
                className="px-4 py-2.5 text-[13px] font-medium text-echo-ink glass shadow-echo-sm transition-all active:scale-95"
                style={{ borderRadius: "var(--radius-pill)" }}
              >
                {topic}
              </button>
            ))}
          </div>
        </section>

        {/* Micro-practice */}
        <section className="px-6 pt-7 pb-6 animate-fade-in delay-400">
          <h2 className="text-[16px] font-bold text-echo-ink mb-3">Micro-practice</h2>
          <div className="grid grid-cols-2 gap-3">
            {MICRO_PRACTICES.map((practice) => (
              <div
                key={practice.id}
                className="aspect-[4/3] flex flex-col justify-end p-4 shadow-echo-sm"
                style={{
                  background: practice.color,
                  borderRadius: "var(--radius-md)",
                }}
              >
                <p className="text-[13px] font-semibold text-echo-ink mb-2">{practice.title}</p>
                <div className="flex items-center gap-1.5 text-echo-ink/70">
                  <span className="text-[12px] font-medium">Learn More</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 16 16 12 12 8" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Bottom Navigation */}
      <BottomNav active="home" onNavigate={onNavigate} />
    </div>
  );
}

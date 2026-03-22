interface BottomNavProps {
  active: "home" | "drift" | "history";
  onNavigate: (tab: "home" | "drift" | "history") => void;
}

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
  const tabs = [
    {
      id: "home" as const,
      label: "Home",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      id: "drift" as const,
      label: "Drift Sea",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12c2-3 4-4 6-4s4 2 6 2 4-2 6-2 2 1 2 1" />
          <path d="M2 17c2-3 4-4 6-4s4 2 6 2 4-2 6-2 2 1 2 1" />
          <path d="M2 7c2-3 4-4 6-4s4 2 6 2 4-2 6-2 2 1 2 1" />
        </svg>
      ),
    },
    {
      id: "history" as const,
      label: "History",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      ),
    },
  ];

  return (
    <div className="px-4 pb-5 pt-2">
      <nav
        className="flex items-center justify-around py-2.5 glass-strong shadow-echo-lg"
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 transition-colors ${
                isActive
                  ? "text-echo-ink"
                  : "text-echo-ink/35"
              }`}
            >
              <span style={{ stroke: "currentColor" }}>{tab.icon}</span>
              <span className={`text-[11px] ${isActive ? "font-semibold" : "font-medium"}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="w-4 h-0.5 rounded-full bg-echo-ink mt-0.5" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

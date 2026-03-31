export type Tab = "island" | "drift" | "profile";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "island",
      label: "Island",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C8 2 4 5.5 4 9c0 5 8 13 8 13s8-8 8-13c0-3.5-4-7-8-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      ),
    },
    {
      id: "drift",
      label: "Drift Sea",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10c1.5-2 3-3 4.5-3s3 1.5 4.5 1.5S15 7 16.5 7 19 8 21 10" />
          <path d="M3 15c1.5-2 3-3 4.5-3s3 1.5 4.5 1.5S15 12 16.5 12 19 13 21 15" />
          <path d="M3 20c1.5-2 3-3 4.5-3s3 1.5 4.5 1.5S15 17 16.5 17 19 18 21 20" />
        </svg>
      ),
    },
    {
      id: "profile",
      label: "Profile",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      ),
    },
  ];

  return (
    <div className="px-4 pb-5 pt-2">
      <nav
        className="flex items-center justify-around py-3 glass-strong shadow-echo-lg"
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 px-5 py-1 transition-all active:scale-95 ${
                isActive ? "text-echo-ink" : "text-echo-ink/30"
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

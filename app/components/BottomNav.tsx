"use client";

type Tab = "island" | "drift" | "profile";

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
    <div className="px-5 pb-5 pt-2">
      <nav
        className="flex items-center justify-around py-1.5 px-1.5"
        style={{
          borderRadius: 999,
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.09)",
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-0.5 px-5 py-2"
              style={{
                borderRadius: 999,
                background: isActive ? "rgba(255,255,255,0.95)" : "transparent",
                boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.10)" : "none",
                transform: isActive ? "translateY(-1px) scale(1.04)" : "translateY(0) scale(1)",
                transition: "all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              <span style={{ color: isActive ? "#1a1a3e" : "rgba(26,26,62,0.35)", stroke: "currentColor" }}>
                {tab.icon}
              </span>
              <span
                className={`text-[11px] ${isActive ? "font-semibold" : "font-medium"}`}
                style={{ color: isActive ? "#1a1a3e" : "rgba(26,26,62,0.35)" }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

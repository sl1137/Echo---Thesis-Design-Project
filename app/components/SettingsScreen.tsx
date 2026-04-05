"use client";

import { useState } from "react";

// ─── Toggle ───────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      aria-checked={on}
      role="switch"
      className="flex-shrink-0 transition-all active:scale-95"
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        background: on ? "#6F7FF2" : "rgba(120,120,128,0.28)",
        position: "relative",
        border: "none",
        cursor: "pointer",
        transition: "background 0.2s ease",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: on ? 18 : 2,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.22)",
          transition: "left 0.2s ease",
        }}
      />
    </button>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────
function Row({
  icon,
  label,
  toggle,
  onToggle,
  toggled,
  showDivider = true,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  toggle?: boolean;
  onToggle?: (v: boolean) => void;
  toggled?: boolean;
  showDivider?: boolean;
  onClick?: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-3 px-4 py-[14px]" onClick={onClick} style={{ cursor: onClick ? "pointer" : undefined }}>
        <span style={{ color: "#3a3a5a", flexShrink: 0 }}>{icon}</span>
        <span className="flex-1 text-[15px] font-medium" style={{ color: "#1a1a3e" }}>
          {label}
        </span>
        {toggle && onToggle !== undefined ? (
          <Toggle on={!!toggled} onChange={onToggle} />
        ) : (
          <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
            <path d="M1 1l5 5-5 5" stroke="#b0b0c8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      {showDivider && (
        <div style={{ height: 1, background: "rgba(0,0,0,0.06)", marginLeft: 52 }} />
      )}
    </>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.72)",
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: "0 1px 8px rgba(100,120,200,0.08)",
      }}
    >
      {children}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────
const IconPerson = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const IconLock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);
const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const IconMoon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);
const IconSupport = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><circle cx="12" cy="17" r=".5" fill="currentColor" />
  </svg>
);
const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><circle cx="12" cy="16" r=".5" fill="currentColor" />
  </svg>
);
const IconInfo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><circle cx="12" cy="8" r=".5" fill="currentColor" />
  </svg>
);
const IconGlobe = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const IconLogout = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// ─── SettingsScreen ───────────────────────────────────────────────────
export default function SettingsScreen({ onBack, onLogout }: { onBack: () => void; onLogout?: () => void }) {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div
      className="h-full overflow-y-auto"
      style={{
        backgroundImage: "url('/island-new-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-6">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.72)", borderRadius: 12, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
          aria-label="Back"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a3e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-[20px] font-bold" style={{ color: "#1a1a3e" }}>Settings</h1>
      </div>

      <div className="px-4 pb-12">
        {/* User card */}
        <Card>
          <div className="flex items-center gap-3 px-4 py-4">
            <img
              src="/user-avatar.jpg"
              alt="User"
              style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-bold" style={{ color: "#1a1a3e" }}>Cynthia Liang</p>
              <p className="text-[13px]" style={{ color: "#6a6a8a" }}>Student &amp; photographer</p>
            </div>
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M1 1l5 5-5 5" stroke="#b0b0c8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Card>

        {/* Other Settings label */}
        <p className="text-[13px] font-semibold px-1 mt-6 mb-2" style={{ color: "#6a6a8a" }}>
          Other Settings
        </p>

        {/* Settings card */}
        <Card>
          <Row icon={<IconPerson />} label="Profile Details" />
          <Row icon={<IconLock />} label="Password" />
          <Row icon={<IconBell />} label="Notifications" />
          <Row
            icon={<IconMoon />}
            label="Dark Mode"
            toggle
            toggled={darkMode}
            onToggle={setDarkMode}
            showDivider={false}
          />
        </Card>

        {/* Support card */}
        <div className="mt-4">
        <Card>
          <Row icon={<IconSupport />} label="Support" />
          <Row icon={<IconAlert />} label="Report an Issue" />
          <Row icon={<IconInfo />} label="About Echo" />
          <Row icon={<IconGlobe />} label="Language" showDivider={false} />
        </Card>
        </div>

        {/* Log out card */}
        <div className="mt-4">
        <Card>
          <Row icon={<IconLogout />} label="Log out" showDivider={false} onClick={onLogout} />
        </Card>
        </div>
      </div>
    </div>
  );
}

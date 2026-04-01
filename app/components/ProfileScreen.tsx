"use client";

import { useState, useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────────────
type TimeRange = "1w" | "2w" | "1m";

interface DayRecord {
  date: Date;
  conversations: ConversationRecord[];
}

interface ConversationRecord {
  id: string;
  time: string;
  summary: string;
  emotions: string[];
}

// ─── Calendar Strip ───────────────────────────────────────────────────
function getWeekDates(anchor: Date): Date[] {
  const day = anchor.getDay();
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function CalendarStrip({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}) {
  const today = new Date();
  const weekDates = useMemo(() => getWeekDates(today), []);

  return (
    <div
      className="mx-5 mb-4 p-3"
      style={{
        background: "var(--surface_container_low)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <div className="flex justify-between items-center mb-2 px-1">
        <span
          className="text-[12px] font-semibold"
          style={{ color: "var(--on_surface)", opacity: 0.45 }}
        >
          {today.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-[10px] font-medium pb-1"
            style={{ color: "var(--on_surface)", opacity: 0.4 }}
          >
            {label}
          </div>
        ))}
        {weekDates.map((date, i) => {
          const isToday = date.toDateString() === today.toDateString();
          const isSelected = date.toDateString() === selectedDate.toDateString();
          return (
            <button
              key={i}
              onClick={() => onSelectDate(date)}
              className="flex flex-col items-center justify-center py-1.5 transition-all active:scale-90"
              style={{
                borderRadius: "var(--radius-md)",
                background: isSelected
                  ? "var(--secondary)"
                  : isToday
                  ? "var(--surface_container)"
                  : "transparent",
              }}
            >
              <span
                className="text-[15px] font-semibold"
                style={{
                  color: isSelected
                    ? "white"
                    : "var(--on_surface)",
                }}
              >
                {date.getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Mood Chart Placeholder ───────────────────────────────────────────
function MoodChart({ range }: { range: TimeRange }) {
  const labels: Record<TimeRange, string> = {
    "1w": "Past 7 days",
    "2w": "Past 14 days",
    "1m": "Past 30 days",
  };

  // Mock sparkline data (would come from real data later)
  const points = [60, 45, 70, 55, 80, 65, 75];

  const width = 280;
  const height = 80;
  const padX = 10;
  const padY = 10;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const polyline = points
    .map((v, i) => {
      const x = padX + (i / (points.length - 1)) * chartW;
      const y = padY + chartH - (v / 100) * chartH;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div
      className="mx-5 mb-4 p-4"
      style={{
        background: "var(--surface_container_low)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-[14px] font-bold"
          style={{ color: "var(--on_surface)" }}
        >
          Mood Trend
        </h3>
        <span
          className="text-[12px]"
          style={{ color: "var(--on_surface)", opacity: 0.45 }}
        >
          {labels[range]}
        </span>
      </div>

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* Area fill */}
        <defs>
          <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--secondary)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`${padX},${padY + chartH} ${polyline} ${padX + chartW},${padY + chartH}`}
          fill="url(#moodGrad)"
        />
        <polyline
          points={polyline}
          fill="none"
          stroke="var(--secondary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dots */}
        {points.map((v, i) => {
          const x = padX + (i / (points.length - 1)) * chartW;
          const y = padY + chartH - (v / 100) * chartH;
          return (
            <circle key={i} cx={x} cy={y} r="3" fill="var(--secondary)" />
          );
        })}
      </svg>

      <p
        className="text-[11px] mt-2"
        style={{ color: "var(--on_surface)", opacity: 0.4 }}
      >
        Based on conversation mood analysis
      </p>
    </div>
  );
}

// ─── Conversation Record Item ─────────────────────────────────────────
function ConversationItem({ record }: { record: ConversationRecord }) {
  return (
    <div
      className="mb-3 p-4 shadow-echo-sm"
      style={{
        background: "var(--surface_container_lowest)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--surface_container)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[12px] font-semibold"
          style={{ color: "var(--on_surface)", opacity: 0.45 }}
        >
          {record.time}
        </span>
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded-full"
          style={{
            background: "var(--secondary_container)",
            color: "var(--on_secondary_container)",
          }}
        >
          View Card
        </span>
      </div>
      <p
        className="text-[13px] leading-snug mb-2"
        style={{ color: "var(--on_surface)" }}
      >
        {record.summary}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {record.emotions.map((e) => (
          <span
            key={e}
            className="text-[11px] px-2 py-0.5 rounded-full"
            style={{
              background: "var(--surface_container)",
              color: "var(--on_surface)",
              opacity: 0.7,
            }}
          >
            {e}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── ProfileScreen ────────────────────────────────────────────────────
export default function ProfileScreen({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [timeRange, setTimeRange] = useState<TimeRange>("1w");

  // Mock: no real conversation data in MVP
  const recordsForDate: ConversationRecord[] = [];

  return (
    <div className="h-full overflow-y-auto" style={{ background: "var(--surface)" }}>
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-4">
        <img
          src="/user-avatar.jpg"
          alt="You"
          className="w-12 h-12 rounded-full flex-shrink-0"
          style={{ objectFit: "cover" }}
        />
        <div className="flex-1 min-w-0">
          <p
            className="text-[16px] font-bold"
            style={{ color: "var(--on_surface)" }}
          >
            Your Journal
          </p>
          <p
            className="text-[12px]"
            style={{ color: "var(--on_surface)", opacity: 0.45 }}
          >
            Conversation & mood history
          </p>
        </div>
        <button
          onClick={() => onOpenSettings?.()}
          className="w-9 h-9 flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
          style={{ background: "var(--surface_container_low)", borderRadius: 12 }}
          aria-label="Settings"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--on_surface)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Calendar */}
      <CalendarStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* Records for selected date */}
      <div className="px-5 mb-5">
        <p
          className="text-[12px] font-semibold mb-3"
          style={{ color: "var(--on_surface)", opacity: 0.45 }}
        >
          {selectedDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </p>

        {recordsForDate.length === 0 ? (
          <div
            className="py-8 text-center"
            style={{
              background: "var(--surface_container_low)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <p
              className="text-[13px]"
              style={{ color: "var(--on_surface)", opacity: 0.4 }}
            >
              No conversations on this day
            </p>
          </div>
        ) : (
          recordsForDate.map((r) => <ConversationItem key={r.id} record={r} />)
        )}
      </div>

      {/* Mood Trend */}
      <div className="mb-1">
        {/* Time range selector */}
        <div className="flex gap-2 px-5 mb-3">
          {(["1w", "2w", "1m"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className="px-3 py-1.5 text-[12px] font-semibold transition-all active:scale-95"
              style={{
                borderRadius: "var(--radius-pill)",
                background:
                  timeRange === r
                    ? "var(--secondary_container)"
                    : "var(--surface_container_low)",
                color:
                  timeRange === r
                    ? "var(--on_secondary_container)"
                    : "var(--on_surface)",
                opacity: timeRange === r ? 1 : 0.6,
              }}
            >
              {r === "1w" ? "1 week" : r === "2w" ? "2 weeks" : "1 month"}
            </button>
          ))}
        </div>
        <MoodChart range={timeRange} />
      </div>

      {/* Export Snapshot */}
      <div className="px-5 pb-8">
        <button
          className="w-full py-3.5 text-[14px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{
            background: "var(--surface_container_low)",
            color: "var(--on_surface)",
            borderRadius: "var(--radius-lg)",
            border: "1.5px solid var(--surface_container_high)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export Snapshot
        </button>
        <p
          className="text-center text-[11px] mt-2"
          style={{ color: "var(--on_surface)", opacity: 0.35 }}
        >
          Save as image to share with your counselor
        </p>
      </div>
    </div>
  );
}

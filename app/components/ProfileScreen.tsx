"use client";

import { useState, useMemo } from "react";
import type { SessionRecord, CardData, ChatMessage } from "../page";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─── Month Calendar Overlay ───────────────────────────────────────────
function getMonthDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  // Monday-based offset
  const startOffset = (first.getDay() + 6) % 7;
  const days: (Date | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

function MonthCalendarOverlay({
  selectedDate,
  onSelectDate,
  onClose,
}: {
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  onClose: () => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  const days = useMemo(() => getMonthDays(viewYear, viewMonth), [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", {
    month: "long", year: "numeric",
  });

  return (
    <>
      {/* Backdrop */}
      <div className="absolute inset-0 z-40" onClick={onClose} />
      {/* Dropdown card */}
      <div
        className="absolute z-50 p-4"
        style={{
          top: 90,
          left: 16,
          right: 16,
          background: "rgba(255,255,255,0.94)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: 24,
          boxShadow: "0 2px 12px rgba(80,70,160,0.07)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center transition-all active:scale-90" style={{ borderRadius: 12, background: "rgba(255,255,255,0.6)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A4A6A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="text-[16px] font-bold" style={{ color: "#1A1A2A" }}>{monthLabel}</span>
          <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center transition-all active:scale-90" style={{ borderRadius: 12, background: "rgba(255,255,255,0.6)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A4A6A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map(l => (
            <div key={l} className="text-center text-[11px] font-medium py-1" style={{ color: "#888899" }}>{l}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {days.map((date, i) => {
            if (!date) return <div key={i} />;
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === today.toDateString();
            return (
              <button
                key={i}
                onClick={() => { onSelectDate(date); onClose(); }}
                className="flex items-center justify-center py-1 transition-all active:scale-90"
              >
                <span
                  className="w-9 h-9 flex items-center justify-center text-[15px] font-semibold"
                  style={{
                    borderRadius: "50%",
                    background: isSelected ? "#E8909A" : isToday ? "rgba(255,255,255,0.7)" : "transparent",
                    color: isSelected ? "white" : "#1A1A2A",
                    border: isToday && !isSelected ? "1.5px solid #E8909A" : "none",
                  }}
                >
                  {date.getDate()}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </>
  );
}

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

// ─── Calendar Strip ───────────────────────────────────────────────────
function CalendarStrip({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}) {
  const today = new Date();
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  return (
    <div className="px-4 mb-4">
      <div className="grid grid-cols-7 text-center">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-[11px] font-medium pb-1"
            style={{ color: "#888899" }}
          >
            {label}
          </div>
        ))}
        {weekDates.map((date, i) => {
          const isSelected = date.toDateString() === selectedDate.toDateString();
          return (
            <button
              key={i}
              onClick={() => onSelectDate(date)}
              className="flex items-center justify-center py-1 transition-all active:scale-90"
            >
              <span
                className="w-9 h-9 flex items-center justify-center text-[17px] font-bold"
                style={{
                  borderRadius: "50%",
                  background: isSelected ? "#E8909A" : "transparent",
                  color: isSelected ? "white" : "#1A1A2A",
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

// ─── Mood Chart ───────────────────────────────────────────────────────
const EMOTIONS_W = [
  { label: "Happiness", color: "#E8C455", pct: 51 },
  { label: "Calmness",  color: "#6B8F5E", pct: 72 },
  { label: "Anger",     color: "#D4897A", pct: 23 },
  { label: "Excitement",color: "#7EB3D8", pct: 77 },
  { label: "Sadness",   color: "#A8A0C8", pct: 64 },
  { label: "Stress",    color: "#C97B6A", pct: 89 },
];

const EMOTIONS_M = [
  { label: "Happiness", color: "#E8C455", pct: 68 },
  { label: "Calmness",  color: "#6B8F5E", pct: 55 },
  { label: "Anger",     color: "#D4897A", pct: 41 },
  { label: "Excitement",color: "#7EB3D8", pct: 48 },
  { label: "Sadness",   color: "#A8A0C8", pct: 83 },
  { label: "Stress",    color: "#C97B6A", pct: 76 },
];

function MoodChart({
  view,
  onViewChange,
  onOpenSnapshot,
}: {
  view: "W" | "M";
  onViewChange: (v: "W" | "M") => void;
  onOpenSnapshot: () => void;
}) {
  const emotions = view === "W" ? EMOTIONS_W : EMOTIONS_M;
  const maxPct = Math.max(...emotions.map((e) => e.pct));
  const chartH = 130;

  return (
    <div
      className="mx-4 mb-4 p-4"
      style={{ background: "rgba(255,255,255,0.72)", borderRadius: 20, boxShadow: "0 2px 12px rgba(80,70,160,0.07)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[16px] font-bold" style={{ color: "#1A1A2A" }}>
            Satisfaction
          </p>
          <p className="text-[11px]" style={{ color: "#A0AEC0" }}>
            Based on daily mood log
          </p>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <button onClick={onOpenSnapshot} className="transition-all active:scale-90" aria-label="Snapshot">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#A0AEC0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          {(["W", "M"] as const).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className="text-[12px] font-semibold w-7 h-7 flex items-center justify-center transition-all active:scale-90"
              style={{
                borderRadius: "50%",
                background: view === v ? "#2D3A4A" : "transparent",
                color: view === v ? "white" : "#A0AEC0",
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Bars */}
      <div className="flex items-end justify-between" style={{ height: chartH }}>
        {emotions.map((e) => {
          const h = Math.max((e.pct / (maxPct * 1.05)) * chartH, 8);
          return (
            <div
              key={e.label}
              className="flex flex-col items-center justify-end"
              style={{ flex: 1 }}
            >
              <div
                style={{
                  width: 28,
                  height: h,
                  background: e.color,
                  borderRadius: 999,
                }}
              />
              <span
                className="text-[10px] mt-1.5"
                style={{ color: "#A0AEC0" }}
              >
                {e.pct}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
        {emotions.map((e) => (
          <div key={e.label} className="flex items-center gap-1">
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: e.color,
                flexShrink: 0,
              }}
            />
            <span className="text-[10px]" style={{ color: "#A0AEC0" }}>
              {e.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AI Suggestions ───────────────────────────────────────────────────
const SUGGESTIONS = [
  "You've been feeling more anxious this week — try the 4-7-8 breathing exercise before bed.",
  "Your calmness score dipped mid-week. Short walks or body scans may help reset your baseline.",
  "Excitement was high on Wednesday — notice what was different that day and try to recreate it.",
  "Stress peaked toward the weekend. Consider setting a lighter schedule on Fridays as a buffer.",
];

function AISuggestions() {
  return (
    <div className="mx-4 mb-6">
      <p
        className="text-[13px] font-semibold mb-2 px-1"
        style={{ color: "#1A1A2A" }}
      >
        AI Suggestions{" "}
        <span style={{ color: "#7B8FA0" }}>✦</span>
      </p>
      <div className="p-4" style={{ background: "rgba(255,255,255,0.72)", borderRadius: 20, boxShadow: "0 2px 12px rgba(80,70,160,0.07)" }}>
        <p className="text-[12px] mb-4" style={{ color: "#A0AEC0" }}>
          Based on weekly mood trend
        </p>
        {SUGGESTIONS.map((text, i) => (
          <div key={i} className="flex items-start gap-3 mb-4 last:mb-0">
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#C8B8E8",
                flexShrink: 0,
                marginTop: 3,
              }}
            />
            <p className="text-[13px] leading-snug" style={{ color: "#4A5A6A" }}>
              {text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Trend data ──────────────────────────────────────────────────────
const TREND_W = [55, 62, 48, 73, 69, 78, 65]; // Mon–Sun
const TREND_M = [52, 59, 67, 74];              // Wk 1–4
const TREND_W_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TREND_M_LABELS = ["Wk 1", "Wk 2", "Wk 3", "Wk 4"];

// ─── Smooth area chart ────────────────────────────────────────────────
function TrendLine({ points, color }: { points: number[]; color: string }) {
  const W = 280, H = 68, padX = 8, padY = 8;
  const cW = W - padX * 2, cH = H - padY * 2;
  const max = Math.max(...points);
  const coords = points.map((v, i) => ({
    x: padX + (i / (points.length - 1)) * cW,
    y: padY + cH - (v / (max * 1.08)) * cH,
  }));

  // Smooth cubic bezier path
  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    const cx = (coords[i - 1].x + coords[i].x) / 2;
    d += ` C ${cx} ${coords[i - 1].y}, ${cx} ${coords[i].y}, ${coords[i].x} ${coords[i].y}`;
  }
  const area = `${d} L ${coords[coords.length - 1].x} ${padY + cH} L ${coords[0].x} ${padY + cH} Z`;

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#trendGrad)" />
      <path d={d} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r="3" fill={color} />
      ))}
    </svg>
  );
}

// ─── Snapshot Overlay ────────────────────────────────────────────────
function SnapshotOverlay({ view, onClose }: { view: "W" | "M"; onClose: () => void }) {
  const emotions = view === "W" ? EMOTIONS_W : EMOTIONS_M;
  const trend = view === "W" ? TREND_W : TREND_M;
  const trendLabels = view === "W" ? TREND_W_LABELS : TREND_M_LABELS;
  const topEmotion = [...emotions].sort((a, b) => b.pct - a.pct)[0];
  const topTags = [...emotions].sort((a, b) => b.pct - a.pct).slice(0, 4);
  const avgMood = Math.round(trend.reduce((a, b) => a + b, 0) / trend.length);
  const bestDayIdx = trend.indexOf(Math.max(...trend));
  const bestDay = trendLabels[bestDayIdx];
  const label = view === "W" ? "This Week" : "This Month";
  const dateRange = view === "W" ? "Mar 28 – Apr 3, 2026" : "Mar 2026";
  const [dlState, setDlState] = useState<"idle" | "loading" | "done">("idle");

  function handleExport() {
    if (dlState !== "idle") return;
    setDlState("loading");
    setTimeout(() => setDlState("done"), 1800);
    setTimeout(() => { setDlState("idle"); onClose(); }, 3200);
  }

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(220,210,248,0.30)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full animate-pop-in"
        style={{
          background: "rgba(255,255,255,0.95)",
          borderRadius: 28,
          boxShadow: "0 12px 40px rgba(100,80,160,0.12)",
          maxHeight: "82vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <img src="/user-avatar.jpg" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
            <div>
              <p className="text-[14px] font-bold" style={{ color: "#1A1A2A" }}>Cynthia Liang</p>
              <p className="text-[10px]" style={{ color: "#888899" }}>📅 {dateRange}</p>
            </div>
          </div>
          <button onClick={onClose} className="transition-all active:scale-90">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888899" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "0 16px 10px" }} />

        {/* ── This week at a glance ── */}
        <div className="px-4 mb-3">
          <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#A0AEC0" }}>
            {label} at a glance
          </p>
          <p className="text-[12px] leading-snug mb-2" style={{ color: "#3A4A5A" }}>
            {view === "W"
              ? "You had a notably high-energy week — excitement and stress both peaked, while calmness served as a steady anchor through the busier days. Anger stayed low throughout, and your mood trend shows a strong upward arc by the weekend."
              : "This month saw elevated sadness and stress in the first half, but your mood trended meaningfully upward through weeks 3 and 4. Happiness rose steadily — a positive shift worth acknowledging."}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {topTags.map((e) => (
              <span key={e.label} className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                style={{ background: e.color + "22", color: e.color, border: `1.2px solid ${e.color}55` }}>
                {e.label}
              </span>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "0 16px 10px" }} />

        {/* ── Emotional pattern ── */}
        <div className="px-4 mb-3">
          <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "#A0AEC0" }}>
            Emotional pattern
          </p>
          <TrendLine points={trend} color={topEmotion.color} />
          <div className="flex justify-between mt-1">
            {trendLabels.map((l) => (
              <span key={l} className="text-[8px]" style={{ color: "#B0BEC8" }}>{l}</span>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "0 16px 10px" }} />

        {/* ── Key stats 2×2 ── */}
        <div className="px-4 mb-4 grid grid-cols-2 gap-2">
          {[
            { label: "Top emotion", value: topEmotion.label, sub: `${topEmotion.pct}%`, color: topEmotion.color },
            { label: "Best day", value: bestDay, sub: `${Math.max(...trend)}% mood`, color: "#7EB3D8" },
            { label: "Avg mood", value: `${avgMood}%`, sub: "this period", color: "#6B8F5E" },
            { label: "vs last period", value: view === "W" ? "+8%" : "+5%", sub: "overall ↑", color: "#A8A0C8" },
          ].map((s) => (
            <div key={s.label} className="p-2.5 rounded-xl" style={{ background: s.color + "14" }}>
              <p className="text-[9px] font-medium mb-0.5" style={{ color: "#888899" }}>{s.label}</p>
              <p className="text-[15px] font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px]" style={{ color: "#A0AEC0" }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Export button ── */}
        <div className="px-4 pb-4">
          <button
            onClick={handleExport}
            className="w-full py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{ borderRadius: 14, background: dlState === "done" ? "#6B8F5E" : "#2D3A4A", color: "white", fontSize: 14, fontWeight: 600 }}
          >
            {dlState === "idle" && (<>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Save to Photos
            </>)}
            {dlState === "loading" && (<>
              <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              Saving…
            </>)}
            {dlState === "done" && (<>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Saved to Photos
            </>)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Session Detail Overlay ───────────────────────────────────────────
function SessionDetailOverlay({
  session,
  onClose,
}: {
  session: SessionRecord;
  onClose: () => void;
}) {
  const { card, messages } = session;
  const [tab, setTab] = useState<"analysis" | "transcript">("analysis");

  // Match profile page blue palette
  const BG = "radial-gradient(ellipse at 50% 25%, #BDD3EA 0%, #CCDDF2 30%, #DCE9F5 60%, #EDF3FA 100%)";
  const CARD_BG = "rgba(255,255,255,0.62)";
  const CARD_QUOTE = "linear-gradient(135deg, rgba(180,210,240,0.70) 0%, rgba(200,220,250,0.70) 100%)";
  const TAG_BG = "rgba(255,255,255,0.80)";
  const TEXT = "#1A1A2A";
  const MUTED = "rgba(26,42,58,0.45)";
  const TAB_PILL = "rgba(30,60,100,0.10)";
  const TAB_ACTIVE = "rgba(255,255,255,0.80)";

  return (
    <div className="absolute inset-0 z-50 flex flex-col animate-fade-in" style={{ background: BG }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-3 flex-shrink-0">
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90" style={{ background: "rgba(255,255,255,0.55)" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex p-1 rounded-full" style={{ background: TAB_PILL }}>
            {(["analysis", "transcript"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 py-1.5 text-[13px] font-semibold rounded-full transition-all"
                style={{ background: tab === t ? TAB_ACTIVE : "transparent", color: TEXT, opacity: tab === t ? 1 : 0.45, boxShadow: tab === t ? "0 1px 4px rgba(30,60,100,0.10)" : "none" }}>
                {t === "analysis" ? "Analysis" : "Transcript"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === "analysis" && (
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
          <div className="p-4" style={{ background: CARD_QUOTE, borderRadius: 18, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: MUTED }}>You are seen</p>
            <p className="text-[15px] leading-relaxed font-medium" style={{ color: TEXT }}>"{card.validation_sentence}"</p>
          </div>
          {card.emotion_tags.length > 0 && (
            <div className="p-4" style={{ background: CARD_BG, borderRadius: 18, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: MUTED }}>Feelings</p>
              <div className="flex flex-wrap gap-2">
                {card.emotion_tags.map((tag) => (
                  <span key={tag} className="px-3 py-1.5 text-[13px] font-semibold" style={{ background: TAG_BG, color: TEXT, borderRadius: 999 }}>{tag}</span>
                ))}
              </div>
            </div>
          )}
          <div className="p-4" style={{ background: CARD_BG, borderRadius: 18, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: MUTED }}>Summary</p>
            <p className="text-[14px] leading-relaxed" style={{ color: TEXT }}>{card.summary}</p>
          </div>
          <div className="p-4" style={{ background: CARD_BG, borderRadius: 18, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: MUTED }}>Insight</p>
            <p className="text-[14px] leading-relaxed" style={{ color: TEXT }}>{card.insight}</p>
          </div>
        </div>
      )}

      {tab === "transcript" && (
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3 pt-1">
          {messages.length === 0 ? (
            <p className="text-[13px] text-center mt-8" style={{ color: MUTED }}>No transcript</p>
          ) : messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="px-4 py-2.5 text-[14px] leading-relaxed" style={{
                maxWidth: "80%",
                borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: m.role === "user" ? "rgba(160,200,240,0.55)" : "rgba(255,255,255,0.62)",
                color: TEXT,
              }}>{m.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Maps emotion tags to mood character images
// mood-1: dizzy/overwhelmed bear  mood-2: frustrated yellow  mood-3: happy pink heart
// mood-4: peaceful green ghost    mood-5: sad/neutral oval
function getMoodImage(tags: string[]): string {
  const t = tags.map((s) => s.toLowerCase()).join(" ");
  if (/overwhelm|anxious|stress|panic|spiral|dizzy|lost|confus/.test(t)) return "/mood-1.png";
  if (/tired|exhaust|frustrat|stuck|flat|low energy|heavy|drain/.test(t)) return "/mood-2.png";
  if (/happy|content|relief|grateful|good|better|hopeful|warm/.test(t)) return "/mood-3.png";
  if (/calm|peace|quiet|settled|safe|ground|present/.test(t)) return "/mood-4.png";
  if (/sad|lonely|numb|empty|miss|disconn|hollow/.test(t)) return "/mood-5.png";
  return "/mood-3.png"; // default: friendly
}

// ─── ProfileScreen ────────────────────────────────────────────────────
export default function ProfileScreen({
  onOpenSettings,
  sessions = [],
}: {
  onOpenSettings?: () => void;
  sessions?: SessionRecord[];
}) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [chartView, setChartView] = useState<"W" | "M">("W");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(null);

  const dailySessions = sessions.filter((s) =>
    s.timestamp.toDateString() === selectedDate.toDateString()
  );

  return (
    <div className="h-full relative">
    <div
      className="h-full overflow-y-auto"
      style={{
        backgroundImage: "url('/island-new-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-10 pb-4 flex items-center gap-3">
        <img
          src="/user-avatar.jpg"
          alt="You"
          className="w-14 h-14 rounded-full flex-shrink-0"
          style={{ objectFit: "cover" }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-bold" style={{ color: "#1A1A2A" }}>
            Cynthia Liang
          </p>
          <p className="text-[13px]" style={{ color: "#888899" }}>
            Student &amp; photographer
          </p>
        </div>
        {/* Right icons */}
        <div className="flex flex-col items-center justify-between self-stretch flex-shrink-0">
          <button
            onClick={() => onOpenSettings?.()}
            aria-label="Settings"
            className="transition-all active:scale-90"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8A88AA"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button aria-label="Full calendar" className="transition-all active:scale-90" onClick={() => setShowCalendar(true)}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8A88AA"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Strip */}
      <CalendarStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* Daily Activity */}
      <div className="mx-4 mb-4">
        <p className="text-[13px] font-semibold mb-2 px-1" style={{ color: "#1A1A2A" }}>
          Daily Activity
        </p>
        {dailySessions.length === 0 ? (
          <div className="flex flex-col items-center py-6" style={{ background: "rgba(255,255,255,0.72)", borderRadius: 20, boxShadow: "0 2px 12px rgba(80,70,160,0.07)" }}>
            <img src="/mood-empty.png" alt="no sessions" style={{ width: 64, height: 64, objectFit: "contain", marginBottom: 8 }} />
            <p className="text-[14px] font-semibold" style={{ color: "#1A1A2A" }}>
              {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
            </p>
            <p className="text-[13px]" style={{ color: "#A0AEC0" }}>No sessions recorded</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {dailySessions.map((s) => {
              const moodImg = getMoodImage(s.card.emotion_tags);
              return (
              <button
                key={s.id}
                onClick={() => setSelectedSession(s)}
                className="w-full text-left flex items-center gap-3 px-4 py-3.5 transition-all active:scale-[0.98]"
                style={{ background: "rgba(255,255,255,0.72)", borderRadius: 18, boxShadow: "0 2px 12px rgba(80,70,160,0.07)" }}
              >
                <img src={moodImg} alt="mood" style={{ width: 40, height: 40, objectFit: "contain", flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold truncate" style={{ color: "#1A1A2A" }}>
                    {s.card.title || s.card.summary?.replace(/\.$/, "").slice(0, 48) || "Chat session"}
                  </p>
                  <p className="text-[12px]" style={{ color: "#A0AEC0" }}>
                    {s.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} · {s.messages.length} messages
                  </p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Mood Trend */}
      <div className="mx-4 mb-1">
        <p
          className="text-[13px] font-semibold mb-2 px-1"
          style={{ color: "#1A1A2A" }}
        >
          Mood Trend
        </p>
      </div>
      <MoodChart view={chartView} onViewChange={setChartView} onOpenSnapshot={() => setShowSnapshot(true)} />

      {/* AI Suggestions */}
      <AISuggestions />

    </div>

      {/* Snapshot Overlay — outside scrollable div, inside relative wrapper */}
      {showSnapshot && (
        <SnapshotOverlay view={chartView} onClose={() => setShowSnapshot(false)} />
      )}

      {/* Month Calendar Overlay */}
      {showCalendar && (
        <MonthCalendarOverlay
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {/* Session Detail Overlay */}
      {selectedSession && (
        <SessionDetailOverlay
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}

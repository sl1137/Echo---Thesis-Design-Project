"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRealtimeVoice, VoiceStatus } from "../hooks/useRealtimeVoice";
import type { CardData, ChatMessage as Message, SessionRecord } from "../page";
import { PracticeSessionOverlay, CATEGORIES } from "./IslandScreen";

type ChatMode = "text" | "voice-input" | "voice-full";

const PAGE_BG = "radial-gradient(ellipse at 50% 12%, #dde5ff 0%, #e9ecfc 45%, #eeeaf8 100%)";
const VOICE_BG_IMAGE = "url('/voice-bg.png')";

// ─── Crisis detection (mirrors server-side list) ──────────────────────
const CRISIS_KEYWORDS = [
  "suicide", "kill myself", "end my life", "self-harm", "self harm",
  "hurt myself", "cut myself", "don't want to live", "want to die",
  "take my life", "no reason to live", "better off dead",
  "自杀", "自残", "伤害自己", "割腕", "不想活", "想死", "结束生命", "了结自己",
  "活不下去", "不想活了",
];
function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

// ─── Inline card shared style ─────────────────────────────────────────
const INLINE_CARD_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1.5px dashed rgba(100,120,180,0.25)",
  borderRadius: 20,
  padding: "16px",
};

const LINK_ICON = (accent: string) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

// ─── Crisis Inline Card (urgent resources) ────────────────────────────
function CrisisInlineCard({ onSafe }: { onSafe: () => void }) {
  const resources = [
    { name: "988 Suicide & Crisis Lifeline", detail: "Call or text 988 · 24/7 (US)", href: "https://988lifeline.org", accent: "#3A5A9A" },
    { name: "Crisis Text Line", detail: "Text HOME to 741741", href: "https://www.crisistextline.org", accent: "#7A5AAA" },
    { name: "Find a Helpline", detail: "International · 200+ countries", href: "https://findahelpline.com", accent: "#3A7A5A" },
  ];

  return (
    <div className="px-4 py-1.5 animate-fade-in flex-shrink-0">
      <div style={INLINE_CARD_STYLE}>
        <p className="text-[13px] leading-relaxed mb-3" style={{ color: "#4A5A6A" }}>
          If you're having thoughts of harming yourself or don't feel safe right now, please reach out to someone who can truly help.
        </p>
        <div className="flex flex-col gap-1.5 mb-3">
          {resources.map((r) => (
            <a
              key={r.name}
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all active:scale-[0.98]"
              style={{ background: `${r.accent}08`, textDecoration: "none" }}
            >
              <div>
                <p className="text-[12.5px] font-semibold" style={{ color: r.accent }}>{r.name}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#8A9AAA" }}>{r.detail}</p>
              </div>
              {LINK_ICON(r.accent)}
            </a>
          ))}
        </div>
        <button
          onClick={onSafe}
          className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all active:scale-[0.98]"
          style={{ background: "rgba(90,106,138,0.08)", color: "#5A6A8A", border: "none", cursor: "pointer" }}
        >
          I'm safe right now
        </button>
      </div>
    </div>
  );
}

// ─── Ongoing Support Card (therapist resources) ───────────────────────
function OngoingSupportCard() {
  const resources = [
    { name: "Psychology Today", detail: "Find a therapist near you", href: "https://www.psychologytoday.com/us/therapists", accent: "#C05A20" },
    { name: "Open Path Collective", detail: "Affordable therapy · $30–$80/session", href: "https://openpathcollective.org", accent: "#3A7A5A" },
    { name: "BetterHelp", detail: "Online therapy — text, voice, or video", href: "https://www.betterhelp.com", accent: "#3A5A9A" },
    { name: "Talkspace", detail: "Online therapy with licensed therapists", href: "https://www.talkspace.com", accent: "#7A5AAA" },
  ];

  return (
    <div className="px-4 py-1.5 animate-fade-in flex-shrink-0">
      <div style={INLINE_CARD_STYLE}>
        <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "#9AA0B0" }}>
          Find ongoing support
        </p>
        <div className="flex flex-col gap-1.5">
          {resources.map((r) => (
            <a
              key={r.name}
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all active:scale-[0.98]"
              style={{ background: `${r.accent}08`, textDecoration: "none" }}
            >
              <div>
                <p className="text-[12.5px] font-semibold" style={{ color: r.accent }}>{r.name}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#8A9AAA" }}>{r.detail}</p>
              </div>
              {LINK_ICON(r.accent)}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Practice Nudge (in-chat suggestion) ──────────────────────────────
const PRACTICE_NAMES: Record<string, { name: string; category: string; color: string }> = {
  slow_exhale: { name: "Slow Exhale", category: "Stabilize", color: "#3A5A9A" },
  pause_with_me: { name: "Pause with Me", category: "Stabilize", color: "#3A5A9A" },
  come_back_to_room: { name: "Come Back to the Room", category: "Stabilize", color: "#3A5A9A" },
  reset_my_body: { name: "Reset My Body", category: "Stabilize", color: "#3A5A9A" },
  name_whats_here: { name: "Name What's Here", category: "Clarify", color: "#7A6A2A" },
  catch_the_thought: { name: "Catch the Thought", category: "Clarify", color: "#7A6A2A" },
  check_the_facts: { name: "Check the Facts", category: "Clarify", color: "#7A6A2A" },
  why_hitting_hard: { name: "Why Is This Hitting So Hard?", category: "Clarify", color: "#7A6A2A" },
  one_tiny_next_step: { name: "One Tiny Next Step", category: "Reframe & Act", color: "#8A4A5A" },
  map_the_fog: { name: "Map the Fog", category: "Reframe & Act", color: "#8A4A5A" },
  a_fairer_thought: { name: "A Fairer Thought", category: "Reframe & Act", color: "#8A4A5A" },
  say_it_clearly: { name: "Say It Clearly", category: "Reframe & Act", color: "#8A4A5A" },
  what_would_help_future_me: { name: "What Would Help Future Me?", category: "Reframe & Act", color: "#8A4A5A" },
};

function PracticeNudge({
  practiceId,
  onAccept,
  onLater,
}: {
  practiceId: string;
  onAccept: () => void;
  onLater: () => void;
}) {
  const info = PRACTICE_NAMES[practiceId] || { name: practiceId, category: "", color: "#3A5A9A" };

  return (
    <div className="px-4 py-2 animate-fade-in">
      <div
        style={{
          background: "rgba(255,255,255,0.88)",
          borderRadius: 20,
          padding: "14px 16px",
          boxShadow: "0 2px 16px rgba(80,70,160,0.10)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: `1px solid ${info.color}20`,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-2">
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: `${info.color}12`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={info.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: info.color, letterSpacing: 0.3 }}>
              Echo suggests a practice
            </p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#1A2A3A", lineHeight: 1.2 }}>
              {info.name}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-2.5">
          <button
            onClick={onAccept}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 transition-all active:scale-95"
            style={{
              background: info.color,
              borderRadius: 12,
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Try it now
          </button>
          <button
            onClick={onLater}
            className="flex-1 flex items-center justify-center py-2 transition-all active:scale-95"
            style={{
              background: `${info.color}10`,
              borderRadius: 12,
              color: info.color,
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Orb Image ────────────────────────────────────────────────────────
function Orb({
  size,
  animate = false,
  live = false,
  glow = false,
}: {
  size: number;
  animate?: boolean;
  live?: boolean;   // float + slow rotation for voice-full mode
  glow?: boolean;
}) {
  const anim = live
    ? "orbLive 22s ease-in-out infinite"
    : animate
    ? "float 6s ease-in-out infinite"
    : undefined;

  return (
    <img
      src="/orb.png"
      alt="Echo"
      draggable={false}
      style={{
        width: size,
        height: size,
        objectFit: "cover",
        borderRadius: "50%",
        flexShrink: 0,
        animation: anim,
        filter: glow
          ? "drop-shadow(0 0 36px rgba(160,180,255,0.65)) drop-shadow(0 0 70px rgba(140,160,240,0.35))"
          : "drop-shadow(0 4px 14px rgba(140,160,240,0.25))",
        transition: "filter 0.5s ease",
      }}
    />
  );
}

// ─── Chat Header ──────────────────────────────────────────────────────
function ChatHeader({
  onBack,
  isEnding,
}: {
  onBack: () => void;
  isEnding: boolean;
}) {
  return (
    <header className="relative flex items-center justify-between px-4 pt-16 pb-3 flex-shrink-0">
      {/* Back */}
      <button
        onClick={onBack}
        disabled={isEnding}
        className="w-9 h-9 flex items-center justify-center transition-all active:scale-90 z-10 disabled:opacity-50"
        style={{
          background: "rgba(255,255,255,0.72)",
          borderRadius: 12,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.5)",
        }}
        aria-label="Back"
      >
        {isEnding ? (
          <span className="w-3.5 h-3.5 border-2 border-current/40 border-t-current rounded-full animate-spin" style={{ color: "#1a1a3e" }} />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a3e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        )}
      </button>

      {/* Title — absolutely centered so it's always in the middle */}
      <span
        className="absolute left-0 right-0 text-center text-[17px] font-bold pointer-events-none"
        style={{ color: "#1a1a3e" }}
      >
        Chat with Echo
      </span>

      {/* Right placeholder to balance the back button width */}
      <div className="w-9 h-9" aria-hidden />
    </header>
  );
}

// ─── Validation Card Overlay ──────────────────────────────────────────
function SessionTabs({
  tab,
  onChange,
}: {
  tab: "analysis" | "transcript";
  onChange: (t: "analysis" | "transcript") => void;
}) {
  return (
    <div className="flex p-1 rounded-full" style={{ background: "var(--surface_container)" }}>
      {(["analysis", "transcript"] as const).map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className="flex-1 py-1.5 text-[13px] font-semibold rounded-full transition-all"
          style={{
            background: tab === t ? "var(--surface_container_lowest)" : "transparent",
            color: tab === t ? "var(--on_surface)" : "var(--on_surface)",
            opacity: tab === t ? 1 : 0.45,
            boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
          }}
        >
          {t === "analysis" ? "Analysis" : "Transcript"}
        </button>
      ))}
    </div>
  );
}

function ValidationCardOverlay({
  card,
  messages,
  onClose,
}: {
  card: CardData;
  messages: Message[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"analysis" | "transcript">("analysis");

  // Colors pulled from PAGE_BG palette
  const BG = "radial-gradient(ellipse at 50% 12%, #dde5ff 0%, #e9ecfc 45%, #eeeaf8 100%)";
  const CARD_BG = "rgba(255,255,255,0.72)";
  const CARD_QUOTE = "linear-gradient(135deg, rgba(200,210,255,0.7) 0%, rgba(220,205,255,0.7) 100%)";
  const TAG_BG = "rgba(255,255,255,0.75)";
  const TEXT = "#1a1a3e";
  const MUTED = "rgba(26,26,62,0.45)";
  const TAB_PILL = "rgba(26,26,62,0.10)";
  const TAB_ACTIVE = "rgba(255,255,255,0.80)";

  return (
    <div className="absolute inset-0 z-50 flex flex-col animate-fade-in" style={{ background: BG }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-16 pb-3 flex-shrink-0">
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
                style={{ background: tab === t ? TAB_ACTIVE : "transparent", color: TEXT, opacity: tab === t ? 1 : 0.45, boxShadow: tab === t ? "0 1px 4px rgba(26,26,62,0.10)" : "none" }}>
                {t === "analysis" ? "Analysis" : "Transcript"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      {tab === "analysis" && (
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
          <div className="p-4" style={{ background: CARD_QUOTE, borderRadius: 18, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: MUTED }}>You are seen</p>
            <p className="text-[15px] leading-relaxed font-medium" style={{ fontFamily: "var(--font-serif)", color: TEXT }}>"{card.validation_sentence}"</p>
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
            <p className="text-[13px] text-center mt-8" style={{ color: MUTED }}>No transcript recorded</p>
          ) : messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="px-4 py-2.5 text-[14px] leading-relaxed" style={{
                maxWidth: "80%",
                borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: m.role === "user" ? "rgba(246,221,233,0.80)" : "rgba(255,255,255,0.72)",
                color: TEXT,
              }}>{m.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────────────────
function ChatBubble({ message }: { message: Message }) {
  const isEcho = message.role === "echo";
  return (
    <div
      className={`flex items-end ${isEcho ? "justify-start" : "justify-end"}`}
      style={{ animation: "bubbleFadeIn 0.4s ease forwards" }}
    >
      {isEcho && <div style={{ marginRight: 4 }}><Orb size={48} /></div>}
      <div
        style={{
          maxWidth: "72%",
          padding: "10px 16px",
          background: "rgba(255,255,255,0.72)",
          color: "#1a1a3e",
          borderRadius: isEcho ? "18px 18px 18px 4px" : "18px 18px 4px 18px",
          fontSize: 15,
          lineHeight: 1.55,
          boxShadow: "0 1px 6px rgba(100,120,200,0.08)",
        }}
      >
        {message.text}
      </div>
      {!isEcho && (
        <img
          src="/user-avatar.jpg"
          alt="You"
          draggable={false}
          style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0, marginLeft: 8 }}
        />
      )}
    </div>
  );
}

// ─── Chat Message List ────────────────────────────────────────────────
const ONGOING_SUPPORT_MARKER = "[ONGOING_SUPPORT_CARD]";
const CRISIS_CARD_MARKER = "[CRISIS_CARD]";

function ChatMessages({
  messages,
  onCrisisSafe,
  children,
}: {
  messages: Message[];
  onCrisisSafe?: () => void;
  children?: React.ReactNode;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, children]);
  return (
    <div className="flex-1 overflow-y-auto py-4 space-y-3">
      {messages.map((msg) => {
        if (msg.text === ONGOING_SUPPORT_MARKER) {
          return <OngoingSupportCard key={msg.id} />;
        }
        if (msg.text === CRISIS_CARD_MARKER && onCrisisSafe) {
          return <CrisisInlineCard key={msg.id} onSafe={onCrisisSafe} />;
        }
        return (
          <div key={msg.id} className="px-4">
            <ChatBubble message={msg} />
          </div>
        );
      })}
      {children}
      <div ref={bottomRef} />
    </div>
  );
}

// ─── Text Input Bar ───────────────────────────────────────────────────
function TextInputBar({
  value, onChange, onSend, onSwitchToVoiceInput, onSwitchToVoiceFull, isLoading,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onSwitchToVoiceInput: () => void;
  onSwitchToVoiceFull: () => void;
  isLoading: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset textarea height when value is cleared (after send)
  useEffect(() => {
    if (!value && textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value]);

  return (
    <div className="px-4 pb-8 pt-2 flex-shrink-0">
      <div
        className="flex items-end gap-2 px-4 py-2"
        style={{
          background: "rgba(255,255,255,0.82)",
          borderRadius: 24,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 2px 16px rgba(100,120,220,0.10)",
          minHeight: 52,
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            // Auto-resize
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && value.trim()) { e.preventDefault(); onSend(); } }}
          placeholder="Message..."
          rows={1}
          className="flex-1 bg-transparent text-[15px] outline-none resize-none"
          style={{ color: "#1a1a3e", lineHeight: "36px", maxHeight: 120 }}
        />
        {/* Mic → voice-input */}
        <button
          onClick={onSwitchToVoiceInput}
          className="w-9 h-9 flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
          style={{ background: "rgba(80,90,160,0.10)", borderRadius: "50%" }}
          aria-label="Voice input"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3a3a7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        </button>
        {/* Waveform → voice-full */}
        <button
          onClick={onSwitchToVoiceFull}
          className="w-9 h-9 flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
          style={{ background: "rgba(80,90,160,0.10)", borderRadius: "50%" }}
          aria-label="Voice full mode"
        >
          <svg width="18" height="13" viewBox="0 0 22 16" fill="none">
            <rect x="0"    y="5"  width="3.5" height="6"  rx="1.75" fill="#3a3a7a" />
            <rect x="4.5"  y="2"  width="3.5" height="12" rx="1.75" fill="#3a3a7a" />
            <rect x="9"    y="0"  width="3.5" height="16" rx="1.75" fill="#3a3a7a" />
            <rect x="13.5" y="2"  width="3.5" height="12" rx="1.75" fill="#3a3a7a" />
            <rect x="18"   y="5"  width="3.5" height="6"  rx="1.75" fill="#3a3a7a" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Waveform Bars ────────────────────────────────────────────────────
// Matches image 6: 5 pill-shaped bars, bell-curve heights, dark color, animated
function WaveformBars({ playing }: { playing: boolean }) {
  const bars = [
    { h: 40,  delay: "0.00s" },
    { h: 72,  delay: "0.15s" },
    { h: 100, delay: "0.30s" },
    { h: 72,  delay: "0.45s" },
    { h: 40,  delay: "0.60s" },
  ];
  return (
    <div className="flex items-center gap-[10px]">
      {bars.map((bar, i) => (
        <div
          key={i}
          style={{
            width: 16,
            height: bar.h,
            borderRadius: 999,
            background: "#1a1a3e",
            transformOrigin: "center",
            animation: playing ? `voiceBar 1.1s ease-in-out ${bar.delay} infinite` : "none",
          }}
        />
      ))}
    </div>
  );
}

// ─── Voice Input Mode ─────────────────────────────────────────────────
function VoiceInputMode({
  isRecording,
  onStop,
  messages,
}: {
  isRecording: boolean;
  onStop: () => void;
  messages: Message[];
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-3 space-y-3">
        {messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)}
        <div ref={bottomRef} />
      </div>

      {/* Waveform — sits between messages and bottom bar, no visible divider */}
      <div className="flex-shrink-0 flex items-center justify-center" style={{ height: 140 }}>
        <WaveformBars playing={isRecording} />
      </div>

      {/* Bottom bar */}
      <div className="flex-shrink-0 px-4 pb-8">
        <div
          className="flex items-center gap-3 px-4"
          style={{
            background: "rgba(255,255,255,0.82)",
            borderRadius: 24,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 2px 16px rgba(100,120,220,0.10)",
            height: 52,
          }}
        >
          <span className="flex-1 text-[15px] select-none" style={{ color: "rgba(26,26,62,0.45)" }}>
            {isRecording ? "Recording..." : "Generating transcript..."}
          </span>
          {/* Stop button */}
          <button
            onClick={onStop}
            className="w-9 h-9 flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
            style={{ background: "#1a1a3e", borderRadius: "50%" }}
            aria-label="Stop recording"
          >
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="0" y="0" width="12" height="12" rx="2" fill="white" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Voice Full Mode ──────────────────────────────────────────────────
function VoiceFullMode({
  status,
  error,
  onConnect,
  onDisconnect,
  onSwitchToText,
  lastEchoText,
  streamingText,
  prevEchoText,
}: {
  status: VoiceStatus;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onSwitchToText: () => void;
  lastEchoText: string;
  streamingText: string;
  prevEchoText: string;
}) {
  const isActive = status === "connected";
  const isConnecting = status === "connecting";

  return (
    // relative container so we can absolutely-position the bottom buttons
    <div className="flex-1 relative" style={{ minWidth: 0 }}>
      {/* Orb + subtitle — fill all space above the button row (120px) */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-6"
        style={{ bottom: 120 }}
      >
        {/* Outer glow ring when active */}
        <div className="relative flex items-center justify-center">
          {isActive && (
            <div
              className="absolute rounded-full animate-breathe pointer-events-none"
              style={{
                width: 400,
                height: 400,
                background: "radial-gradient(circle, rgba(170,190,255,0.22) 0%, transparent 70%)",
              }}
            />
          )}
          {isConnecting && (
            <div
              className="absolute rounded-full animate-breathe pointer-events-none"
              style={{
                width: 380,
                height: 380,
                background: "radial-gradient(circle, rgba(170,190,255,0.12) 0%, transparent 70%)",
              }}
            />
          )}
          <Orb size={320} live glow={isActive} />
        </div>

        {/* Echo subtitle — two-layer animation */}
        <div
          className="relative text-center px-8"
          style={{ width: 300, minHeight: 80 }}
        >
          {/* Previous text — floats up and fades */}
          {prevEchoText && !streamingText && (
            <p
              key={`prev-${prevEchoText.slice(0, 20)}`}
              className="absolute inset-x-0 text-[15px] leading-relaxed text-center"
              style={{
                color: "#1a1a3e",
                opacity: 0,
                transform: "translateY(-24px)",
                animation: "subtitleFadeUp 0.5s ease forwards",
              }}
            >
              {prevEchoText}
            </p>
          )}
          {/* Current streaming text — fades in */}
          <p
            key={`stream-${streamingText ? "streaming" : lastEchoText.slice(0, 20)}`}
            className="text-[15px] leading-relaxed text-center"
            style={{
              color: "#1a1a3e",
              opacity: (streamingText || lastEchoText) ? 1 : 0,
              transition: "opacity 0.3s ease",
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {streamingText || lastEchoText || " "}
          </p>
        </div>

        {error && <p className="text-[12px] text-red-400 text-center">{error}</p>}
      </div>

      {/* Bottom controls — mic center aligned with screen center */}
      {/* offset = chat(48) + gap(24) + half-mic(32) = 104px */}
      <div
        className="absolute flex items-center gap-6"
        style={{ bottom: 48, left: "50%", transform: "translateX(-104px)" }}
      >
        {/* Chat icon button */}
        <button
          onClick={() => { onDisconnect(); onSwitchToText(); }}
          className="w-12 h-12 flex items-center justify-center transition-all active:scale-90"
          style={{
            background: "rgba(255,255,255,0.72)",
            borderRadius: 14,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.5)",
          }}
          aria-label="Switch to text"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3a3a7a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>

        {/* Mic button — large pink/mauve circle */}
        <button
          onClick={() => { if (isActive) onDisconnect(); else if (!isConnecting) onConnect(); }}
          disabled={isConnecting}
          className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-60"
          style={{
            background: isActive
              ? "linear-gradient(135deg, #c8a8e0, #b090cc)"
              : "rgba(200,175,225,0.75)",
            boxShadow: isActive
              ? "0 0 0 10px rgba(190,160,220,0.18), 0 4px 20px rgba(170,140,210,0.3)"
              : "0 2px 12px rgba(170,140,210,0.22)",
          }}
          aria-label={isActive ? "Stop" : "Start voice"}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── ChatScreen ───────────────────────────────────────────────────────
export default function ChatScreen({
  onBack,
  onSuggestPractice,
  onSaveSession,
  userId: authUserId,
}: {
  onBack: () => void;
  onSuggestPractice?: (p: { practiceId: string; categoryId: string }) => void;
  onSaveSession?: (s: SessionRecord) => void;
  userId?: string;
}) {
  const [mode, setMode] = useState<ChatMode>("text");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const suggestedRef = useRef(false);
  // One-shot bypass: when user explicitly asks for a method/practice, allow re-suggestion even if already suggested once
  const userAskedForPracticeRef = useRef(false);
  const [validationCard, setValidationCard] = useState<CardData | null>(null);
  const [lastEchoText, setLastEchoText] = useState("");
  const lastEchoTextRef = useRef("");
  const [streamingText, setStreamingText] = useState("");
  const [prevEchoText, setPrevEchoText] = useState("");
  const crisisShownRef = useRef(false); // prevent repeat triggers in same session
  const [practiceNudge, setPracticeNudge] = useState<{ practiceId: string; categoryId: string } | null>(null);
  const [activePractice, setActivePractice] = useState<{ practiceId: string; categoryId: string } | null>(null);

  // Stable user ID — prefer real auth userId, fall back to localStorage
  const userIdRef = useRef<string>(authUserId ?? "");
  useEffect(() => {
    if (authUserId) {
      userIdRef.current = authUserId;
    } else {
      let id = localStorage.getItem("echo_user_id");
      if (!id) { id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; localStorage.setItem("echo_user_id", id); }
      userIdRef.current = id;
    }
  }, [authUserId]);

  // voice-input recording
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Voice-full hook
  const handleTranscript = useCallback((role: "user" | "echo", text: string) => {
    if (role === "user" && detectCrisis(text) && !crisisShownRef.current) {
      crisisShownRef.current = true;
      setMessages((prev) => [...prev, { id: `crisis-${Date.now()}`, role: "echo", text: CRISIS_CARD_MARKER }]);
    }
    if (role === "echo") {
      setLastEchoText(text);
      lastEchoTextRef.current = text;
      setStreamingText("");
    }
    setMessages((prev) => [
      ...prev,
      { id: `voice-${Date.now()}-${Math.random()}`, role, text },
    ]);
  }, []);

  const handleTextDelta = useCallback((delta: string) => {
    setStreamingText((prev) => prev + delta);
  }, []);

  const handleResponseStart = useCallback(() => {
    // Move current streaming text to prev (fade out), reset streaming
    setStreamingText((current) => {
      setPrevEchoText(current || lastEchoTextRef.current);
      return "";
    });
  }, []);

  const { status: voiceStatus, error: voiceError, connect: connectVoice, disconnect: disconnectVoice } =
    useRealtimeVoice({ onTranscript: handleTranscript, onTextDelta: handleTextDelta, onResponseStart: handleResponseStart });

  // Opening message
  const hasOpenedRef = useRef(false);
  useEffect(() => {
    if (hasOpenedRef.current || messages.length > 0) return;
    hasOpenedRef.current = true;
    setIsLoading(true);
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "[OPENING]",
        conversation: [],
        userId: userIdRef.current,
        guestRecentContext: (() => {
          try {
            const saved = localStorage.getItem("echo_guest_sessions");
            if (!saved) return null;
            const sessions = JSON.parse(saved);
            const last = sessions[0];
            if (!last?.card) return null;
            return `Recent session: ${last.card.summary || ""} Topics: ${(last.card.emotion_tags || []).join(", ")}`;
          } catch { return null; }
        })(),
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        const bubbles: string[] = data.bubbles || ["Hi there! How's going?"];
        const ts = Date.now();
        bubbles.forEach((text, i) => {
          setMessages((prev) => {
            if (prev.some((m) => m.text === text)) return prev;
            return [...prev, { id: `${ts + i}`, role: "echo", text }];
          });
        });
      })
      .catch(() => setMessages([{ id: "1", role: "echo", text: "Hi there! How's going?" }]))
      .finally(() => setIsLoading(false));
  }, []);

  // Send text
  async function sendToEcho(
    userText: string,
    extra?: { practiceContext?: { name: string; description: string; completion: string } },
  ): Promise<string[]> {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userText,
        conversation: messages.slice(-20).map((m) => ({ role: m.role, content: m.text })),
        userId: userIdRef.current,
        ...(extra?.practiceContext ? { practiceContext: extra.practiceContext } : {}),
      }),
    });
    if (!res.ok) throw new Error("Chat error");
    const data = await res.json();
    if (data.crisis && !crisisShownRef.current) {
      crisisShownRef.current = true;
      setMessages((prev) => [...prev, { id: `crisis-${Date.now()}`, role: "echo", text: CRISIS_CARD_MARKER }]);
      return []; // Suppress Echo's normal response — wait for "I'm safe"
    }
    return data.bubbles?.filter((b: string) => b?.trim()) || [data.response || "I'm here."];
  }

  async function sendPracticeFollowup(p: { name: string; description: string; completion: string }) {
    try {
      const bubbles = await sendToEcho("[PRACTICE_COMPLETED]", { practiceContext: p });
      const ts = Date.now();
      for (let i = 0; i < bubbles.length; i++) {
        if (i > 0) await new Promise((r) => setTimeout(r, 900));
        setMessages((prev) => [...prev, { id: `${ts + i}`, role: "echo", text: bubbles[i] }]);
      }
    } catch {
      // silent fail — follow-up is a nice-to-have
    }
  }

  function maybeSuggestPractice(echoText: string) {
    const wasAsked = userAskedForPracticeRef.current;
    userAskedForPracticeRef.current = false; // consume the bypass flag after one attempt
    if (process.env.NODE_ENV !== "production") {
      console.log("[practiceNudge] try", { hasCallback: !!onSuggestPractice, alreadySuggested: suggestedRef.current, wasAsked, sampleText: echoText.slice(0, 120) });
    }
    if (!onSuggestPractice) return;
    if (suggestedRef.current && !wasAsked) return;
    const t = echoText.toLowerCase();
    let match: { practiceId: string; categoryId: string } | null = null;
    if (t.includes("breath") || t.includes("anxious") || t.includes("anxi") || t.includes("tense") || t.includes("racing heart") || t.includes("nervous") || t.includes("panic") ||
        t.includes("呼吸") || t.includes("焦虑") || t.includes("紧张") || t.includes("喘不过") || t.includes("心慌") || t.includes("睡不着"))
      match = { practiceId: "slow_exhale", categoryId: "stabilize" };
    else if (t.includes("spiral") || t.includes("pause") || t.includes("overwhelm") || t.includes("too much") || t.includes("can't handle") || t.includes("burnt out") || t.includes("burn out") || t.includes("stressed") || t.includes("stress") || t.includes("乱") ||
        t.includes("停一下") || t.includes("喘口气") || t.includes("透不过气") || t.includes("崩溃") || t.includes("承受") || t.includes("撑不住") || t.includes("受不了") || t.includes("压力") || t.includes("烦"))
      match = { practiceId: "pause_with_me", categoryId: "stabilize" };
    else if (t.includes("feel") || t.includes("emotion") || t.includes("sad") || t.includes("down") || t.includes("lonely") || t.includes("alone") || t.includes("numb") || t.includes("tired") || t.includes("exhausted") ||
        t.includes("感受") || t.includes("情绪") || t.includes("说不清") || t.includes("说不出") || t.includes("难过") || t.includes("低落") || t.includes("孤独") || t.includes("累") || t.includes("空"))
      match = { practiceId: "name_whats_here", categoryId: "clarify" };
    else if (t.includes("future") || t.includes("direction") || t.includes("career") ||
        t.includes("lost") || t.includes("fog") || t.includes("graduat") || t.includes("what to do with my life") ||
        t.includes("未来") || t.includes("方向") || t.includes("迷茫") || t.includes("毕业") || t.includes("前途") || t.includes("人生"))
      match = { practiceId: "map_the_fog", categoryId: "reframe" };
    else if (t.includes("step") || t.includes("stuck") || t.includes("task") || t.includes("don't know how") || t.includes("don't know where") || t.includes("can't start") || t.includes("frozen") || t.includes("paralyz") ||
        t.includes("不知道") || t.includes("卡住") || t.includes("迈出") || t.includes("第一步") || t.includes("做不了") || t.includes("没动力"))
      match = { practiceId: "one_tiny_next_step", categoryId: "reframe" };
    else if (t.includes("thought") || t.includes("reaction") || t.includes("automatic") || t.includes("mind racing") || t.includes("can't stop thinking") || t.includes("ruminat") ||
        t.includes("想法") || t.includes("脑子") || t.includes("自动") || t.includes("反应") || t.includes("一直想") || t.includes("停不下"))
      match = { practiceId: "catch_the_thought", categoryId: "clarify" };
    // Fallback: user explicitly asked but nothing matched → offer "Name What's Here" as a gentle starting point
    if (!match && wasAsked) match = { practiceId: "name_whats_here", categoryId: "clarify" };
    if (process.env.NODE_ENV !== "production") {
      console.log("[practiceNudge] result", match);
    }
    if (!match) return;
    suggestedRef.current = true;
    onSuggestPractice(match);
    setPracticeNudge(match);
  }

  function handleSend() {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", text: input.trim() };
    // Detect explicit ask for help/practice — bypass the once-per-session limit
    if (/\b(method|methods|way|ways|tip|tips|advice|exercise|practice|technique|recommend|suggest|something i can|what can i|how do i|how can i|help me|just help)\b/i.test(userMsg.text)
        || /(方法|办法|怎么办|有什么|有没有|帮我|帮帮|让我|怎样|如何|建议|练习|推荐|推一个|试一下|试试|教我|给我个|给我一个|什么能|有啥)/.test(userMsg.text)) {
      userAskedForPracticeRef.current = true;
    }
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    sendToEcho(userMsg.text)
      .then(async (bubbles) => {
        const ts = Date.now();
        // Snapshot of last few Echo messages — dedup against them so OpenAI doesn't re-emit the same line
        const recentEcho = messages
          .filter((m) => m.role === "echo")
          .slice(-5)
          .map((m) => m.text.trim());
        const inserted: string[] = [];
        for (let i = 0; i < bubbles.length; i++) {
          const text = bubbles[i].trim();
          if (recentEcho.includes(text) || inserted.includes(text)) {
            // Skip duplicate; preserve pacing only if more bubbles follow
            if (i < bubbles.length - 1) await new Promise((r) => setTimeout(r, 900));
            continue;
          }
          setMessages((prev) => [...prev, { id: `${ts + i}`, role: "echo", text }]);
          inserted.push(text);
          if (i < bubbles.length - 1) await new Promise((r) => setTimeout(r, 900));
        }
        // Match keywords across the user's ask + all Echo bubbles, so explicit asks are picked up
        maybeSuggestPractice([userMsg.text, ...bubbles].join(" "));
      })
      .catch(() => setMessages((prev) => [...prev, { id: `${Date.now()}`, role: "echo", text: "I'm here." }]))
      .finally(() => setIsLoading(false));
  }

  // Minimum user turns required to trigger validation card on back
  const VALIDATION_CARD_MIN_TURNS = 3;

  // Back button: if conversation is meaningful, save + show validation card; otherwise just leave
  function handleBack() {
    if (isEnding) return;
    const userTurns = messages.filter((m) => m.role === "user").length;
    if (userTurns >= VALIDATION_CARD_MIN_TURNS) {
      handleEndChat(); // generates card; ValidationCardOverlay's onClose triggers onBack
    } else {
      onBack();
    }
  }

  // End chat
  async function handleEndChat() {
    if (isEnding) return;
    if (mode === "voice-input") stopRecording();
    if (mode === "voice-full") disconnectVoice();
    setIsEnding(true);
    try {
      const conversation = messages.map((m) => ({ role: m.role, content: m.text }));
      const res = await fetch("/api/validation-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation }),
      });
      const card = await res.json();
      setValidationCard(card);
      onSaveSession?.({ id: Date.now().toString(), timestamp: new Date(), card, messages });
      // Suggest a practice based on emotion tags (guaranteed at session end)
      maybeSuggestPractice([card.summary, ...(card.emotion_tags ?? [])].join(" "));

      // Save to memory DB (fire-and-forget, don't block UI)
      if (userIdRef.current && card.summary) {
        fetch("/api/session-save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userIdRef.current,
            emotion_tags: card.emotion_tags ?? [],
            topics: card.title ? [card.title] : (card.emotion_tags ?? []),
            summary: card.summary,
            insight: card.insight,
            validation_sentence: card.validation_sentence,
          }),
        }).catch((e) => console.error("[memory] session-save failed:", e));
      }
    } catch {
      const card: CardData = {
        summary: "You took a moment to check in with yourself today.",
        emotion_tags: ["present"],
        insight: "Showing up, even briefly, is an act of care toward yourself.",
        validation_sentence: "Whatever you're carrying right now — it makes sense that it feels heavy.",
      };
      setValidationCard(card);
      onSaveSession?.({ id: Date.now().toString(), timestamp: new Date(), card, messages });
      maybeSuggestPractice("stressed anxious overwhelmed");
    } finally {
      setIsEnding(false);
    }
  }

  // Voice-input recording
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (blob.size < 500) { setMode("text"); return; }
        setIsLoading(true);
        try {
          const form = new FormData();
          form.append("audio", blob, "recording.webm");
          const res = await fetch("/api/transcribe", { method: "POST", body: form });
          const { text } = await res.json();
          if (!text?.trim()) { setMode("text"); return; }
          const userMsg: Message = { id: Date.now().toString(), role: "user", text: text.trim() };
          setMessages((prev) => [...prev, userMsg]);
          setMode("text");
          const bubbles = await sendToEcho(text.trim());
          const ts = Date.now();
          bubbles.forEach((t2, i) => setMessages((prev) => [...prev, { id: `${ts + i}`, role: "echo", text: t2 }]));
        } catch {
          setMode("text");
        } finally {
          setIsLoading(false);
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      setMode("text");
    }
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  }

  return (
    <div
      className="flex flex-col h-dvh max-w-md mx-auto overflow-hidden relative"
      style={mode === "voice-full"
        ? { backgroundImage: VOICE_BG_IMAGE, backgroundSize: "cover", backgroundPosition: "center" }
        : { background: PAGE_BG }
      }
    >
      {validationCard && (
        <ValidationCardOverlay
          card={validationCard}
          messages={messages}
          onClose={onBack}
        />
      )}

      <ChatHeader onBack={handleBack} isEnding={isEnding} />

      {mode === "text" && (
        <>
          <ChatMessages
            messages={messages}
            onCrisisSafe={() => {
              // Remove crisis card marker, send safe confirmation to API
              setMessages((prev) => prev.filter((m) => m.text !== CRISIS_CARD_MARKER));
              sendToEcho("[USER_CONFIRMED_SAFE]").then((bubbles) => {
                const ts = Date.now();
                bubbles.forEach((text, i) => setMessages((prev) => [...prev, { id: `${ts + i}`, role: "echo", text }]));
                // Insert ongoing support card after Echo's response
                setMessages((prev) => [...prev, { id: `ongoing-${Date.now()}`, role: "echo", text: ONGOING_SUPPORT_MARKER }]);
              });
            }}
          >
            {practiceNudge && (
              <PracticeNudge
                practiceId={practiceNudge.practiceId}
                onAccept={() => {
                  setActivePractice(practiceNudge);
                  setPracticeNudge(null);
                }}
                onLater={() => {
                  setPracticeNudge(null);
                  setMessages((prev) => [...prev, {
                    id: `${Date.now()}`,
                    role: "echo" as const,
                    text: "No worries — you can find this practice on your Island anytime. 🌊",
                  }]);
                }}
              />
            )}
          </ChatMessages>
          <TextInputBar
            value={input}
            onChange={setInput}
            onSend={handleSend}
            onSwitchToVoiceInput={() => { setMode("voice-input"); startRecording(); }}
            onSwitchToVoiceFull={() => setMode("voice-full")}
            isLoading={isLoading}
          />
        </>
      )}

      {mode === "voice-input" && (
        <VoiceInputMode
          isRecording={isRecording}
          onStop={() => { stopRecording(); setMode("text"); }}
          messages={messages}
        />
      )}

      {mode === "voice-full" && (
        <VoiceFullMode
          status={voiceStatus}
          error={voiceError}
          onConnect={connectVoice}
          onDisconnect={disconnectVoice}
          onSwitchToText={() => { disconnectVoice(); setMode("text"); }}
          lastEchoText={lastEchoText}
          streamingText={streamingText}
          prevEchoText={prevEchoText}
        />
      )}

      {activePractice && (() => {
        const cat = CATEGORIES.find((c) => c.id === activePractice.categoryId);
        const practice = cat?.practices.find((p) => p.id === activePractice.practiceId);
        if (!cat || !practice) return null;
        return (
          <PracticeSessionOverlay
            practice={practice}
            category={cat}
            onClose={() => setActivePractice(null)}
            onComplete={() => sendPracticeFollowup({
              name: practice.name,
              description: practice.description,
              completion: practice.completion,
            })}
            doneLabel="Continue to chat"
          />
        );
      })()}
    </div>
  );
}

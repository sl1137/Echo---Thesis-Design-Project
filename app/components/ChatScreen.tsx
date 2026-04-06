"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRealtimeVoice, VoiceStatus } from "../hooks/useRealtimeVoice";
import type { CardData, ChatMessage as Message, SessionRecord } from "../page";

type ChatMode = "text" | "voice-input" | "voice-full";

const PAGE_BG = "radial-gradient(ellipse at 50% 12%, #dde5ff 0%, #e9ecfc 45%, #eeeaf8 100%)";
const VOICE_BG_IMAGE = "url('/voice-bg.png')";

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
  onEndChat,
  isEnding,
}: {
  onBack: () => void;
  onEndChat: () => void;
  isEnding: boolean;
}) {
  return (
    <header className="relative flex items-center justify-between px-4 pt-12 pb-3 flex-shrink-0">
      {/* Back */}
      <button
        onClick={onBack}
        className="w-9 h-9 flex items-center justify-center transition-all active:scale-90 z-10"
        style={{
          background: "rgba(255,255,255,0.72)",
          borderRadius: 12,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.5)",
        }}
        aria-label="Back"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a3e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Title — absolutely centered so it's always in the middle */}
      <span
        className="absolute left-0 right-0 text-center text-[17px] font-bold pointer-events-none"
        style={{ color: "#1a1a3e" }}
      >
        Chat with Echo
      </span>

      {/* End Chat */}
      <button
        onClick={onEndChat}
        disabled={isEnding}
        className="px-4 h-9 flex items-center text-[13px] font-semibold transition-all active:scale-95 disabled:opacity-50"
        style={{
          background: "rgba(255,255,255,0.72)",
          color: "#1a1a3e",
          borderRadius: 999,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.5)",
        }}
      >
        {isEnding ? (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 border-2 border-current/40 border-t-current rounded-full animate-spin" />
            Saving…
          </span>
        ) : (
          "End Chat"
        )}
      </button>
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
  onContinue,
}: {
  card: CardData;
  messages: Message[];
  onClose: () => void;
  onContinue: () => void;
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
  const BTN_BG = "rgba(26,26,62,0.12)";

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
          <button onClick={onContinue} className="w-full py-3.5 text-[14px] font-semibold transition-all active:scale-[0.98]"
            style={{ background: BTN_BG, color: TEXT, borderRadius: 18, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
            Continue Chat
          </button>
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
    <div className={`flex items-end ${isEcho ? "justify-start" : "justify-end"}`}>
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
function ChatMessages({ messages }: { messages: Message[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)}
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
  return (
    <div className="px-4 pb-8 pt-2 flex-shrink-0">
      <div
        className="flex items-center gap-2 px-4"
        style={{
          background: "rgba(255,255,255,0.82)",
          borderRadius: 24,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 2px 16px rgba(100,120,220,0.10)",
          height: 52,
        }}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && value.trim()) { e.preventDefault(); onSend(); } }}
          placeholder="Message..."
          className="flex-1 bg-transparent text-[15px] outline-none"
          style={{ color: "#1a1a3e" }}
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
  onEndChat,
  lastEchoText,
}: {
  status: VoiceStatus;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onSwitchToText: () => void;
  onEndChat: () => void;
  lastEchoText: string;
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

        {/* Echo subtitle */}
        <p
          className="text-center text-[16px] leading-relaxed px-8"
          style={{
            color: "#1a1a3e",
            maxWidth: 300,
            opacity: lastEchoText ? 1 : 0,
            transition: "opacity 0.4s ease",
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {lastEchoText || " "}
        </p>

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
}: {
  onBack: () => void;
  onSuggestPractice?: (p: { practiceId: string; categoryId: string }) => void;
  onSaveSession?: (s: SessionRecord) => void;
}) {
  const [mode, setMode] = useState<ChatMode>("text");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const suggestedRef = useRef(false);
  const [validationCard, setValidationCard] = useState<CardData | null>(null);
  const [lastEchoText, setLastEchoText] = useState("");

  // voice-input recording
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Voice-full hook
  const handleTranscript = useCallback((role: "user" | "echo", text: string) => {
    if (role === "echo") setLastEchoText(text);
    setMessages((prev) => [
      ...prev,
      { id: `voice-${Date.now()}-${Math.random()}`, role, text },
    ]);
  }, []);

  const { status: voiceStatus, error: voiceError, connect: connectVoice, disconnect: disconnectVoice } =
    useRealtimeVoice({ onTranscript: handleTranscript });

  // Opening message
  const hasOpenedRef = useRef(false);
  useEffect(() => {
    if (hasOpenedRef.current || messages.length > 0) return;
    hasOpenedRef.current = true;
    setIsLoading(true);
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "[OPENING]", conversation: [] }),
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
  async function sendToEcho(userText: string): Promise<string[]> {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userText,
        conversation: messages.slice(-20).map((m) => ({ role: m.role, content: m.text })),
      }),
    });
    if (!res.ok) throw new Error("Chat error");
    const data = await res.json();
    return data.bubbles?.filter((b: string) => b?.trim()) || [data.response || "I'm here."];
  }

  function maybeSuggestPractice(echoText: string) {
    if (suggestedRef.current || !onSuggestPractice) return;
    const t = echoText.toLowerCase();
    let match = { practiceId: "slow_exhale", categoryId: "stabilize" };
    if (t.includes("breath") || t.includes("anxious") || t.includes("tense"))
      match = { practiceId: "slow_exhale", categoryId: "stabilize" };
    else if (t.includes("spiral") || t.includes("pause") || t.includes("overwhelm"))
      match = { practiceId: "pause_with_me", categoryId: "stabilize" };
    else if (t.includes("feel") || t.includes("emotion") || t.includes("name"))
      match = { practiceId: "name_whats_here", categoryId: "clarify" };
    else if (t.includes("step") || t.includes("stuck") || t.includes("task"))
      match = { practiceId: "one_tiny_next_step", categoryId: "reframe" };
    else if (t.includes("thought") || t.includes("reaction") || t.includes("automatic"))
      match = { practiceId: "catch_the_thought", categoryId: "clarify" };
    suggestedRef.current = true;
    onSuggestPractice(match);
  }

  function handleSend() {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    sendToEcho(userMsg.text)
      .then((bubbles) => {
        const ts = Date.now();
        bubbles.forEach((text, i) => setMessages((prev) => [...prev, { id: `${ts + i}`, role: "echo", text }]));
        maybeSuggestPractice(bubbles[bubbles.length - 1] ?? "");
      })
      .catch(() => setMessages((prev) => [...prev, { id: `${Date.now()}`, role: "echo", text: "I'm here." }]))
      .finally(() => setIsLoading(false));
  }

  // End chat
  async function handleEndChat() {
    if (isEnding) return;
    if (mode === "voice-input") stopRecording();
    if (mode === "voice-full") disconnectVoice();
    setIsEnding(true);
    try {
      const res = await fetch("/api/validation-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation: messages.map((m) => ({ role: m.role, content: m.text })) }),
      });
      const card = await res.json();
      setValidationCard(card);
      onSaveSession?.({ id: Date.now().toString(), timestamp: new Date(), card, messages });
    } catch {
      const card: CardData = {
        summary: "You took a moment to check in with yourself today.",
        emotion_tags: ["present"],
        insight: "Showing up, even briefly, is an act of care toward yourself.",
        validation_sentence: "Whatever you're carrying right now — it makes sense that it feels heavy.",
      };
      setValidationCard(card);
      onSaveSession?.({ id: Date.now().toString(), timestamp: new Date(), card, messages });
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
          onContinue={() => setValidationCard(null)}
        />
      )}

      <ChatHeader onBack={onBack} onEndChat={handleEndChat} isEnding={isEnding} />

      {mode === "text" && (
        <>
          <ChatMessages messages={messages} />
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
          onEndChat={handleEndChat}
          lastEchoText={lastEchoText}
        />
      )}
    </div>
  );
}

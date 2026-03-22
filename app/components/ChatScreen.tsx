"use client";

import { useState, useRef, useEffect } from "react";
import { useRealtimeVoice, VoiceStatus } from "../hooks/useRealtimeVoice";

// ─── Types ───────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "echo";
  text: string;
}

type ChatMode = "text" | "voice";

// Natural initial messages — no template greetings
const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "echo",
    text: "最近怎么样？",
  },
];

// ─── Chat Header ─────────────────────────────────────────────────────
function ChatHeader({ onBack }: { onBack: () => void }) {
  return (
    <header className="flex items-center gap-3 px-4 pt-5 pb-3">
      <button
        onClick={onBack}
        className="w-10 h-10 rounded-full glass flex items-center justify-center shadow-echo-sm transition-all active:scale-95"
        aria-label="Back"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E1F5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-echo-purple flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <circle cx="9" cy="10" r="1" fill="white" />
            <circle cx="15" cy="10" r="1" fill="white" />
          </svg>
        </div>
        <span className="text-base font-semibold text-echo-ink">Echo</span>
      </div>
    </header>
  );
}

// ─── Chat Bubble ─────────────────────────────────────────────────────
function ChatBubble({ message }: { message: Message }) {
  const isEcho = message.role === "echo";

  return (
    <div className={`flex ${isEcho ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] px-4 py-3 ${
          isEcho
            ? "bg-white text-echo-ink shadow-echo-sm"
            : "bg-echo-purple text-white shadow-echo-sm"
        }`}
        style={{
          borderRadius: isEcho
            ? "var(--radius-md) var(--radius-md) var(--radius-md) var(--radius-sm)"
            : "var(--radius-md) var(--radius-md) var(--radius-sm) var(--radius-md)",
        }}
      >
        <p className="text-[15px] leading-[1.6]">{message.text}</p>
      </div>
    </div>
  );
}

// ─── Chat Message List ───────────────────────────────────────────────
function ChatMessages({ messages }: { messages: Message[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
      {messages.map((msg) => (
        <ChatBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

// ─── Text Input Bar ──────────────────────────────────────────────────
function TextInputBar({
  value,
  onChange,
  onSend,
  onSwitchToVoice,
  isLoading,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onSwitchToVoice: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="px-4 pb-6 pt-3">
      <div
        className="flex items-center gap-2 bg-white px-3 py-2 shadow-echo-lg"
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        {/* Microphone button — switches to voice mode */}
        <button
          onClick={onSwitchToVoice}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-echo-lavender flex items-center justify-center transition-colors hover:bg-echo-blush active:scale-95"
          aria-label="Switch to voice mode"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6F4BD8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        </button>

        {/* Text input */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && value.trim()) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Type how you're feeling..."
          className="flex-1 bg-transparent text-[15px] text-echo-ink placeholder:text-echo-ink/30 outline-none py-2"
        />

        {/* Send button */}
        <button
          onClick={onSend}
          disabled={!value.trim() || isLoading}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-echo-purple flex items-center justify-center transition-all hover:bg-echo-purple-light active:scale-95 disabled:opacity-25 disabled:pointer-events-none"
          aria-label="Send message"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Voice Mode UI ───────────────────────────────────────────────────
function VoiceMode({
  onSwitchToText,
  onDisconnect,
}: {
  onSwitchToText: () => void;
  onDisconnect: () => void;
}) {
  const { status, error, connect, disconnect } = useRealtimeVoice();
  const isActive = status === "connected";
  const prevStatusRef = useRef<VoiceStatus>(status);

  // Auto-connect on mount
  useEffect(() => {
    console.log("[VoiceMode] Mounted, connecting...");
    connect();
    return () => {
      console.log("[VoiceMode] Unmounting, disconnecting...");
      disconnect();
    };
  }, [connect, disconnect]);

  // Track status changes for debugging
  useEffect(() => {
    if (prevStatusRef.current !== status) {
      console.log("[VoiceMode] Status changed:", prevStatusRef.current, "->", status);
      prevStatusRef.current = status;
    }
  }, [status]);

  const handleClick = () => {
    if (isActive) {
      console.log("[VoiceMode] User tapped stop");
      disconnect();
    } else if (status !== "connecting") {
      console.log("[VoiceMode] User tapped start");
      connect();
    }
  };

  const statusText = {
    idle: "Tap to speak",
    connecting: "Connecting...",
    connected: "Listening...",
    error: "Connection failed",
  }[status];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
      {/* Status text */}
      <p className="text-[15px] text-echo-ink-secondary font-medium mb-10 animate-fade-in">
        {statusText}
      </p>

      {/* Error message */}
      {error && (
        <p className="text-[13px] text-red-400 mb-4 text-center animate-fade-in">
          {error}
        </p>
      )}

      {/* Central orb */}
      <div className="relative mb-12">
        {/* Outer glow ring */}
        <div
          className={`absolute -inset-6 rounded-full transition-all duration-700 ${
            isActive
              ? "bg-echo-purple/15 animate-breathe"
              : status === "connecting"
              ? "bg-echo-purple/10"
              : "bg-echo-purple/8"
          }`}
        />
        {/* Second ring */}
        <div
          className={`absolute -inset-3 rounded-full transition-all duration-700 ${
            isActive
              ? "bg-echo-purple/10 animate-breathe"
              : status === "connecting"
              ? "bg-echo-purple/8"
              : "bg-echo-purple/5"
          }`}
          style={{ animationDelay: "0.5s" }}
        />
        {/* Main orb */}
        <button
          onClick={handleClick}
          disabled={status === "connecting"}
          className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 ${
            isActive ? "animate-glow" : ""
          }`}
          style={{
            background:
              status === "error"
                ? "linear-gradient(135deg, #D46B6B 0%, #B54A4A 50%, #9A3A3A 100%)"
                : "linear-gradient(135deg, #8B6CE0 0%, #6F4BD8 50%, #5A3AB5 100%)",
            boxShadow: isActive
              ? "0 0 50px rgba(111,75,216,0.35)"
              : status === "connecting"
              ? "0 0 40px rgba(111,75,216,0.25)"
              : "0 0 30px rgba(111,75,216,0.2)",
            opacity: status === "connecting" ? 0.7 : 1,
          }}
          aria-label={isActive ? "Stop listening" : "Start listening"}
        >
          {status === "connecting" ? (
            /* Connecting spinner */
            <div className="w-8 h-8 border-2 border-white/50 border-t-white rounded-full animate-spin" />
          ) : isActive || status === "error" ? (
            /* Stop icon */
            <div className="w-8 h-8 rounded-sm bg-white/90" style={{ borderRadius: "4px" }} />
          ) : (
            /* Microphone icon */
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          )}
        </button>
      </div>

      {/* Switch to text mode */}
      <button
        onClick={() => {
          console.log("[VoiceMode] Switching to text mode");
          onDisconnect();
          onSwitchToText();
        }}
        className="flex items-center gap-2 px-5 py-2.5 glass shadow-echo-sm text-[13px] font-medium text-echo-ink-secondary transition-all active:scale-95"
        style={{ borderRadius: "var(--radius-pill)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Switch to text
      </button>
    </div>
  );
}

// ─── ChatScreen (exported) ───────────────────────────────────────────
interface ChatScreenProps {
  onBack: () => void;
}

export default function ChatScreen({ onBack }: ChatScreenProps) {
  const [mode, setMode] = useState<ChatMode>("text");
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Send message to OpenAI API for text mode
  // Returns array of bubbles (1-3 short messages)
  async function sendToOpenAI(userText: string): Promise<string[]> {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userText,
        conversation: messages.map((m) => ({ role: m.role, content: m.text })),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get response");
    }

    const data = await response.json();
    return data.bubbles || [data.response || "…"];
  }

  function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Call OpenAI API for real response
    sendToOpenAI(userMsg.text)
      .then((bubbles) => {
        // Add each bubble as a separate message for natural chat rhythm
        const timestamp = Date.now();
        bubbles.forEach((bubbleText: string, index: number) => {
          const echoMsg: Message = {
            id: `${timestamp + 1 + index}`,
            role: "echo",
            text: bubbleText,
          };
          setMessages((prev) => [...prev, echoMsg]);
        });
      })
      .catch((err) => {
        console.error("Text mode error:", err);
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "echo",
          text: "嗯，我接到了。",
        };
        setMessages((prev) => [...prev, errorMsg]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function handleDisconnect() {
    // Voice session cleanup handled by hook
  }

  return (
    <div
      className="flex flex-col h-dvh max-w-md mx-auto overflow-hidden"
      style={{
        background:
          mode === "text"
            ? "linear-gradient(180deg, #F5F2FA 0%, #F0ECF7 100%)"
            : "linear-gradient(180deg, #E9E2F8 0%, #DDEBFA 50%, #E9E2F8 100%)",
      }}
    >
      <ChatHeader onBack={onBack} />

      {mode === "text" ? (
        <>
          <ChatMessages messages={messages} />
          <TextInputBar
            value={input}
            onChange={setInput}
            onSend={handleSend}
            onSwitchToVoice={() => {
              handleDisconnect();
              setMode("voice");
            }}
            isLoading={isLoading}
          />
        </>
      ) : (
        <VoiceMode
          onSwitchToText={() => setMode("text")}
          onDisconnect={handleDisconnect}
        />
      )}
    </div>
  );
}

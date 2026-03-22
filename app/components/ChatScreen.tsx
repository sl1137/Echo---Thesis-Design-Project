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

// Empty initial state - AI will generate opening message
const INITIAL_MESSAGES: Message[] = [];

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
    idle: "轻触开始对话",
    connecting: "连接中...",
    connected: "正在倾听...",
    error: "连接失败",
  }[status];

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center px-6 pb-10 relative"
      style={{
        background: "url('/语音页面.png') center center / cover no-repeat",
      }}
    >
      {/* Status text */}
      <p className="text-[15px] text-echo-ink-secondary font-medium mb-8 animate-fade-in relative z-10">
        {statusText}
      </p>

      {/* Error message */}
      {error && (
        <p className="text-[13px] text-red-400 mb-4 text-center animate-fade-in relative z-10">
          {error}
        </p>
      )}

      {/* Character container */}
      <div className="relative mb-12">
        {/* Outer glow ring - breathes when active */}
        <div
          className={`absolute -inset-16 rounded-full transition-all duration-700 ${
            isActive
              ? "bg-echo-purple/20 animate-breathe"
              : status === "connecting"
              ? "bg-echo-purple/10"
              : "bg-echo-purple/5"
          }`}
        />
        {/* Second ring */}
        <div
          className={`absolute -inset-10 rounded-full transition-all duration-700 ${
            isActive
              ? "bg-echo-purple/15 animate-breathe"
              : status === "connecting"
              ? "bg-echo-purple/8"
              : "bg-echo-purple/3"
          }`}
          style={{ animationDelay: "0.3s" }}
        />
        {/* Third ring */}
        <div
          className={`absolute -inset-4 rounded-full transition-all duration-700 ${
            isActive
              ? "bg-echo-purple/10 animate-breathe"
              : status === "connecting"
              ? "bg-echo-purple/5"
              : "bg-transparent"
          }`}
          style={{ animationDelay: "0.6s" }}
        />

        {/* Character image button - Star character */}
        <button
          onClick={handleClick}
          disabled={status === "connecting"}
          className={`relative transition-all duration-500 active:scale-95 ${
            isActive ? "animate-glow" : ""
          }`}
          style={{
            filter: status === "connecting"
              ? "brightness(0.8)"
              : isActive
              ? "brightness(1.1) drop-shadow(0 0 20px rgba(255,215,100,0.5))"
              : "brightness(1)",
            transform: status === "connecting" ? "scale(0.95)" : "scale(1)",
            opacity: status === "connecting" ? 0.8 : 1,
          }}
          aria-label={isActive ? "停止倾听" : "开始倾听"}
        >
          {/* Character image - star with background removed via mix-blend-mode */}
          <div
            className="w-56 h-56 rounded-full overflow-hidden flex items-center justify-center"
            style={{
              background: "transparent",
              boxShadow: isActive
                ? "0 0 60px rgba(255,215,100,0.5)"
                : status === "connecting"
                ? "0 0 30px rgba(255,215,100,0.25)"
                : "0 4px 20px rgba(0,0,0,0.1)",
            }}
          >
            <div
              className="w-40 h-40 relative"
              style={{
                /* Create star shape using clip-path */
                clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                background: "linear-gradient(135deg, #FFE26B 0%, #FFD93D 50%, #FFC41A 100%)",
                boxShadow: "inset 0 0 20px rgba(255,255,255,0.5)",
              }}
            >
              {/* Star face - simple eyes */}
              <div className="absolute top-[35%] left-[28%] w-[12%] h-[15%] bg-[#E8A83D] rounded-full opacity-80" />
              <div className="absolute top-[35%] right-[28%] w-[12%] h-[15%] bg-[#E8A83D] rounded-full opacity-80" />
              {/* Smile */}
              <div
                className="absolute top-[55%] left-1/2 -translate-x-1/2 w-[25%] h-[10%] border-b-2 border-[#E8A83D] rounded-full opacity-80"
                style={{ borderRadius: "0 0 10px 10px" }}
              />
            </div>
          </div>

          {/* Connecting overlay */}
          {status === "connecting" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-3 border-white/60 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {/* Active indicator - subtle pulse dot */}
          {isActive && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-full animate-pulse shadow-lg" />
          )}
        </button>
      </div>

      {/* Hint text */}
      <p className="text-[12px] text-echo-ink-secondary/60 mb-6">
        {isActive ? "再次点击结束对话" : "点击角色开始对话"}
      </p>

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
        切换到文字模式
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

  // Use ref to ensure opening message is only fetched once
  const hasOpenedRef = useRef(false);

  // Fetch opening message from AI on first load
  useEffect(() => {
    if (mode !== "text") return;
    if (hasOpenedRef.current) return;
    if (messages.length > 0) return;

    hasOpenedRef.current = true;
    setIsLoading(true);

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "[OPENING]",
        conversation: [],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const bubbles = data.bubbles || ["…"];
        const timestamp = Date.now();

        // Add each bubble, but skip if same message already exists
        bubbles.forEach((bubbleText: string, index: number) => {
          setMessages((prev) => {
            // Check if this exact message already exists
            const exists = prev.some(m => m.role === "echo" && m.text === bubbleText);
            if (exists) return prev;

            const echoMsg: Message = {
              id: `${timestamp + index}`,
              role: "echo",
              text: bubbleText,
            };
            return [...prev, echoMsg];
          });
        });
      })
      .catch((err) => {
        console.error("Opening message error:", err);
        setMessages((prev) => {
          const exists = prev.some(m => m.role === "echo" && m.text === "hi～我是 Echo，想到什么都可以和我说说。");
          if (exists) return prev;

          const echoMsg: Message = {
            id: "1",
            role: "echo",
            text: "hi～我是 Echo，想到什么都可以和我说说。",
          };
          return [...prev, echoMsg];
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);
  // Returns array of bubbles (1-3 short messages)
  async function sendToOpenAI(userText: string): Promise<string[]> {
    console.log("[sendToOpenAI] Sending message:", userText);
    console.log("[sendToOpenAI] Conversation length:", messages.length);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userText,
        conversation: messages.slice(-20).map((m) => ({ role: m.role, content: m.text })),
      }),
    });

    console.log("[sendToOpenAI] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get response: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("[sendToOpenAI] Response data:", JSON.stringify(data));

    // Handle various response formats
    if (data.bubbles && Array.isArray(data.bubbles) && data.bubbles.length > 0) {
      // Filter out fallback messages
      const validBubbles = data.bubbles.filter((b: string) => b && b.trim() && b !== "…");
      return validBubbles.length > 0 ? validBubbles : ["嗯，我接到了。"];
    }
    if (data.response) {
      return [data.response];
    }
    // Fallback
    return ["嗯，我接到了。"];
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
            : "transparent",
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

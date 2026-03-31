"use client";

import { useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────
type DriftTab = "write" | "mybottles";

type BottleStatus = "drifting" | "replied";

interface Bottle {
  id: string;
  content: string;
  emotion: string;
  sentAt: number;
  status: BottleStatus;
  reply?: string;
}

const EMOTION_TAGS = ["焦虑", "孤独", "委屈", "疲惫", "迷茫", "难过", "压力", "无力"];

const PROMPT_STARTERS = [
  "今天最让我累的是…",
  "有件事我一直没说出口…",
  "最近我一直在想…",
  "我希望有人知道…",
];

// ─── Empty Bottle State ───────────────────────────────────────────────
function EmptyBottles() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="text-4xl mb-4">🍾</div>
      <p
        className="text-[15px] font-medium mb-2"
        style={{ color: "var(--on_surface)" }}
      >
        No bottles yet
      </p>
      <p
        className="text-[13px] leading-relaxed"
        style={{ color: "var(--on_surface)", opacity: 0.45 }}
      >
        Write your first note and let it drift — someone will find it.
      </p>
    </div>
  );
}

// ─── Bottle Item ──────────────────────────────────────────────────────
function BottleItem({ bottle }: { bottle: Bottle }) {
  const [expanded, setExpanded] = useState(false);
  const elapsed = Date.now() - bottle.sentAt;
  const hoursAgo = Math.floor(elapsed / 3600000);
  const timeLabel = hoursAgo < 1 ? "just now" : `${hoursAgo}h ago`;

  return (
    <div
      className="mb-3 p-4 shadow-echo-sm transition-all"
      style={{
        background: "var(--surface_container_low)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <p
          className="text-[14px] leading-relaxed flex-1"
          style={{ color: "var(--on_surface)" }}
        >
          {expanded ? bottle.content : `${bottle.content.slice(0, 60)}${bottle.content.length > 60 ? "…" : ""}`}
        </p>
        <span
          className={`flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
            bottle.status === "replied"
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {bottle.status === "replied" ? "Replied" : "Drifting…"}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-[11px] px-2 py-0.5 rounded-full font-medium"
          style={{
            background: "var(--surface_container)",
            color: "var(--on_surface)",
            opacity: 0.7,
          }}
        >
          {bottle.emotion}
        </span>
        <span
          className="text-[11px]"
          style={{ color: "var(--on_surface)", opacity: 0.4 }}
        >
          {timeLabel}
        </span>
      </div>

      {bottle.status === "replied" && bottle.reply && (
        <div
          className="mt-3 pt-3"
          style={{ borderTop: "1px solid var(--surface_container)" }}
        >
          {expanded ? (
            <p
              className="text-[13px] leading-relaxed italic"
              style={{ color: "var(--secondary)" }}
            >
              "{bottle.reply}"
            </p>
          ) : (
            <button
              onClick={() => setExpanded(true)}
              className="text-[13px] font-medium transition-opacity active:opacity-60"
              style={{ color: "var(--secondary)" }}
            >
              Read reply →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── DriftSeaScreen ───────────────────────────────────────────────────
export default function DriftSeaScreen() {
  const [activeTab, setActiveTab] = useState<DriftTab>("write");
  const [content, setContent] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [throwing, setThrowing] = useState(false);
  const [thrown, setThrown] = useState(false);
  const [bottles, setBottles] = useState<Bottle[]>([]);

  const charCount = content.length;
  const maxChars = 300;
  const canThrow = content.trim().length > 0 && selectedEmotion !== null && !throwing;

  function handlePromptClick(prompt: string) {
    setContent(prompt);
  }

  async function handleThrow() {
    if (!canThrow) return;
    setThrowing(true);

    await new Promise((r) => setTimeout(r, 1200));

    const newBottle: Bottle = {
      id: Date.now().toString(),
      content: content.trim(),
      emotion: selectedEmotion!,
      sentAt: Date.now(),
      status: "drifting",
    };
    setBottles((prev) => [newBottle, ...prev]);
    setThrowing(false);
    setThrown(true);

    setTimeout(() => {
      setThrown(false);
      setContent("");
      setSelectedEmotion(null);
      setActiveTab("mybottles");
    }, 2000);
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Drift Sea illustration */}
      <div className="relative w-full flex-shrink-0" style={{ height: "32vh" }}>
        <img
          src="/drift-sea-bg.png"
          alt="Drift Sea"
          className="w-full h-full object-cover"
          style={{ objectPosition: "center 40%" }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-16"
          style={{
            background: "linear-gradient(to bottom, transparent, var(--surface))",
          }}
        />
        {/* Page title overlay */}
        <div className="absolute bottom-4 left-5">
          <h1
            className="text-[20px] font-bold"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--on_surface)",
              textShadow: "0 1px 8px rgba(255,255,255,0.6)",
            }}
          >
            Drift Sea
          </h1>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="px-5 pt-2 pb-3 flex-shrink-0">
        <div
          className="flex p-1 gap-1"
          style={{
            background: "var(--surface_container)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          {(["write", "mybottles"] as DriftTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 text-[13px] font-semibold transition-all"
              style={{
                borderRadius: "var(--radius-md)",
                background: activeTab === tab ? "var(--surface_container_lowest)" : "transparent",
                color: activeTab === tab ? "var(--on_surface)" : "var(--on_surface)",
                opacity: activeTab === tab ? 1 : 0.45,
                boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
              }}
            >
              {tab === "write" ? "Write a Note" : `My Bottles${bottles.length > 0 ? ` (${bottles.length})` : ""}`}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {/* ── Write Tab ─────────────────────────── */}
        {activeTab === "write" && (
          <div className="px-5 pb-8">
            {thrown ? (
              /* Thrown confirmation */
              <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                <div className="text-5xl mb-4 animate-float">🍾</div>
                <p
                  className="text-[16px] font-semibold mb-2"
                  style={{ color: "var(--on_surface)" }}
                >
                  Your bottle is drifting…
                </p>
                <p
                  className="text-[13px]"
                  style={{ color: "var(--on_surface)", opacity: 0.5 }}
                >
                  You'll hear back in 6–12 hours.
                </p>
              </div>
            ) : (
              <>
                {/* Prompt starters */}
                <p
                  className="text-[12px] font-medium mb-2"
                  style={{ color: "var(--on_surface)", opacity: 0.5 }}
                >
                  Start with a prompt
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {PROMPT_STARTERS.map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePromptClick(p)}
                      className="text-[12px] px-3 py-1.5 font-medium transition-all active:scale-95"
                      style={{
                        background: "var(--surface_container_low)",
                        color: "var(--on_surface)",
                        borderRadius: "var(--radius-pill)",
                        border: content === p ? `1.5px solid var(--secondary)` : "1.5px solid transparent",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Textarea */}
                <div className="relative mb-4">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value.slice(0, maxChars))}
                    placeholder="Write what's been weighing on you…"
                    rows={5}
                    className="w-full resize-none outline-none text-[14px] leading-relaxed p-4"
                    style={{
                      background: "var(--surface_container_low)",
                      color: "var(--on_surface)",
                      borderRadius: "var(--radius-lg)",
                      caretColor: "var(--secondary)",
                    }}
                  />
                  <span
                    className="absolute bottom-3 right-4 text-[11px]"
                    style={{
                      color: "var(--on_surface)",
                      opacity: charCount > 260 ? 0.8 : 0.3,
                    }}
                  >
                    {charCount}/{maxChars}
                  </span>
                </div>

                {/* Emotion tag selector */}
                <p
                  className="text-[12px] font-medium mb-2"
                  style={{ color: "var(--on_surface)", opacity: 0.5 }}
                >
                  How are you feeling? (pick one)
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {EMOTION_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedEmotion(tag === selectedEmotion ? null : tag)}
                      className="text-[12px] px-3 py-1.5 font-semibold transition-all active:scale-95"
                      style={{
                        borderRadius: "var(--radius-pill)",
                        background:
                          selectedEmotion === tag
                            ? "var(--secondary_container)"
                            : "var(--surface_container_low)",
                        color:
                          selectedEmotion === tag
                            ? "var(--on_secondary_container)"
                            : "var(--on_surface)",
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                {/* Throw button */}
                <button
                  onClick={handleThrow}
                  disabled={!canThrow}
                  className="w-full py-3.5 text-[15px] font-semibold transition-all active:scale-[0.98] disabled:opacity-35"
                  style={{
                    background: "linear-gradient(135deg, var(--secondary) 0%, var(--secondary_container) 100%)",
                    color: canThrow ? "var(--on_secondary)" : "var(--on_surface)",
                    borderRadius: "var(--radius-lg)",
                  }}
                >
                  {throwing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                      Sending…
                    </span>
                  ) : (
                    "🍾 Throw Bottle into the Sea"
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── My Bottles Tab ────────────────────── */}
        {activeTab === "mybottles" && (
          <div className="px-5 pb-8">
            {bottles.length === 0 ? (
              <EmptyBottles />
            ) : (
              bottles.map((b) => <BottleItem key={b.id} bottle={b} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}

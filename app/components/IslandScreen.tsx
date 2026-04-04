"use client";

import { useState, useRef, useEffect } from "react";

// ─── Pastel palette (from style guide) ────────────────────────────────
// Each category gets 2 colors; cards within a category cycle through them
// cardColors[0] = main category card bg, cardColors[1..] = per-practice diffuse blobs

// ─── Data ─────────────────────────────────────────────────────────────

interface Practice {
  id: string;
  name: string;
  bestFor: string[];
  duration: string;
  description: string;
  blobColor: string; // pastel from style guide
}

interface Category {
  id: string;
  name: string;
  tagline: string;
  cardBg: string;   // island page category card bg
  accentColor: string;
  practices: Practice[];
}

// Build diffused radial gradient from a pastel base color (fully opaque)
function diffuse(color: string, pos = "38% 32%") {
  return `radial-gradient(circle at ${pos}, ${color} 0%, #ffffff 75%)`;
}

const CATEGORIES: Category[] = [
  {
    id: "stabilize",
    name: "Stabilize",
    tagline: "Calm down · Come back · Stop the spiral",
    cardBg: diffuse("#DBE3FF", "35% 30%"),
    accentColor: "#4A5AAA",
    practices: [
      { id: "pause_with_me", name: "Pause with Me", bestFor: ["triggered", "spiraling", "urge to react"], duration: "< 1 min", description: "Interrupt emotional autopilot before you do anything else.", blobColor: "#DBE3FF" },
      { id: "come_back_to_room", name: "Come Back to the Room", bestFor: ["disconnected", "floaty", "checked out"], duration: "2–3 min", description: "Reconnect with the present through your five senses.", blobColor: "#DBF5D8" },
      { id: "slow_exhale", name: "Slow Exhale", bestFor: ["anxious", "heart racing", "body tense"], duration: "1–2 min", description: "Lower physical arousal with a short breathing reset.", blobColor: "#E5D8F5" },
      { id: "this_feeling_makes_sense", name: "This Feeling Makes Sense", bestFor: ["shame", "overreacting", "self-judgment"], duration: "2 min", description: "Stop fighting yourself for feeling what you feel.", blobColor: "#DBE3FF" },
      { id: "ride_the_wave", name: "Ride the Wave", bestFor: ["impulsive urge", "want to react", "intense feeling"], duration: "2 min", description: "Survive an intense urge without acting on it right away.", blobColor: "#DBF5D8" },
    ],
  },
  {
    id: "clarify",
    name: "Clarify",
    tagline: "Understand what you feel · Name what's happening",
    cardBg: diffuse("#FBF7D5", "40% 35%"),
    accentColor: "#7A6A20",
    practices: [
      { id: "name_whats_here", name: "Name What's Here", bestFor: ["feel bad but can't say why", "blurry feelings", "mixed emotions"], duration: "2–3 min", description: "Move from 'I feel weird' to knowing exactly what's happening.", blobColor: "#FBF7D5" },
      { id: "what_happened_vs_meant", name: "What Happened vs What It Meant", bestFor: ["reading into it", "spiraling over ambiguity", "social situations"], duration: "3–4 min", description: "Separate the event from the story your mind attached to it.", blobColor: "#E5D8F5" },
      { id: "catch_the_thought", name: "Catch the Thought", bestFor: ["emotional drop happened fast", "harsh self-talk", "automatic reaction"], duration: "2–3 min", description: "Find the exact thought that intensified how you're feeling.", blobColor: "#FBF7D5" },
    ],
  },
  {
    id: "reframe",
    name: "Reframe & Act",
    tagline: "Move forward · Take one small step",
    cardBg: diffuse("#FFDBDB", "38% 32%"),
    accentColor: "#9A4A4A",
    practices: [
      { id: "one_tiny_next_step", name: "One Tiny Next Step", bestFor: ["frozen", "task avoidance", "too overwhelming to begin"], duration: "3–4 min", description: "Break an overwhelming task into the smallest possible move.", blobColor: "#FFDBDB" },
      { id: "ten_minute_restart", name: "10-Minute Restart", bestFor: ["flat", "low energy", "shut down", "stuck"], duration: "10 min", description: "Restart movement when you feel heavy or inert.", blobColor: "#FFECD8" },
    ],
  },
];

// ─── Card Content (shared between current + exiting card) ─────────────
function CardContent({ practice, category }: { practice: Practice; category: Category }) {
  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <span className="text-[11px] font-bold px-3 py-1 rounded-full"
          style={{ background: "rgba(255,255,255,0.6)", color: category.accentColor }}>
          {category.name}
        </span>
        <span className="text-[12px]" style={{ color: "#A0AEC0" }}>{practice.duration}</span>
      </div>
      <h3 className="text-[22px] font-bold mb-2 leading-snug" style={{ color: "#1A2A3A" }}>
        {practice.name}
      </h3>
      <p className="text-[14px] leading-relaxed mb-5" style={{ color: "#4A5A6A" }}>
        {practice.description}
      </p>
      <div className="flex flex-wrap gap-2 mb-auto">
        {practice.bestFor.map((tag) => (
          <span key={tag} className="text-[12px] px-3 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.55)", color: category.accentColor }}>
            {tag}
          </span>
        ))}
      </div>
      <button
        className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-white mt-5 transition-all active:scale-[0.98]"
        style={{ background: "rgba(40,40,60,0.75)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      >
        Start Practice
      </button>
    </>
  );
}

// ─── Practice Card Deck Overlay ────────────────────────────────────────

function MicroPracticeOverlay({
  category,
  onClose,
}: {
  category: Category;
  onClose: () => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  // exitingCard: the card animating out (rendered until onAnimationEnd)
  const [exitingCard, setExitingCard] = useState<{ practice: Practice; dir: "left" | "right" } | null>(null);
  const startX = useRef(0);

  const practices = category.practices;
  const total = practices.length;

  function advance(dir: "left" | "right") {
    if (exitingCard) return;
    if (dir === "left" && currentIdx >= total - 1) return;
    if (dir === "right" && currentIdx <= 0) return;
    setExitingCard({ practice: practices[currentIdx], dir });
    setCurrentIdx((i) => (dir === "left" ? i + 1 : i - 1));
    // Safety fallback: clear exitingCard even if onAnimationEnd doesn't fire
    setTimeout(() => setExitingCard(null), 400);
  }

  function handlePointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    // Capture pointer so we receive pointerUp even if finger moves over child elements
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerUp(e: React.PointerEvent) {
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) < 8) return; // treat as tap, not swipe
    if (dx < -50) advance("left");
    else if (dx > 50) advance("right");
  }

  function handlePointerCancel() {
    startX.current = 0;
  }

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col animate-fade-in"
      style={{ background: "rgba(20,20,40,0.5)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
      onClick={onClose}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between px-5 pt-12 pb-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
            Micro Practice
          </p>
          <h2 className="text-[24px] font-bold text-white">{category.name}</h2>
          <p className="text-[13px] mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
            {category.tagline}
          </p>
        </div>
        <button
          onClick={onClose}
          className="mt-1 w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.18)" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Card stack — swipe detection lives here, above all child elements */}
      <div
        className="flex-1 flex items-center justify-center px-5"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{ touchAction: "none" }}
      >
        <div className="relative w-full" style={{ height: 380 }}>

          {/* Peek cards — stable keys let CSS spring-transition fire on step-forward */}
          {[2, 1].map((offset) => {
            const idx = currentIdx + offset;
            if (idx >= total) return null;
            const rotate = offset === 1 ? -0.8 : -1.8;
            return (
              <div
                key={practices[idx].id}
                className="absolute inset-0"
                style={{
                  background: diffuse(practices[idx].blobColor, "35% 28%"),
                  borderRadius: 28,
                  transform: `translateY(${offset * 20}px) scale(${1 - offset * 0.07}) rotate(${rotate}deg)`,
                  opacity: 1 - offset * 0.28,
                  zIndex: 3 - offset,
                  boxShadow: offset === 1 ? "0 8px 28px rgba(0,0,0,0.10)" : "none",
                  /* spring curve: back cards bounce slightly as they step forward */
                  transition: "transform 0.38s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease-out",
                }}
              />
            );
          })}

          {/* Exiting card — animates out, removed on animationEnd */}
          {exitingCard && (
            <div
              className="absolute inset-0 flex flex-col p-6"
              style={{
                background: diffuse(exitingCard.practice.blobColor, "35% 28%"),
                borderRadius: 28,
                zIndex: 5,
                boxShadow: "0 12px 40px rgba(0,0,0,0.14)",
                animation: `${exitingCard.dir === "left" ? "cardExitLeft" : "cardExitRight"} 0.2s cubic-bezier(0.4,0,1,1) forwards`,
              }}
              onAnimationEnd={() => setExitingCard(null)}
            >
              <CardContent practice={exitingCard.practice} category={category} />
            </div>
          )}

          {/* Current card — animates in */}
          {(() => {
            const practice = practices[currentIdx];
            return (
              <div
                key={currentIdx}
                className="absolute inset-0 flex flex-col p-6"
                style={{
                  background: diffuse(practice.blobColor, "35% 28%"),
                  borderRadius: 28,
                  zIndex: 4,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.14)",
                  userSelect: "none",
                  animation: exitingCard ? "cardEnterStack 0.42s cubic-bezier(0.34,1.56,0.64,1) forwards" : "none",
                }}
              >
                <CardContent practice={practice} category={category} />
              </div>
            );
          })()}
        </div>
      </div>

      {/* Prev / Next buttons */}
      {total > 1 && (
        <div className="flex items-center justify-between px-8 pb-2" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => advance("right")} className="px-4 py-1.5 rounded-full text-[12px] transition-all active:scale-90"
            style={{ opacity: currentIdx > 0 ? 1 : 0, background: "rgba(255,255,255,0.2)", color: "white" }}>
            ‹ prev
          </button>
          <button onClick={() => advance("left")} className="px-4 py-1.5 rounded-full text-[12px] transition-all active:scale-90"
            style={{ opacity: currentIdx < total - 1 ? 1 : 0, background: "rgba(255,255,255,0.2)", color: "white" }}>
            next ›
          </button>
        </div>
      )}

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 pb-6" onClick={(e) => e.stopPropagation()}>
        {practices.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === currentIdx ? 22 : 7,
              height: 7,
              borderRadius: 999,
              background: i === currentIdx ? "white" : "rgba(255,255,255,0.35)",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Affirmations ─────────────────────────────────────────────────────
const AFFIRMATIONS = [
  { title: "It's gonna be a good day!", body: "Taking it easy yesterday was just what your body needed to recover. You showed up anyway, and that takes more strength than it looks. Everything is unfolding in the best possible way — trust the pace you're moving at." },
  { title: "You're doing better than you think.", body: "Progress isn't always loud or visible. But every small effort you've made — the emails sent, the pages read, the moments you kept going — is adding up quietly. Be patient with yourself today." },
  { title: "It's okay to not have it all figured out.", body: "Uncertainty is not a flaw — it's part of growth. You don't need all the answers right now. You just need the next small step, and you already know what that is." },
  { title: "You belong here.", body: "Feeling out of place is something almost everyone carries quietly. But you earned your spot through real effort and real ability. Your perspective adds something to this world that no one else can." },
  { title: "Rest is not falling behind.", body: "Slowing down doesn't mean you're losing ground. Your mind and body need recovery just as much as they need effort. Resting today is part of doing well tomorrow." },
  { title: "One thing at a time.", body: "You don't have to solve everything today. The list will still be there. Pick one thing, do it gently, and let that be enough. That's not giving up — that's being wise about your energy." },
  { title: "Your feelings make sense.", body: "Whatever you're carrying right now is real and valid. You don't need to explain it, justify it, or get over it quickly. It's okay to feel what you feel — that's not weakness, it's honesty." },
];

function AffirmationCard() {
  const today = new Date();
  const [idx, setIdx] = useState(today.getDate() % AFFIRMATIONS.length);
  const [animating, setAnimating] = useState(false);

  function next() {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setIdx((i) => (i + 1) % AFFIRMATIONS.length);
      setAnimating(false);
    }, 220);
  }

  const { title, body } = AFFIRMATIONS[idx];

  return (
    <button
      onClick={next}
      className="w-full text-left px-4 py-3.5 mb-4 animate-fade-in delay-200 transition-all active:scale-[0.99]"
      style={{ background: "rgba(224, 228, 248, 0.78)", borderRadius: 18 }}
    >
      <div
        style={{
          opacity: animating ? 0 : 1,
          transform: animating ? "translateY(5px)" : "translateY(0)",
          transition: "opacity 0.22s ease, transform 0.22s ease",
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <p className="text-[14px] font-bold leading-snug flex-1" style={{ color: "#2A2A4A" }}>
            {title}
          </p>
          <img src="/star-echo.png" alt="star" className="animate-rock" style={{ width: 44, height: 44, flexShrink: 0, objectFit: "contain" }} />
        </div>
        <p className="text-[12px] leading-snug line-clamp-3" style={{ color: "#5A5A7A" }}>{body}</p>
        <div className="flex items-center justify-between mt-2.5">
          <div className="flex gap-1">
            {AFFIRMATIONS.map((_, i) => (
              <div key={i} style={{ width: i === idx ? 14 : 4, height: 4, borderRadius: 999, background: i === idx ? "#8888CC" : "rgba(100,100,180,0.25)", transition: "all 0.3s ease" }} />
            ))}
          </div>
          <p className="text-[10px]" style={{ color: "#A0A8C0" }}>tap to refresh ›</p>
        </div>
      </div>
    </button>
  );
}

// ─── Letter from Echo ─────────────────────────────────────────────────

const ECHO_LETTER = {
  date: "Apr 3, 2026",
  title: "I've been thinking\nabout you lately",
  sections: [
    {
      body: "Hi Cynthia. I've been sitting with some of the things you've shared lately — the exhaustion, the pressure to always be \"on,\" the moments when things felt heavier than you wanted them to. I wanted to write you something that wasn't just a response, but more like a letter from someone who's been paying attention.",
    },
    {
      heading: "What I've noticed",
      body: "You're carrying a lot more than most people see. There's the visible stuff — the coursework, the deadlines, the social navigation of being far from home. And then there's the quieter weight: the moments you wonder if you belong here, if you're doing enough, if you're okay. You are. And noticing that takes courage.",
    },
    {
      heading: "The thing about being far from home",
      body: "It doesn't just mean missing food or familiar faces. It means doing hard emotional work in a language that isn't always your first — carrying your feelings in words that don't quite fit the shape of what's inside. That gap is real, and it's tiring. The fact that you still reach out, still try to understand yourself — that matters more than you know.",
    },
    {
      heading: "Something I want you to hold onto",
      body: "You're not behind. You're not broken. You're someone in the middle of something genuinely hard, doing more than you give yourself credit for. You don't need to resolve everything this week. You just need to be gentle enough with yourself to keep going — one day, one thing at a time.",
    },
    {
      heading: "What might help this week",
      body: "Pick one moment, just one, where you do something kind for yourself without it needing to earn anything. Not as a reward. Just because you're here, and that's enough. Write it down somewhere physical. Let it count.",
    },
  ],
};

function LetterOverlay({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<"envelope" | "opening" | "letter">("envelope");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("opening"), 700);
    const t2 = setTimeout(() => setPhase("letter"), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      className="absolute inset-0 z-50 animate-fade-in-slow"
      style={{ background: "rgba(30,15,10,0.65)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
    >
      {/* Envelope animation stage */}
      {phase !== "letter" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={phase === "envelope" ? "/envelope-closed.png" : "/envelope-open.png"}
            alt="envelope"
            style={{
              width: 180,
              height: 180,
              objectFit: "contain",
              transition: "opacity 0.35s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)",
              transform: phase === "opening" ? "scale(1.1)" : "scale(1)",
              opacity: phase === "opening" ? 1 : 1,
            }}
          />
        </div>
      )}

      {/* Letter panel */}
      {phase === "letter" && (
        <div
          className="absolute left-0 right-0 bottom-0 animate-slide-up overflow-y-auto"
          style={{
            top: 48,
            background: "#FBF8F4",
            borderRadius: "24px 24px 0 0",
          }}
        >
          {/* Header row */}
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            <p className="text-[12px]" style={{ color: "#A09080" }}>{ECHO_LETTER.date}</p>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90"
              style={{ background: "rgba(0,0,0,0.08)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5A4A3A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Letter content */}
          <div className="px-6 pb-16">
            {/* Title */}
            <h1
              className="font-bold leading-tight mb-5"
              style={{ fontSize: 26, color: "#2D2010", whiteSpace: "pre-line" }}
            >
              {ECHO_LETTER.title}
            </h1>

            {/* Sections */}
            {ECHO_LETTER.sections.map((section, i) => (
              <div key={i}>
                {section.heading && (
                  <h2
                    className="font-bold mb-2"
                    style={{ fontSize: 16, color: "#2D2010", marginTop: 24 }}
                  >
                    {section.heading}
                  </h2>
                )}
                <p style={{ fontSize: 15, color: "#5A4A3A", lineHeight: 1.75 }}>
                  {section.body}
                </p>
              </div>
            ))}

            {/* Sign-off */}
            <p className="mt-8 font-medium" style={{ fontSize: 15, color: "#9A7A6A" }}>
              With warmth,<br />
              <span style={{ fontSize: 18, color: "#C07060" }}>Echo</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── IslandScreen ──────────────────────────────────────────────────────

interface IslandScreenProps {
  onStartChat: () => void;
}

export default function IslandScreen({ onStartChat }: IslandScreenProps) {
  const [openCategory, setOpenCategory] = useState<Category | null>(null);
  const [letterOpen, setLetterOpen] = useState(false);

  return (
    <div
      className="h-full relative overflow-hidden"
    >
      {/* Background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/island-new-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Scrollable content */}
      <div className="relative h-full overflow-y-auto z-10 flex flex-col">
        <div className="flex-1 flex flex-col px-5 pt-14 pb-6">

          {/* ── Header ── */}
          <div className="flex items-start gap-3 mb-4 animate-fade-in">
            <div className="flex-1">
              <p className="text-[13px] font-medium mb-0.5" style={{ color: "#9A7A6A" }}>
                Morning, Cynthia
              </p>
              <h1 className="text-[26px] font-bold leading-tight" style={{ color: "#2A1A12" }}>
                How have things<br />been today?
              </h1>
            </div>

            {/* Envelope button */}
            <button
              onClick={() => setLetterOpen(true)}
              className="flex-shrink-0 transition-all active:scale-90"
              style={{ marginTop: 4 }}
            >
              <img
                src="/envelope-closed.png"
                alt="letter from Echo"
                className="animate-envelope"
                style={{ width: 54, height: 54, objectFit: "contain" }}
              />
            </button>
          </div>

          {/* ── Start New Chat button ── */}
          <button
            onClick={onStartChat}
            className="w-full flex items-center justify-between px-5 py-3.5 mb-3 transition-all active:scale-[0.98] animate-fade-in delay-100"
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,1)",
              borderRadius: 18,
              boxShadow: "0 4px 16px rgba(180,120,100,0.14)",
              color: "#2A1A10",
            }}
          >
            <div className="flex items-center gap-2.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2A1A10" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="text-[15px] font-semibold">Start New Chat</span>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A07060" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </button>

          {/* ── Affirmation card ── */}
          <AffirmationCard />

          {/* ── Micro Practice ── */}
          <div className="flex-1 flex flex-col animate-fade-in delay-300">
            <h2 className="text-[17px] font-bold mb-2.5" style={{ color: "#2A1A12" }}>
              Micro Practice
            </h2>

            <div className="flex-1 flex flex-col gap-2.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setOpenCategory(cat)}
                  className="flex-1 w-full text-left flex flex-col justify-between px-4 pt-3 pb-4 transition-all active:scale-[0.98]"
                  style={{
                    background: cat.cardBg,
                    borderRadius: 18,
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                  }}
                >
                  <span
                    className="self-start text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ background: "rgba(180,180,180,0.35)", color: "#5A5A5A" }}
                  >
                    {cat.practices.length} practices
                  </span>
                  <div>
                    <p className="text-[14px] font-bold mb-0.5" style={{ color: "#1A2A3A" }}>
                      {cat.name}
                    </p>
                    <p className="text-[12px]" style={{ color: "#7A8A9A" }}>
                      {cat.tagline}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Micro Practice overlay */}
      {openCategory && (
        <MicroPracticeOverlay
          category={openCategory}
          onClose={() => setOpenCategory(null)}
        />
      )}

      {/* Letter from Echo overlay */}
      {letterOpen && <LetterOverlay onClose={() => setLetterOpen(false)} />}
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";

// ─── Pastel palette (from style guide) ────────────────────────────────
// Each category gets 2 colors; cards within a category cycle through them
// cardColors[0] = main category card bg, cardColors[1..] = per-practice diffuse blobs

// ─── Data ─────────────────────────────────────────────────────────────

interface PracticeStep {
  instruction: string;
  duration?: number; // seconds — shows timer bar when present
  hint?: string;
}

interface Practice {
  id: string;
  name: string;
  bestFor: string[];
  duration: string;
  description: string;
  blobColor: string; // pastel from style guide
  steps: PracticeStep[];
  completion: string; // message shown on done screen
}

interface Category {
  id: string;
  name: string;
  tagline: string;
  cardBg: string;
  iconColor: string;
  icon: (color: string) => React.ReactNode;
  accentColor: string;
  duration: string;
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
    cardBg: "#DDEAFA",
    iconColor: "rgba(58,90,154,0.32)",
    icon: (color) => (<>
      <circle cx="65" cy="10" r="5" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M 42,21 L 88,21" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M 28,27 C 28,64 102,64 102,27" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M 18,70 L 112,70" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </>),
    accentColor: "#3A5A9A",
    duration: "< 2 min",
    practices: [
      {
        id: "pause_with_me", name: "Pause with Me", bestFor: ["triggered", "spiraling", "urge to react"], duration: "< 1 min",
        description: "Interrupt emotional autopilot before you do anything else.", blobColor: "#DBE3FF",
        completion: "You interrupted the spiral. That's enough.",
        steps: [
          { instruction: "Stop. Don't do anything yet.", hint: "Just let yourself pause here for a moment." },
          { instruction: "Take one breath in through your nose.", duration: 4 },
          { instruction: "Breathe out slowly through your mouth.", duration: 6 },
          { instruction: "Notice: your feet on the ground. Your hands. The temperature of the air.", hint: "You don't have to fix anything right now." },
        ],
      },
      {
        id: "come_back_to_room", name: "Come Back to the Room", bestFor: ["disconnected", "floaty", "checked out"], duration: "2–3 min",
        description: "Reconnect with the present through your five senses.", blobColor: "#DBF5D8",
        completion: "You came back. That was real.",
        steps: [
          { instruction: "Look around and name 3 things you can see right now." },
          { instruction: "Name 2 things you can physically feel — floor, fabric, air.", hint: "Touch something solid if you can." },
          { instruction: "Name 1 thing you can hear.", hint: "Even the faintest sound counts." },
          { instruction: "Take a slow breath and say quietly: \"I'm here. I'm okay.\"", duration: 8 },
        ],
      },
      {
        id: "slow_exhale", name: "Slow Exhale", bestFor: ["anxious", "heart racing", "body tense"], duration: "1–2 min",
        description: "Lower physical arousal with a short breathing reset.", blobColor: "#E5D8F5",
        completion: "Your nervous system just got a little quieter.",
        steps: [
          { instruction: "Breathe in gently through your nose.", duration: 4 },
          { instruction: "Hold for just a moment.", duration: 2 },
          { instruction: "Breathe out slowly through your mouth — longer than you breathed in.", duration: 8 },
          { instruction: "Repeat two more times at your own pace.", hint: "No rush." },
        ],
      },
      {
        id: "this_feeling_makes_sense", name: "This Feeling Makes Sense", bestFor: ["shame", "overreacting", "self-judgment"], duration: "2 min",
        description: "Stop fighting yourself for feeling what you feel.", blobColor: "#DBE3FF",
        completion: "You met your feeling instead of fighting it.",
        steps: [
          { instruction: "What are you feeling right now? Name it, even loosely.", hint: "\"Anxious\", \"numb\", \"wound up\" — anything is fine." },
          { instruction: "Say to yourself: \"It makes sense I feel this way.\"", hint: "You don't need a perfect reason. Just let it be valid." },
          { instruction: "Think of one real thing that contributed to this feeling.", hint: "Could be tiny — a comment, a moment, a memory." },
          { instruction: "Say gently: \"I'm not overreacting. I'm responding.\"", duration: 6 },
        ],
      },
      {
        id: "ride_the_wave", name: "Ride the Wave", bestFor: ["impulsive urge", "want to react", "intense feeling"], duration: "2 min",
        description: "Survive an intense urge without acting on it right away.", blobColor: "#DBF5D8",
        completion: "You surfed it. The urge passed without you acting on it.",
        steps: [
          { instruction: "Notice the urge or intense feeling. Where is it in your body?", hint: "Chest, stomach, throat — just observe." },
          { instruction: "Give it a shape or color in your mind. Don't try to change it.", duration: 10 },
          { instruction: "Remind yourself: feelings peak and pass. This one will too.", hint: "Most urges peak within 90 seconds." },
          { instruction: "Breathe slowly and just watch it.", duration: 12 },
        ],
      },
      {
        id: "reset_my_body", name: "Reset My Body", bestFor: ["body tension", "too activated", "impulsive urge"], duration: "1–2 min",
        description: "Reduce overwhelming activation through a quick physical reset.", blobColor: "#DBE3FF",
        completion: "We're not trying to feel perfect. Just a little less flooded.",
        steps: [
          { instruction: "Choose one of these right now:", hint: "Wash your hands with cool water — or hold something cold for 10 seconds." },
          { instruction: "Or: walk quickly in place for 30 seconds, or tense and release your fists 5 times.", hint: "Any movement counts." },
          { instruction: "Or: take 3 slow breaths out, making each exhale longer than the inhale.", duration: 12 },
          { instruction: "Notice: even a little shift is enough.", hint: "You don't have to feel calm — just slightly less flooded." },
        ],
      },
    ],
  },
  {
    id: "clarify",
    name: "Clarify",
    tagline: "Understand what you feel · Name what's happening",
    cardBg: "#FAF4DC",
    iconColor: "rgba(122,96,16,0.32)",
    icon: (color) => (<>
      <circle cx="65" cy="7" r="5" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M 65,14 C 38,20 38,55 65,62" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M 65,14 C 92,20 92,55 65,62" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="65" cy="38" r="5" fill="none" stroke={color} strokeWidth="1.8"/>
      <circle cx="65" cy="70" r="5" fill="none" stroke={color} strokeWidth="1.8"/>
    </>),
    accentColor: "#7A6010",
    duration: "2–4 min",
    practices: [
      {
        id: "name_whats_here", name: "Name What's Here", bestFor: ["feel bad but can't say why", "blurry feelings", "mixed emotions"], duration: "2–3 min",
        description: "Move from 'I feel weird' to knowing exactly what's happening.", blobColor: "#FBF7D5",
        completion: "You know what's here. That's the first step.",
        steps: [
          { instruction: "Slow down. Place a hand on your chest or lap.", duration: 5 },
          { instruction: "Scan: what sensations are in your body right now?", hint: "Tightness? Weight? Energy? Just notice." },
          { instruction: "What emotion word fits best?", hint: "If one word isn't enough, two is fine." },
          { instruction: "Say it out loud: \"Right now I'm feeling ___.\"", hint: "Naming shifts the feeling slightly. That's normal." },
        ],
      },
      {
        id: "what_happened_vs_meant", name: "What Happened vs What It Meant", bestFor: ["reading into it", "spiraling over ambiguity", "social situations"], duration: "3–4 min",
        description: "Separate the event from the story your mind attached to it.", blobColor: "#E5D8F5",
        completion: "You created some distance between the event and the meaning.",
        steps: [
          { instruction: "Describe what literally happened — just the facts.", hint: "\"They didn't reply.\" Not \"They're ignoring me.\"" },
          { instruction: "Now notice the story your mind added to it. What did you tell yourself it meant?", hint: "\"They don't care.\" \"I said something wrong.\"" },
          { instruction: "Is there another possible explanation? Even one.", hint: "You don't have to believe it — just acknowledge it exists." },
          { instruction: "Take a breath and hold both possibilities for a moment.", duration: 8 },
        ],
      },
      {
        id: "catch_the_thought", name: "Catch the Thought", bestFor: ["emotional drop happened fast", "harsh self-talk", "automatic reaction"], duration: "2–3 min",
        description: "Find the exact thought that intensified how you're feeling.", blobColor: "#FBF7D5",
        completion: "You found the thought instead of just living inside it.",
        steps: [
          { instruction: "What was the moment things felt worse?", hint: "Something shifted — try to find it." },
          { instruction: "What were you thinking right before or during that moment?", hint: "Often a quick, automatic judgment." },
          { instruction: "Say it out loud: \"The thought was: ___.\"" },
          { instruction: "Ask gently: is this a fact, or is this a fear?", duration: 8 },
        ],
      },
      {
        id: "check_the_facts", name: "Check the Facts Gently", bestFor: ["over-interpreting", "reading into it", "painful conclusions"], duration: "3–4 min",
        description: "Soften over-interpretation without feeling invalidated.", blobColor: "#E5D8F5",
        completion: "You held the feeling and questioned the story. That takes something.",
        steps: [
          { instruction: "What's the most painful thought or conclusion in this?", hint: "\"She doesn't care.\" \"I ruined it.\" Just name it." },
          { instruction: "What do you actually know for sure?", hint: "Stick to what you observed, not what you concluded." },
          { instruction: "What part of this are you guessing?", hint: "Be honest — most conclusions involve at least some guesswork." },
          { instruction: "Is there another explanation that could also be true — even if you don't fully believe it?", duration: 8 },
        ],
      },
      {
        id: "why_hitting_hard", name: "Why Is This Hitting So Hard?", bestFor: ["reaction feels too big", "know it's small but still falling apart", "depleted"], duration: "2–3 min",
        description: "Sometimes something hits harder because you were already carrying a lot.", blobColor: "#FBF7D5",
        completion: "This may not be too much emotion. It may be accumulated load.",
        steps: [
          { instruction: "Notice: is the reaction bigger than the event alone seems to explain?", hint: "That's a signal, not a flaw." },
          { instruction: "Check if any of these are true today:", hint: "Not enough sleep. Physically tired. Haven't eaten well. Under pressure for days." },
          { instruction: "Or these:", hint: "This touched an older wound. Been feeling alone. Had to hold yourself together for too long." },
          { instruction: "Say gently: \"This may not be overreacting. This may be accumulated load.\"", duration: 6 },
        ],
      },
    ],
  },
  {
    id: "reframe",
    name: "Reframe & Act",
    tagline: "Move forward · Take one small step",
    cardBg: "#FAE4EE",
    iconColor: "rgba(160,64,96,0.32)",
    icon: (color) => (<>
      <path d="M 65,72 C 62,58 60,42 64,22" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M 60,52 C 42,44 36,28 50,18" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M 62,38 C 74,28 76,16 68,10" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </>),
    accentColor: "#A04060",
    duration: "3–10 min",
    practices: [
      {
        id: "one_tiny_next_step", name: "One Tiny Next Step", bestFor: ["frozen", "task avoidance", "too overwhelming to begin"], duration: "3–4 min",
        description: "Break an overwhelming task into the smallest possible move.", blobColor: "#FFDBDB",
        completion: "One tiny step is still movement. Go do just that.",
        steps: [
          { instruction: "What's the thing that feels too big or heavy to start?", hint: "Name it, even vaguely." },
          { instruction: "Break it down: what's the smallest possible piece of that?", hint: "Smaller than you think. Truly tiny." },
          { instruction: "Make it even smaller.", hint: "\"Open the document\" is better than \"write the paper.\"" },
          { instruction: "Say: \"I only have to do ___. That's it.\"", hint: "Not the whole thing — just that." },
        ],
      },
      {
        id: "ten_minute_restart", name: "10-Minute Restart", bestFor: ["flat", "low energy", "shut down", "stuck"], duration: "10 min",
        description: "Restart movement when you feel heavy or inert.", blobColor: "#FFECD8",
        completion: "You restarted. That's the hardest part.",
        steps: [
          { instruction: "You don't have to feel ready. Just pick one small physical action.", hint: "Stand up. Get water. Open a window." },
          { instruction: "You're only committing to 10 minutes. Not the whole task. Just 10.", hint: "Start a timer if that helps." },
          { instruction: "Start with the lowest-friction part.", hint: "Whatever feels least like work right now." },
          { instruction: "When the time is up, you can stop. You chose to show up — that counts.", hint: "If you want to keep going, great. If not, you still did it." },
        ],
      },
      {
        id: "a_fairer_thought", name: "A Fairer Thought", bestFor: ["harsh self-judgment", "ready to reframe", "automatic thought identified"], duration: "3–4 min",
        description: "Move from a harsh thought to a more grounded, realistic one.", blobColor: "#FFDBDB",
        completion: "A fairer thought isn't fake positive. It's just more honest.",
        steps: [
          { instruction: "Write out the harsh thought exactly as it shows up.", hint: "\"I'm not good enough.\" \"I always mess things up.\" Don't soften it yet." },
          { instruction: "What makes this thought feel believable right now?", hint: "There's usually something real underneath — acknowledge it." },
          { instruction: "Is there anything the thought is leaving out or overstating?", hint: "Even one thing counts." },
          { instruction: "Try writing a fairer version — not fake positive, just more balanced.", hint: "\"I'm struggling right now\" is fairer than \"I'm a failure.\"", duration: 10 },
        ],
      },
      {
        id: "say_it_clearly", name: "Say It Clearly", bestFor: ["anxious about a message", "need to follow up", "conflict or boundary"], duration: "5 min",
        description: "Help you communicate clearly in stressful relational situations.", blobColor: "#FFECD8",
        completion: "You found the words. Now you can decide if and when to send them.",
        steps: [
          { instruction: "What happened that you need to address?", hint: "Keep it to the facts — what actually occurred." },
          { instruction: "What do you actually need from this person or situation?", hint: "An update? Clarity? A boundary? Just one thing." },
          { instruction: "How do you want to come across?", hint: "Gentle but clear? Professional? Direct? Choose the tone that fits." },
          { instruction: "Draft one or two sentences in your head — or write them out.", hint: "You don't have to send it now. Just find the words first." },
        ],
      },
      {
        id: "what_would_help_future_me", name: "What Would Help Future Me?", bestFor: ["already calmer", "want a takeaway", "looking back"], duration: "3–4 min",
        description: "Turn this emotional episode into a small piece of self-knowledge.", blobColor: "#FFDBDB",
        completion: "You turned this moment into something useful for the next one.",
        steps: [
          { instruction: "Looking back: what triggered you most?", hint: "Be specific if you can." },
          { instruction: "What made it worse? What helped even a little?", hint: "Even a tiny thing counts as helping." },
          { instruction: "Choose one takeaway for next time.", hint: "\"Next time I'll pause before replying.\" \"Next time I'll ground first.\"" },
          { instruction: "Write one line to future you.", hint: "\"Next time this happens, start with ___.\"", duration: 8 },
        ],
      },
    ],
  },
];

// ─── Card Content (shared between current + exiting card) ─────────────
function CardContent({ practice, category, onStart }: { practice: Practice; category: Category; onStart: () => void }) {
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
        onClick={onStart}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-white mt-5 transition-all active:scale-[0.98]"
        style={{ background: "rgba(40,40,60,0.75)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      >
        Start Practice
      </button>
    </>
  );
}

// ─── Practice Session Overlay ─────────────────────────────────────────

export { CATEGORIES };
export type { Practice, Category };

export function PracticeSessionOverlay({
  practice,
  category,
  onClose,
  doneLabel,
}: {
  practice: Practice;
  category: Category;
  onClose: () => void;
  doneLabel?: string;
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const currentStep = practice.steps[stepIdx];
  const hasDuration = !done && currentStep?.duration != null;

  useEffect(() => {
    setElapsed(0);
    if (!hasDuration) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [stepIdx, done]);

  function nextStep() {
    if (stepIdx < practice.steps.length - 1) {
      setStepIdx((i) => i + 1);
    } else {
      setDone(true);
    }
  }

  const progress = hasDuration && currentStep.duration
    ? Math.min(elapsed / currentStep.duration, 1)
    : 0;

  return (
    <div
      className="absolute inset-0 flex flex-col animate-fade-in"
      style={{ backgroundImage: "url('/practice-session-bg.png')", backgroundSize: "cover", backgroundPosition: "center", zIndex: 60 }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 transition-all active:scale-90"
          style={{ background: "rgba(90,122,170,0.12)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3A5A8A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#5A7AAA", opacity: 0.8 }}>
            {category.name}
          </p>
          <p className="text-[14px] font-semibold mt-0.5" style={{ color: "#1A2A3A" }}>{practice.name}</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center px-8 text-center">
        {done ? (
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
              style={{ background: "rgba(90,122,170,0.15)" }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#5A7AAA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-[14px] font-semibold uppercase tracking-widest mb-4" style={{ color: "#5A7AAA", opacity: 0.8 }}>
              Practice complete
            </p>
            <p className="text-[22px] font-bold leading-snug" style={{ color: "#1A2A3A" }}>
              {practice.completion}
            </p>
            <button
              onClick={onClose}
              className="mt-10 px-10 py-3.5 rounded-full text-[15px] font-semibold text-white transition-all active:scale-95"
              style={{ background: "#5A7AAA" }}
            >
              {doneLabel || "Done"}
            </button>
          </div>
        ) : (
          <>
            {/* 上段：占 2/5，dots 贴底部，位置按屏幕比例固定 */}
            <div className="flex flex-col items-center justify-end pb-5" style={{ flexGrow: 2, flexShrink: 0, flexBasis: 0 }}>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center gap-[6px]">
                  {practice.steps.map((_, i) => {
                    const active = i <= stepIdx;
                    return (
                      <div
                        key={i}
                        style={{
                          width: active ? 8 : 6,
                          height: active ? 8 : 6,
                          borderRadius: 999,
                          background: active ? "#5A7AAA" : "rgba(90,122,170,0.25)",
                          transition: "all 0.3s ease",
                        }}
                      />
                    );
                  })}
                </div>
                <p className="text-[11px] font-semibold" style={{ color: "#5A7AAA", opacity: 0.6 }}>
                  Step {stepIdx + 1} of {practice.steps.length}
                </p>
              </div>
            </div>
            {/* 下段：占 3/5，instruction 从顶部开始 */}
            <div className="flex flex-col items-center w-full pt-5" style={{ flexGrow: 3, flexShrink: 0, flexBasis: 0 }}>
            <p className="text-[22px] font-bold leading-snug mb-4" style={{ color: "#1A2A3A" }}>
              {currentStep.instruction}
            </p>
            {currentStep.hint && (
              <p className="text-[13px] leading-relaxed" style={{ color: "#6A7A8A" }}>
                {currentStep.hint}
              </p>
            )}
            {hasDuration && currentStep.duration && (
              <div className="w-full mt-8">
                <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(90,122,170,0.18)" }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${progress * 100}%`,
                      background: "#5A7AAA",
                      transition: "width 1s linear",
                    }}
                  />
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <p className="text-[12px]" style={{ color: "#5A7AAA", opacity: 0.7 }}>
                    {Math.max(currentStep.duration - elapsed, 0)}s
                  </p>
                  <button
                    onClick={() => setElapsed(0)}
                    className="flex items-center justify-center transition-all active:scale-90"
                    style={{ opacity: 0.5 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5A7AAA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            </div>
          </>
        )}
      </div>

      {/* Next button */}
      {!done && (
        <div className="px-6 pb-10">
          <button
            onClick={nextStep}
            className="w-full py-4 rounded-2xl text-[15px] font-semibold text-white transition-all active:scale-[0.98]"
            style={{ background: "#5A7AAA" }}
          >
            {stepIdx < practice.steps.length - 1 ? "Next →" : "Finish"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Practice Card Deck Overlay ────────────────────────────────────────

function MicroPracticeOverlay({
  category,
  onClose,
  initialIdx = 0,
}: {
  category: Category;
  onClose: () => void;
  initialIdx?: number;
}) {
  const [currentIdx, setCurrentIdx] = useState(initialIdx);
  const [sessionPractice, setSessionPractice] = useState<Practice | null>(null);
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
        className="flex items-start justify-between px-5 pt-16 pb-4"
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
                pointerEvents: "none",
              }}
              onAnimationEnd={() => setExitingCard(null)}
            >
              <CardContent practice={exitingCard.practice} category={category} onStart={() => {}} />
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
                <CardContent practice={practice} category={category} onStart={() => setSessionPractice(practice)} />
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

      {/* Session overlay — renders on top when a practice is started */}
      {sessionPractice && (
        <PracticeSessionOverlay
          practice={sessionPractice}
          category={category}
          onClose={() => setSessionPractice(null)}
        />
      )}
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
    <div
      className="w-full mb-4 animate-fade-in delay-200"
      style={{
        borderRadius: 18,
        overflow: "hidden",
        transform: "translateZ(0)",
        boxShadow: "0 2px 12px rgba(80,70,160,0.10)",
        height: 148,
        flexShrink: 0,
      }}
    >
    <button
      onClick={next}
      className="w-full h-full text-left transition-all active:scale-[0.99] relative"
      style={{
        backgroundImage: "url('/affirmation-card-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: 0,
      }}
    >
      {/* Overlay for text legibility */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.52)" }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, padding: "14px 16px" }}>
      <div
        style={{
          opacity: animating ? 0 : 1,
          transform: animating ? "translateY(5px)" : "translateY(0)",
          transition: "opacity 0.22s ease, transform 0.22s ease",
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-1">
          <p className="text-[17px] font-bold leading-snug flex-1" style={{ color: "#1A1A2E" }}>
            {title}
          </p>
          <div className="relative flex-shrink-0" style={{ width: 44, height: 44 }}>
            <img src="/star-echo.png" alt="star" className="animate-rock" style={{ width: 44, height: 44, objectFit: "contain" }} />
            {/* Sparkles */}
            {[
              // Top-right cluster
              { cls: "animate-sparkle-1", top: -8,  right: -6,  size: 11, color: "#F5C842" },
              { cls: "animate-sparkle-2", top: 4,   right: -13, size: 8,  color: "#A78BFA" },
              { cls: "animate-sparkle-3", top: -12, right: 10,  size: 7,  color: "#F5C842" },
              // Bottom-left cluster — pushed further away from star
              { cls: "animate-sparkle-4", top: 46,  right: 40,  size: 10, color: "#FBCFE8" },
              { cls: "animate-sparkle-5", top: 54,  right: 22,  size: 7,  color: "#F5C842" },
              { cls: "animate-sparkle-6", top: 36,  right: 52,  size: 8,  color: "#A78BFA" },
            ].map((s, i) => (
              <svg key={i} className={s.cls} width={s.size} height={s.size} viewBox="0 0 20 20"
                style={{ position: "absolute", top: s.top, right: s.right, pointerEvents: "none" }}>
                <path d="M10 0 L11.8 8.2 L20 10 L11.8 11.8 L10 20 L8.2 11.8 L0 10 L8.2 8.2 Z" fill={s.color} />
              </svg>
            ))}
          </div>
        </div>
        <p className="text-[13px] leading-snug line-clamp-3" style={{ color: "#2A2A3A" }}>{body}</p>
        <div className="flex items-center justify-between mt-2.5">
          <div className="flex gap-1">
            {AFFIRMATIONS.map((_, i) => (
              <div key={i} style={{ width: i === idx ? 14 : 4, height: 4, borderRadius: 999, background: i === idx ? "#8A70C0" : "rgba(140,110,200,0.22)", transition: "all 0.3s ease" }} />
            ))}
          </div>
          <p className="text-[10px]" style={{ color: "#9A88BB" }}>tap to refresh ›</p>
        </div>
      </div>
      </div>
    </button>
    </div>
  );
}

// ─── Suggested Practice Card ──────────────────────────────────────────

function SuggestedPracticeCard({
  suggestion,
  onOpen,
}: {
  suggestion: { practiceId: string; categoryId: string };
  onOpen: () => void;
}) {
  const cat = CATEGORIES.find((c) => c.id === suggestion.categoryId)!;
  const practice = cat?.practices.find((p) => p.id === suggestion.practiceId)!;
  if (!cat || !practice) return null;

  return (
    <div
      className="mb-3 animate-pop-in relative"
      style={{
        borderRadius: 18,
        background: "rgba(255,255,255,0.72)",
        boxShadow: "0 2px 12px rgba(80,70,160,0.07)",
      }}
    >
      <button
        onClick={onOpen}
        className="w-full text-left flex items-center gap-3 px-4 py-3.5 transition-all active:scale-[0.98]"
      >
        {/* Icon bubble */}
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: `${cat.accentColor}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={cat.accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        {/* Text */}
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 11, color: cat.accentColor, fontWeight: 700, marginBottom: 1 }}>Echo suggests</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#1A2A3A", lineHeight: 1.2 }}>{practice.name}</p>
          <p style={{ fontSize: 11, color: "#8A9AAA", marginTop: 1 }}>{cat.name} · {practice.duration}</p>
        </div>
        {/* Chevron */}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={cat.accentColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
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

type LetterData = { date: string; title: string; sections: { heading?: string; body: string }[] };

function LetterOverlay({ onClose, letter }: { onClose: () => void; letter: LetterData }) {
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
            <p className="text-[12px]" style={{ color: "#A09080" }}>{letter.date}</p>
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
              {letter.title}
            </h1>

            {/* Sections */}
            {letter.sections.map((section, i) => (
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
  suggestedPractice?: { practiceId: string; categoryId: string } | null;
  onDismissSuggestion?: () => void;
  userId?: string;
}

export default function IslandScreen({ onStartChat, suggestedPractice, userId }: IslandScreenProps) {
  const [openCategory, setOpenCategory] = useState<Category | null>(null);
  const [openPracticeIdx, setOpenPracticeIdx] = useState(0);
  const [letterOpen, setLetterOpen] = useState(false);
  const [directSession, setDirectSession] = useState<{ practice: Practice; category: Category } | null>(null);
  const [activeLetter, setActiveLetter] = useState<LetterData>(ECHO_LETTER);
  const [hasUnread, setHasUnread] = useState(false);
  const [letterInsufficient, setLetterInsufficient] = useState(false);

  useEffect(() => {
    if (!userId) return; // guest — use hardcoded letter
    fetch(`/api/generate-letter?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.letter) {
          setActiveLetter(data.letter);
          setHasUnread(!data.read);
        } else if (data.insufficient) {
          setLetterInsufficient(true);
        }
      })
      .catch(() => {});
  }, [userId]);

  function handleOpenLetter() {
    setLetterOpen(true);
    if (userId && hasUnread) {
      setHasUnread(false);
      fetch("/api/generate-letter", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }).catch(() => {});
    }
  }

  return (
    <div
      className="h-full relative overflow-hidden"
      style={{ backgroundImage: "url('/island-new-bg.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      {/* Scrollable content */}
      <div className="h-full overflow-y-auto flex flex-col">
        <div className="flex-1 flex flex-col px-5 pt-16 pb-6">

          {/* ── Header ── */}
          <div className="flex items-start gap-3 mb-4 animate-fade-in">
            <div className="flex-1">
              <p className="text-[13px] font-medium mb-0.5" style={{ color: "#AA8888" }}>
                Morning, Cynthia
              </p>
              <h1 className="text-[26px] font-bold leading-tight" style={{ color: "#1A1A2A" }}>
                How have things<br />been today?
              </h1>
            </div>

            {/* Envelope button */}
            <button
              onClick={handleOpenLetter}
              className="flex-shrink-0 transition-all active:scale-90 relative"
              style={{ marginTop: 4 }}
            >
              <img
                src="/envelope-closed.png"
                alt="letter from Echo"
                className="animate-envelope"
                style={{ width: 54, height: 54, objectFit: "contain" }}
              />
              {hasUnread && (
                <span
                  className="absolute -top-1 -right-1 text-[13px] leading-none"
                  style={{ color: "#E8C455", textShadow: "0 0 6px rgba(232,196,85,0.7)" }}
                >
                  ✦
                </span>
              )}
            </button>
          </div>

          {/* ── Start New Chat button ── */}
          <button
            onClick={onStartChat}
            className="w-full flex items-center justify-between px-5 py-3.5 mb-3 transition-all active:scale-[0.98] animate-fade-in delay-100"
            style={{
              backgroundImage: "url('/chat-button-bg.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderRadius: 18,
              boxShadow: "0 2px 12px rgba(80,70,160,0.07)",
              color: "#1A1A2A",
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

          {/* ── Echo's suggested practice ── */}
          {suggestedPractice && (
            <SuggestedPracticeCard
              suggestion={suggestedPractice}
              onOpen={() => {
                const cat = CATEGORIES.find((c) => c.id === suggestedPractice.categoryId);
                if (!cat) return;
                const practice = cat.practices.find((p) => p.id === suggestedPractice.practiceId);
                if (!practice) return;
                setDirectSession({ practice, category: cat });
              }}
            />
          )}

          {/* ── Micro Practice ── */}
          <div className="flex-1 flex flex-col animate-fade-in delay-300">
            <h2 className="text-[17px] font-bold mb-2.5" style={{ color: "#1A1A2A" }}>
              Micro Practice
            </h2>

            <div className="flex-1 flex flex-col gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setOpenCategory(cat)}
                  className="flex-1 w-full text-left flex flex-col items-start px-4 py-3.5 relative transition-all active:scale-[0.98] overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.72)",
                    borderRadius: 18,
                    minHeight: 80,
                    boxShadow: "0 2px 12px rgba(80,70,160,0.07)",
                  }}
                >
                  {/* Duration pill */}
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    background: `${cat.accentColor}18`,
                    color: cat.accentColor,
                    borderRadius: 999,
                    padding: "2px 10px",
                    marginBottom: 5,
                  }}>
                    {cat.duration}
                  </span>

                  {/* Name */}
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2A", marginBottom: 2 }}>
                    {cat.name}
                  </p>

                  {/* Tagline */}
                  <p style={{ fontSize: 12, color: "#888899", paddingRight: 28 }}>
                    {cat.tagline}
                  </p>

                  {/* Decorative icon — right side, centered */}
                  <svg
                    viewBox="-22 -18 174 111"
                    preserveAspectRatio="xMidYMid meet"
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: 10,
                      width: "30%",
                      height: "80%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  >
                    {cat.icon(cat.iconColor)}
                  </svg>

                  {/* Chevron */}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={cat.accentColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", opacity: 0.5 }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
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
          onClose={() => { setOpenCategory(null); setOpenPracticeIdx(0); }}
          initialIdx={openPracticeIdx}
        />
      )}

      {/* Direct session — from suggestion card */}
      {directSession && (
        <div className="absolute inset-0" style={{ zIndex: 55 }}>
          <PracticeSessionOverlay
            practice={directSession.practice}
            category={directSession.category}
            onClose={() => setDirectSession(null)}
          />
        </div>
      )}

      {/* Letter from Echo overlay */}
      {letterOpen && !letterInsufficient && <LetterOverlay onClose={() => setLetterOpen(false)} letter={activeLetter} />}
      {letterOpen && letterInsufficient && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center animate-fade-in-slow"
          style={{ background: "rgba(30,15,10,0.65)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
          onClick={() => setLetterOpen(false)}
        >
          <div className="mx-8 p-6 rounded-3xl text-center" style={{ background: "#FBF8F4" }}>
            <p className="text-2xl mb-3">✉️</p>
            <p className="font-semibold mb-2" style={{ color: "#2D2010", fontSize: 16 }}>Your letter is on its way</p>
            <p style={{ color: "#9A7A6A", fontSize: 14, lineHeight: 1.6 }}>
              Chat with Echo a few more times and a personal letter will be waiting for you here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

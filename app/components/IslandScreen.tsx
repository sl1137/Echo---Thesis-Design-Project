"use client";

import { useState } from "react";

// ─── Micro Practice Data ─────────────────────────────────────────────
interface Practice {
  id: number;
  name: string;
  theory: "CBT" | "DBT";
  emotions: string[];
  duration: string;
  description: string;
  bg: string;
  accent: string;
}

const PRACTICES: Practice[] = [
  {
    id: 1,
    name: "4-7-8 呼吸法",
    theory: "DBT",
    emotions: ["焦虑", "紧绷"],
    duration: "3 min",
    description: "通过控制呼吸节奏，快速平复焦虑和紧绷感。",
    bg: "linear-gradient(135deg, #DDEBFA 0%, #ACDAFE 100%)",
    accent: "#346382",
  },
  {
    id: 2,
    name: "5-4-3-2-1 接地练习",
    theory: "DBT",
    emotions: ["解离", "崩溃"],
    duration: "5 min",
    description: "用五感把注意力拉回当下，减轻解离感。",
    bg: "linear-gradient(135deg, #FFF0EF 0%, #FFDAB6 100%)",
    accent: "#7B5A3A",
  },
  {
    id: 3,
    name: "身体扫描",
    theory: "DBT",
    emotions: ["疲惫", "压力"],
    duration: "5 min",
    description: "从头到脚温和关注身体感受，释放紧张。",
    bg: "linear-gradient(135deg, #E0F5EE 0%, #B7E4D4 100%)",
    accent: "#1E6B4A",
  },
  {
    id: 4,
    name: "情绪命名",
    theory: "CBT",
    emotions: ["混乱", "说不清"],
    duration: "2 min",
    description: "给此刻的感受起个名字，让情绪变得清晰。",
    bg: "linear-gradient(135deg, #FFF0EF 0%, #FFDAD7 100%)",
    accent: "#904949",
  },
  {
    id: 5,
    name: "思维解离",
    theory: "CBT",
    emotions: ["反刍", "自我攻击"],
    duration: "3 min",
    description: "与负面思维拉开距离，减少反刍和自责。",
    bg: "linear-gradient(135deg, #EDE8F8 0%, #D8CEF0 100%)",
    accent: "#5A3AB5",
  },
  {
    id: 6,
    name: "自我慈悲暂停",
    theory: "CBT",
    emotions: ["自责", "羞耻"],
    duration: "3 min",
    description: "用对待好友的方式对待自己，软化苛责。",
    bg: "linear-gradient(135deg, #FFF3E0 0%, #FFDAB6 100%)",
    accent: "#7B5A3A",
  },
  {
    id: 7,
    name: "STOP 技术",
    theory: "DBT",
    emotions: ["冲动", "失控"],
    duration: "2 min",
    description: "停下来、退一步、观察，再有意识地行动。",
    bg: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
    accent: "#2E7D32",
  },
  {
    id: 8,
    name: "行为激活",
    theory: "CBT",
    emotions: ["低落", "无力"],
    duration: "5 min",
    description: "从一个极小的行动开始，打破退缩的循环。",
    bg: "linear-gradient(135deg, #FFFDE7 0%, #FFE082 100%)",
    accent: "#7B6000",
  },
];

// ─── Practice Card ────────────────────────────────────────────────────
function PracticeCard({ practice }: { practice: Practice }) {
  const [started, setStarted] = useState(false);

  return (
    <div
      className="flex-shrink-0 w-[200px] flex flex-col justify-between p-4 shadow-echo-sm"
      style={{
        background: practice.bg,
        borderRadius: "var(--radius-lg)",
        minHeight: "160px",
      }}
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: "rgba(255,255,255,0.6)",
              color: practice.accent,
            }}
          >
            {practice.theory}
          </span>
          <span className="text-[10px] text-echo-ink/50 font-medium">{practice.duration}</span>
        </div>
        <h3 className="text-[14px] font-bold text-echo-ink leading-tight mb-1">
          {practice.name}
        </h3>
        <p className="text-[12px] text-echo-ink/60 leading-snug line-clamp-2">
          {practice.description}
        </p>
      </div>

      {/* Emotion tags + Start */}
      <div className="mt-3 flex items-end justify-between">
        <div className="flex flex-wrap gap-1">
          {practice.emotions.map((e) => (
            <span
              key={e}
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{
                background: "rgba(255,255,255,0.5)",
                color: practice.accent,
              }}
            >
              {e}
            </span>
          ))}
        </div>
        <button
          onClick={() => setStarted(true)}
          className="flex-shrink-0 ml-2 w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.7)" }}
          aria-label="Start practice"
        >
          {started ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={practice.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill={practice.accent}>
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── IslandScreen ─────────────────────────────────────────────────────
interface IslandScreenProps {
  onStartChat: () => void;
}

export default function IslandScreen({ onStartChat }: IslandScreenProps) {
  return (
    <div className="h-full overflow-y-auto" style={{ background: "var(--surface)" }}>
      {/* Island illustration */}
      <div className="relative w-full" style={{ height: "44vh" }}>
        <img
          src="/island-bg.jpg"
          alt="Your Island"
          className="w-full h-full object-cover"
          style={{ objectPosition: "center 60%" }}
        />
        {/* Gradient fade into content */}
        <div
          className="absolute bottom-0 left-0 right-0 h-20"
          style={{
            background: "linear-gradient(to bottom, transparent, var(--surface))",
          }}
        />
      </div>

      {/* Content */}
      <div className="px-6 pb-6 -mt-4 relative z-10">
        {/* Greeting */}
        <div className="mb-5 animate-fade-in">
          <p
            className="text-[13px] font-medium mb-1"
            style={{ color: "var(--on_surface)", opacity: 0.55 }}
          >
            Welcome back
          </p>
          <h1
            className="text-[24px] font-bold leading-snug"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--on_surface)",
            }}
          >
            How have things
            <br />
            been today?
          </h1>
        </div>

        {/* Start Chat CTA */}
        <button
          onClick={onStartChat}
          className="w-full flex items-center justify-center gap-2 py-3.5 text-[15px] font-semibold shadow-echo-sm transition-all active:scale-[0.98] mb-8 animate-fade-in delay-100"
          style={{
            background: "rgba(255,245,243,0.85)",
            color: "#2D1B4E",
            borderRadius: "var(--radius-lg)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1.5px solid #2D1B4E",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Start Chat
        </button>

        {/* Micro Practice */}
        <div className="animate-fade-in delay-200">
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-[17px] font-bold"
              style={{ color: "var(--on_surface)" }}
            >
              Micro Practice
            </h2>
            <span
              className="text-[12px] font-medium"
              style={{ color: "var(--secondary)" }}
            >
              8 exercises
            </span>
          </div>

          <p
            className="text-[13px] mb-4 leading-snug"
            style={{ color: "var(--on_surface)", opacity: 0.5 }}
          >
            Based on CBT & DBT · 2–5 min each
          </p>

          {/* Horizontal scroll */}
          <div
            className="flex gap-3 overflow-x-auto pb-2"
            style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
          >
            {PRACTICES.map((p) => (
              <PracticeCard key={p.id} practice={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

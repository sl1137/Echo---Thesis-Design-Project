"use client";

import { useState, useEffect } from "react";

// ─── Crisis detection (shared with ChatScreen) ─────────────────────
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

// ─── Types ───────────────────────────────────────────────────────────

interface BottleReplyItem {
  id: string;
  date: string;
  text: string;
  from: "anonymous" | "echo";
}

interface BottleEntry {
  id: string;
  date: string;
  content: string;
  emotions: string[];
  topics: string[];
  replies: BottleReplyItem[];
  resonanceCount?: number;
}

interface ReceivedBottle {
  id: string;
  date: string;
  content: string;
  emotions: string[];
  topics: string[];
}

interface BottleReply {
  id: string;
  date: string;
  bottleExcerpt: string; // short snippet of the original bottle
  replyText: string;
  read: boolean;
}

// ─── API Types ───────────────────────────────────────────────────────

interface ApiBottle {
  id: string;
  content: string;
  feeling_tags: string[];
  topic_tags: string[];
  created_at: string;
  replied: boolean;
  reply_text?: string | null;
  replied_at?: string | null;
  reply_read: boolean;
  resonance_count?: number;
}

interface ApiReceivedBottle {
  recipient_record_id: string;
  content: string;
  feeling_tags: string[];
  topic_tags: string[];
  received_at: string;
  replied: boolean;
  resonated?: boolean;
}

interface ApiReply {
  id: string;
  bottle_excerpt: string;
  reply_text: string;
  replied_at: string;
  reply_read: boolean;
}

function apiBottleToEntry(b: ApiBottle): BottleEntry {
  return {
    id: b.id,
    date: new Date(b.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    content: b.content,
    emotions: b.feeling_tags,
    topics: b.topic_tags,
    replies: b.replied && b.reply_text
      ? [{ id: "replied", date: b.replied_at ? new Date(b.replied_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "", text: b.reply_text, from: "anonymous" as const }]
      : [],
    resonanceCount: b.resonance_count ?? 0,
  };
}

function apiReceivedToBottle(r: ApiReceivedBottle): ReceivedBottle & { recipientRecordId: string; replied: boolean; resonated: boolean } {
  return {
    id: r.recipient_record_id,
    recipientRecordId: r.recipient_record_id,
    date: new Date(r.received_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    content: r.content,
    emotions: r.feeling_tags,
    topics: r.topic_tags,
    replied: r.replied,
    resonated: r.resonated ?? false,
  };
}

function apiReplyToBottleReply(r: ApiReply): BottleReply {
  return {
    id: r.id,
    date: new Date(r.replied_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    bottleExcerpt: r.bottle_excerpt,
    replyText: r.reply_text,
    read: r.reply_read,
  };
}

// ─── Sample Data ─────────────────────────────────────────────────────

const SEED_MY_BOTTLES: BottleEntry[] = [
  {
    id: "1",
    date: "April 2, 2026",
    content: "Feeling overwhelmed by deadlines and expectations. Just need to let this go for a moment.",
    emotions: ["Overwhelmed", "Tired"],
    topics: ["Study"],
    replies: [
      {
        id: "r1a",
        date: "Apr 3",
        text: "I felt the same way last semester. You're not behind — you're just carrying a lot. Be gentle with yourself today.",
        from: "anonymous",
      },
      {
        id: "r1b",
        date: "Apr 4",
        text: "Deadlines can make everything feel urgent and impossible at once. You showed up anyway — that matters more than you think.",
        from: "anonymous",
      },
    ],
  },
  {
    id: "2",
    date: "March 27, 2026",
    content: "Job search anxiety. Not sure where I belong.",
    emotions: ["Lost", "Overwhelmed"],
    topics: ["Job Search"],
    replies: [
      {
        id: "r2echo",
        date: "Mar 29",
        text: "Not knowing where you belong is one of the quietest kinds of hard. You don't have to have it figured out right now — you just have to keep going.",
        from: "echo",
      },
    ],
  },
];

const SEED_BOTTLES: ReceivedBottle[] = [
  {
    id: "seed1",
    date: "Apr 26",
    content: "I keep telling myself I just need to push through, but I've been saying that for three months now. Not sure what I'm even pushing toward anymore.",
    emotions: ["Exhausted", "Lost"],
    topics: ["Grad School", "Future"],
  },
  {
    id: "seed2",
    date: "Apr 25",
    content: "Had a moment today where I just sat outside and didn't think about anything for ten minutes. First time in a while. Wanted to tell someone.",
    emotions: ["Calm", "Grateful"],
    topics: ["Daily Life"],
  },
  {
    id: "seed3",
    date: "Apr 24",
    content: "I moved here alone and I still don't really know how to explain the loneliness to people back home. It's not bad — it's just... different.",
    emotions: ["Lonely", "Homesick"],
    topics: ["International Life"],
  },
];

// ─── Constants ───────────────────────────────────────────────────────

const PAGE_BG = "url('/drift-sea-bg.png') center/cover no-repeat";

const FEELING_TAGS = ["Overwhelmed", "Lonely", "Homesick", "Tired", "Lost"];
const TOPIC_TAGS = ["Study", "Advisor", "Friendship", "Job Search", "Visa", "Daily Life"];

const SEED_REPLIES: BottleReply[] = [
  {
    id: "rep1",
    date: "Apr 3",
    bottleExcerpt: "Feeling overwhelmed by deadlines and expectations…",
    replyText: "I felt the same way last semester. You're not behind — you're just carrying a lot. Be gentle with yourself today.",
    read: false,
  },
  {
    id: "rep2",
    date: "Mar 28",
    bottleExcerpt: "Job search anxiety. Not sure where I belong.",
    replyText: "That uncertainty is real and it's exhausting. Wherever you end up, you're already someone worth finding.",
    read: true,
  },
];

// ─── Replies Screen ───────────────────────────────────────────────────

function RepliesScreen({
  onBack,
  replies,
  onMarkRead,
}: {
  onBack: () => void;
  replies: BottleReply[];
  onMarkRead: (id: string) => void;
}) {

  return (
    <div className="absolute inset-0 flex flex-col animate-fade-in" style={{ background: PAGE_BG, zIndex: 50 }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-16 pb-6 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.7)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A2A3A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-[20px] font-bold" style={{ color: "#1A2A3A" }}>Replies</h1>
        {replies.some((r) => !r.read) && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#E07840", color: "white" }}>
            {replies.filter((r) => !r.read).length} new
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {replies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[15px] font-medium mb-1" style={{ color: "#4A5A6A" }}>No replies yet</p>
            <p className="text-[13px]" style={{ color: "#9AAAB8" }}>When someone replies to your bottle,<br />it will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {replies.map((r) => (
              <button
                key={r.id}
                onClick={() => onMarkRead(r.id)}
                className="w-full text-left transition-all active:scale-[0.99]"
                style={{
                  background: r.read ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.92)",
                  borderRadius: 16,
                  padding: "14px 16px",
                  boxShadow: r.read
                    ? "0 1px 8px rgba(80,100,160,0.06)"
                    : "0 2px 14px rgba(80,100,160,0.12)",
                }}
              >
                {/* Date + unread dot */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {!r.read && (
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#E07840", flexShrink: 0 }} />
                    )}
                    <span className="text-[12px]" style={{ color: "#9AAAB8" }}>{r.date}</span>
                  </div>
                  <span className="text-[11px] italic" style={{ color: "#B0C0D0" }}>to your bottle</span>
                </div>
                {/* Original bottle excerpt */}
                <p className="text-[12px] mb-2 px-2 py-1.5 rounded-lg" style={{ color: "#8A9AAA", background: "rgba(100,130,170,0.07)", fontStyle: "italic" }}>
                  "{r.bottleExcerpt}"
                </p>
                {/* Reply text */}
                <p className="text-[14px] leading-relaxed" style={{ color: "#1A2A3A" }}>
                  {r.replyText}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Settings icons ──────────────────────────────────────────────────

function SettingsIcon({ name }: { name: string }) {
  const p = {
    width: 16, height: 16, viewBox: "0 0 24 24", fill: "none" as const,
    stroke: "#5A7A9A", strokeWidth: 1.8,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "bell":   return <svg {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
    case "moon":   return <svg {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
    case "globe":  return <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
    case "shield": return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    default:       return null;
  }
}

// ─── DriftProfileScreen ───────────────────────────────────────────────

function DriftProfileScreen({ onBack, userId }: { onBack: () => void; userId?: string }) {
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("A Graduate Student");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/drift/profile?userId=${userId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.nickname) setNickname(d.nickname);
        if (d.bio) setBio(d.bio);
      })
      .catch(() => {});
  }, [userId]);

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    await fetch("/api/drift/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, nickname, bio }),
    }).catch(() => {});
    setSaving(false);
    setEditing(false);
  }

  const displayName = nickname || "Anonymous";

  return (
    <div className="absolute inset-0 flex flex-col animate-fade-in" style={{ background: PAGE_BG, zIndex: 50 }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-16 pb-6 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.7)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A2A3A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-[20px] font-bold" style={{ color: "#1A2A3A" }}>Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5">
        {/* User card */}
        <div
          className="mb-6 px-4 py-4"
          style={{ background: "rgba(255,255,255,0.78)", borderRadius: 18, boxShadow: "0 2px 12px rgba(80,100,160,0.07)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ background: "#D0DFF0" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6A8AAA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Your nickname"
                  className="w-full text-[15px] font-bold outline-none px-2 py-1 rounded-lg mb-1"
                  style={{ background: "#EEF3FA", color: "#1A2A3A" }}
                />
              ) : (
                <p className="text-[16px] font-bold" style={{ color: "#1A2A3A" }}>{displayName}</p>
              )}
              {editing ? (
                <input
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="One-line bio"
                  className="w-full text-[12px] outline-none px-2 py-1 rounded-lg"
                  style={{ background: "#EEF3FA", color: "#6A7A8A" }}
                />
              ) : (
                <p className="text-[13px]" style={{ color: "#7A8A9A" }}>{bio}</p>
              )}
            </div>
          </div>
          {userId && (
            editing ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-2 text-[13px] rounded-xl transition-all active:scale-95"
                  style={{ background: "#EEF2FA", color: "#6A7A9A" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2 text-[13px] font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: "#5A7AAA", color: "white" }}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="w-full py-2 text-[13px] rounded-xl transition-all active:scale-95"
                style={{ background: "#EEF2FA", color: "#5A7AAA" }}
              >
                Edit profile
              </button>
            )
          )}
        </div>

        {/* Settings label */}
        <p className="text-[13px] mb-2 px-1" style={{ color: "#8A9AAA" }}>Settings</p>

        {/* Settings list */}
        <div style={{ background: "rgba(255,255,255,0.78)", borderRadius: 18, boxShadow: "0 2px 12px rgba(80,100,160,0.07)", overflow: "hidden" }}>
          {[
            { icon: "bell",   label: "Notifications",    sub: "Gentle reminders and replies" },
            { icon: "moon",   label: "Quiet Hours",       sub: "Pause notifications during rest" },
            { icon: "globe",  label: "Language",          sub: "English" },
            { icon: "shield", label: "Privacy & Safety",  sub: "Your data and boundaries" },
          ].map((item, i, arr) => (
            <div key={item.label}>
              <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all active:bg-black/5">
                <div className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0" style={{ background: "#EEF3F9" }}>
                  <SettingsIcon name={item.icon} />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold" style={{ color: "#1A2A3A" }}>{item.label}</p>
                  <p className="text-[12px]" style={{ color: "#8A9AAA" }}>{item.sub}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#AABBC8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
              {i < arr.length - 1 && (
                <div style={{ height: 1, background: "#EEF2F8", marginLeft: 56 }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DriftBottleScreen ────────────────────────────────────────────────

function DriftBottleScreen({
  onBack,
  onDrifted,
  userId,
}: {
  onBack: () => void;
  onDrifted: (bottle: BottleEntry) => void;
  userId?: string;
}) {
  const [content, setContent] = useState("");
  const [feelings, setFeelings] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [feelingOtherOpen, setFeelingOtherOpen] = useState(false);
  const [topicOtherOpen, setTopicOtherOpen] = useState(false);
  const [feelingOtherVal, setFeelingOtherVal] = useState("");
  const [topicOtherVal, setTopicOtherVal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [crisisWarning, setCrisisWarning] = useState(false);
  const [rewriteSuggestion, setRewriteSuggestion] = useState("");
  const [loadingRewrite, setLoadingRewrite] = useState(false);

  function toggle(list: string[], setList: (v: string[]) => void, tag: string) {
    setList(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);
  }

  function submitOther(
    val: string,
    list: string[],
    setList: (v: string[]) => void,
    setOpen: (v: boolean) => void,
    setVal: (v: string) => void
  ) {
    const trimmed = val.trim();
    if (trimmed && !list.includes(trimmed)) setList([...list, trimmed]);
    setOpen(false);
    setVal("");
  }

  async function handleDrift() {
    if (!content.trim() || submitting) return;
    if (detectCrisis(content)) {
      setCrisisWarning(true);
      // Fetch AI rewrite suggestion
      setLoadingRewrite(true);
      setRewriteSuggestion("");
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `[DRIFT_REWRITE] ${content.trim()}`,
            conversation: [],
          }),
        });
        const data = await res.json();
        const suggestion = data.bubbles?.[0] || "";
        setRewriteSuggestion(suggestion);
      } catch { /* ignore */ }
      setLoadingRewrite(false);
      return;
    }
    setSubmitting(true);
    const now = new Date();
    const entry: BottleEntry = {
      id: Date.now().toString(),
      date: now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      content: content.trim(),
      emotions: feelings,
      topics,
      replies: [],
    };

    if (userId) {
      try {
        const res = await fetch("/api/drift/bottle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, content: content.trim(), feelingTags: feelings, topicTags: topics }),
        });
        const data = await res.json();
        if (data.bottleId) entry.id = data.bottleId;
      } catch {
        // Fall through — still show confirmation even if API fails
      }
    }

    setSubmitting(false);
    onDrifted(entry);
  }

  return (
    <div className="absolute inset-0 flex flex-col animate-fade-in" style={{ background: PAGE_BG, zIndex: 50 }}>
      <img
        src="/lighthouse.png"
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          right: 0,
          top: 50,
          width: 140,
          mixBlendMode: "multiply",
          opacity: 0.9,
          pointerEvents: "none",
          userSelect: "none",
          zIndex: 0,
        }}
      />
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-16 pb-2 flex-shrink-0" style={{ position: "relative", zIndex: 1 }}>
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.7)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A2A3A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-[20px] font-bold" style={{ color: "#1A2A3A" }}>Drift a bottle</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <p className="text-[15px] mb-5 mt-1" style={{ color: "#6A7A8A" }}>Let one feeling drift</p>

        {/* Bottle card */}
        <div
          className="mb-5 p-4"
          style={{ background: "rgba(255,255,255,0.82)", borderRadius: 18, boxShadow: "0 2px 14px rgba(80,100,160,0.07)" }}
        >
          <p className="text-[13px] font-semibold mb-3" style={{ color: "#4A5A6A" }}>Your bottle</p>
          <textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); if (crisisWarning) setCrisisWarning(false); }}
            placeholder="You don't need to explain everything. Just leave the part that feels heaviest."
            rows={4}
            className="w-full resize-none outline-none text-[14px] leading-relaxed p-3"
            style={{ background: "#EEF3FA", borderRadius: 12, color: "#2A3A4A" }}
          />
        </div>

        {/* Feelings */}
        <p className="text-[13px] mb-3" style={{ color: "#6A7A8A" }}>How are you feeling?</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {FEELING_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggle(feelings, setFeelings, tag)}
              className="text-[12px] px-3 py-1.5 transition-all active:scale-95"
              style={{
                borderRadius: 999,
                background: feelings.includes(tag) ? "#D0DCEA" : "rgba(255,255,255,0.82)",
                color: feelings.includes(tag) ? "#3A5A7A" : "#4A5A6A",
                boxShadow: "0 1px 6px rgba(80,100,160,0.09)",
              }}
            >
              {tag}
            </button>
          ))}
          {/* Custom feeling tags */}
          {feelings.filter((t) => !FEELING_TAGS.includes(t)).map((tag) => (
            <button
              key={tag}
              onClick={() => toggle(feelings, setFeelings, tag)}
              className="text-[12px] px-3 py-1.5 transition-all active:scale-95"
              style={{ borderRadius: 999, background: "#D0DCEA", color: "#3A5A7A", boxShadow: "0 1px 4px rgba(80,100,160,0.09)" }}
            >
              {tag} ×
            </button>
          ))}
          {feelingOtherOpen ? (
            <input
              autoFocus
              value={feelingOtherVal}
              onChange={(e) => setFeelingOtherVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitOther(feelingOtherVal, feelings, setFeelings, setFeelingOtherOpen, setFeelingOtherVal);
                if (e.key === "Escape") { setFeelingOtherOpen(false); setFeelingOtherVal(""); }
              }}
              onBlur={() => submitOther(feelingOtherVal, feelings, setFeelings, setFeelingOtherOpen, setFeelingOtherVal)}
              placeholder="Type & press enter"
              className="text-[12px] px-3 py-1.5 outline-none"
              style={{ borderRadius: 999, background: "rgba(255,255,255,0.82)", color: "#3A5A7A", boxShadow: "0 1px 4px rgba(80,100,160,0.09)", width: 140 }}
            />
          ) : (
            <button
              onClick={() => setFeelingOtherOpen(true)}
              className="text-[12px] px-3 py-1.5 transition-all active:scale-95"
              style={{ borderRadius: 999, background: "rgba(255,255,255,0.82)", color: "#9AAAB8", boxShadow: "0 1px 6px rgba(80,100,160,0.09)" }}
            >
              + Other
            </button>
          )}
        </div>

        {/* Topics */}
        <p className="text-[13px] mb-3" style={{ color: "#6A7A8A" }}>What's it about?</p>
        <div className="flex flex-wrap gap-2 mb-8">
          {TOPIC_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggle(topics, setTopics, tag)}
              className="text-[12px] px-3 py-1.5 transition-all active:scale-95"
              style={{
                borderRadius: 999,
                background: topics.includes(tag) ? "#D0DCEA" : "rgba(255,255,255,0.82)",
                color: topics.includes(tag) ? "#3A5A7A" : "#4A5A6A",
                boxShadow: "0 1px 6px rgba(80,100,160,0.09)",
              }}
            >
              {tag}
            </button>
          ))}
          {/* Custom topic tags */}
          {topics.filter((t) => !TOPIC_TAGS.includes(t)).map((tag) => (
            <button
              key={tag}
              onClick={() => toggle(topics, setTopics, tag)}
              className="text-[12px] px-3 py-1.5 transition-all active:scale-95"
              style={{ borderRadius: 999, background: "#D0DCEA", color: "#3A5A7A", boxShadow: "0 1px 4px rgba(80,100,160,0.09)" }}
            >
              {tag} ×
            </button>
          ))}
          {topicOtherOpen ? (
            <input
              autoFocus
              value={topicOtherVal}
              onChange={(e) => setTopicOtherVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitOther(topicOtherVal, topics, setTopics, setTopicOtherOpen, setTopicOtherVal);
                if (e.key === "Escape") { setTopicOtherOpen(false); setTopicOtherVal(""); }
              }}
              onBlur={() => submitOther(topicOtherVal, topics, setTopics, setTopicOtherOpen, setTopicOtherVal)}
              placeholder="Type & press enter"
              className="text-[12px] px-3 py-1.5 outline-none"
              style={{ borderRadius: 999, background: "rgba(255,255,255,0.82)", color: "#3A5A7A", boxShadow: "0 1px 4px rgba(80,100,160,0.09)", width: 140 }}
            />
          ) : (
            <button
              onClick={() => setTopicOtherOpen(true)}
              className="text-[12px] px-3 py-1.5 transition-all active:scale-95"
              style={{ borderRadius: 999, background: "rgba(255,255,255,0.82)", color: "#9AAAB8", boxShadow: "0 1px 6px rgba(80,100,160,0.09)" }}
            >
              + Other
            </button>
          )}
        </div>

        {/* Crisis warning */}
        {crisisWarning && (
          <div
            className="mb-4 animate-fade-in"
            style={{
              background: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1.5px dashed rgba(100,120,180,0.25)",
              borderRadius: 20,
              padding: 16,
            }}
          >
            <p className="text-[13px] leading-relaxed mb-3" style={{ color: "#4A5A6A" }}>
              It sounds like you might be going through something really difficult. A drift bottle reaches other students — for this kind of pain, please consider reaching out to someone who can truly help.
            </p>
            <div className="flex flex-col gap-1.5 mb-3">
              {[
                { name: "988 Suicide & Crisis Lifeline", detail: "Call or text 988 · 24/7 (US)", href: "https://988lifeline.org", accent: "#3A5A9A" },
                { name: "Crisis Text Line", detail: "Text HOME to 741741", href: "https://www.crisistextline.org", accent: "#7A5AAA" },
                { name: "Find a Helpline", detail: "International · 200+ countries", href: "https://findahelpline.com", accent: "#3A7A5A" },
              ].map((r) => (
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
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={r.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              ))}
            </div>
            {/* AI rewrite suggestion */}
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(100,120,180,0.12)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#9AA0B0" }}>
                Try expressing it differently
              </p>
              {loadingRewrite ? (
                <p className="text-[12.5px] italic" style={{ color: "#8A9AAA" }}>Thinking of a suggestion…</p>
              ) : rewriteSuggestion ? (
                <button
                  onClick={() => { setContent(rewriteSuggestion); setCrisisWarning(false); }}
                  className="w-full text-left px-3 py-2.5 rounded-xl transition-all active:scale-[0.98]"
                  style={{ background: "rgba(90,122,170,0.08)", color: "#3A5A7A", fontSize: 13, lineHeight: 1.5 }}
                >
                  "{rewriteSuggestion}" <span className="text-[11px] ml-1" style={{ color: "#7A9AAA" }}>← tap to use</span>
                </button>
              ) : null}
            </div>
          </div>
        )}

        {/* Let it drift */}
        <button
          onClick={handleDrift}
          disabled={!content.trim() || submitting}
          className="w-full py-3.5 text-[15px] font-semibold transition-all active:scale-[0.98] disabled:opacity-40"
          style={{ borderRadius: 999, background: "#7A9BAC", color: "white" }}
        >
          {submitting ? "Drifting…" : "Let it drift"}
        </button>
        <p className="text-center text-[12px] mt-3" style={{ color: "#8A9AAA" }}>
          ≈ Anonymous. Gentle. No pressure to continue.
        </p>
      </div>
    </div>
  );
}

// ─── DriftedConfirmation ──────────────────────────────────────────────

function DriftedConfirmation({ onDismiss }: { onDismiss: () => void }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      onClick={() => ready && onDismiss()}
      className="absolute inset-0 flex flex-col items-center justify-center animate-fade-in"
      style={{ background: PAGE_BG, zIndex: 60, cursor: ready ? "pointer" : "default" }}
    >
      {/* Ripple rings — flex-centered behind the bottle */}
      <div className="relative flex items-center justify-center" style={{ width: 280, height: 280, marginBottom: 32 }}>
        <div className="animate-ripple-1" style={{
          position: "absolute", width: 160, height: 160, borderRadius: "50%",
          border: "1.5px solid rgba(100,160,210,0.4)", pointerEvents: "none",
        }} />
        <div className="animate-ripple-2" style={{
          position: "absolute", width: 160, height: 160, borderRadius: "50%",
          border: "1.5px solid rgba(100,160,210,0.35)", pointerEvents: "none",
        }} />
        <div className="animate-ripple-3" style={{
          position: "absolute", width: 160, height: 160, borderRadius: "50%",
          border: "1.5px solid rgba(100,160,210,0.3)", pointerEvents: "none",
        }} />
        <img
          src="/bottle-drift.png"
          alt="bottle drifting"
          className="animate-bottle-appear animate-bottle-drift"
          style={{ width: 260, height: 260, objectFit: "contain", position: "relative", zIndex: 1 }}
        />
      </div>

      <p className="text-[20px] font-semibold" style={{ color: "#3A5A7A" }}>
        Your bottle is now drifting
      </p>
      <p className="text-[14px] mt-2" style={{ color: "#8A9AAA" }}>
        Somewhere out there, someone will find it.
      </p>
      <p className="text-[12px] mt-8 animate-fade-in-slow delay-700" style={{ color: "#B0C4D8" }}>
        Tap anywhere to continue
      </p>
    </div>
  );
}

// ─── Bottle Detail Screen ─────────────────────────────────────────────

function BottleDetailScreen({ bottle, onBack }: { bottle: BottleEntry; onBack: () => void }) {
  const hasEchoReply = bottle.replies.some((r) => r.from === "echo");

  return (
    <div className="absolute inset-0 flex flex-col animate-fade-in" style={{ background: PAGE_BG, zIndex: 50 }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-16 pb-4 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.7)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A2A3A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-[20px] font-bold" style={{ color: "#1A2A3A" }}>Your Bottle</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {/* Original bottle */}
        <div className="mb-5 p-4" style={{ background: "rgba(255,255,255,0.82)", borderRadius: 16, boxShadow: "0 1px 8px rgba(80,100,160,0.06)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <CalendarIcon />
            <span className="text-[12px]" style={{ color: "#9AAAB8" }}>{bottle.date}</span>
          </div>
          <p className="text-[14px] leading-relaxed mb-3" style={{ color: "#1A2A3A" }}>{bottle.content}</p>
          <div className="flex flex-wrap gap-1.5">
            {[...bottle.emotions, ...bottle.topics].map((tag) => (
              <TagPill key={tag} label={tag} />
            ))}
          </div>
        </div>

        {/* Resonance count */}
        {(bottle.resonanceCount ?? 0) > 0 && (
          <div className="flex items-center gap-1.5 mb-4 px-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#C07090" stroke="#C07090" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span className="text-[13px]" style={{ color: "#C07090" }}>
              {bottle.resonanceCount} {bottle.resonanceCount === 1 ? "person felt this too" : "people felt this too"}
            </span>
          </div>
        )}

        {/* Replies section */}
        <p className="text-[13px] font-semibold mb-3 px-1" style={{ color: "#8A9AAA" }}>
          {bottle.replies.length === 0 ? "No replies yet" : `${bottle.replies.length} ${bottle.replies.length === 1 ? "reply" : "replies"}`}
        </p>

        {bottle.replies.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <p className="text-[13px]" style={{ color: "#B0C0D0" }}>
              If no one replies within 48 hours,<br />Echo will leave a note for you.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {bottle.replies.map((reply) => (
              <div key={reply.id} style={{
                background: reply.from === "echo" ? "rgba(220,230,248,0.7)" : "rgba(255,255,255,0.82)",
                borderRadius: 16,
                padding: "14px 16px",
                boxShadow: "0 1px 8px rgba(80,100,160,0.06)",
              }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px]" style={{ color: "#9AAAB8" }}>{reply.date}</span>
                  {reply.from === "echo" ? (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(90,122,170,0.15)", color: "#5A7AAA" }}>
                      from Echo
                    </span>
                  ) : (
                    <span className="text-[11px] italic" style={{ color: "#B0C0D0" }}>Anonymous</span>
                  )}
                </div>
                <p className="text-[14px] leading-relaxed" style={{ color: "#1A2A3A" }}>{reply.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Echo auto-reply note */}
        {!hasEchoReply && bottle.replies.length > 0 && (
          <p className="text-center text-[11px] mt-4" style={{ color: "#B0C0D0" }}>
            Echo will check in if no one else replies within 48 hours.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── My Bottle Card ──────────────────────────────────────────────────

function MyBottleCard({ bottle, onRecall, onOpen }: { bottle: BottleEntry; onRecall: () => void; onOpen: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const replyCount = bottle.replies.length;

  return (
    <div
      onClick={confirming ? undefined : onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (!confirming && e.key === "Enter") onOpen(); }}
      className="w-full text-left transition-all active:scale-[0.99] cursor-pointer"
      style={{ background: "rgba(255,255,255,0.82)", borderRadius: 16, padding: "14px 16px", boxShadow: "0 1px 8px rgba(80,100,160,0.06)" }}
    >
      {/* Date row + reply count + recall icon */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <CalendarIcon />
            <span className="text-[12px]" style={{ color: "#9AAAB8" }}>{bottle.date}</span>
          </div>
          {replyCount > 0 && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#EEF2FA", color: "#6A8AAA" }}>
              {replyCount} {replyCount === 1 ? "reply" : "replies"}
            </span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setConfirming((c) => !c); }}
          className="w-7 h-7 flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{ background: confirming ? "#FDE8EE" : "transparent" }}
          title="Recall bottle"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={confirming ? "#C07090" : "#C0CEDD"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
          </svg>
        </button>
      </div>

      <p className="text-[14px] leading-relaxed mb-3" style={{ color: "#1A2A3A" }}>{bottle.content}</p>
      <div className="flex flex-wrap gap-1.5" style={{ marginBottom: confirming ? 12 : 0 }}>
        {[...bottle.emotions, ...bottle.topics].map((tag) => (
          <TagPill key={tag} label={tag} />
        ))}
      </div>

      {/* Inline confirm */}
      {confirming && (
        <div className="flex items-center justify-between pt-3 animate-fade-in"
          style={{ borderTop: "1px solid #EEF2FA" }}>
          <p className="text-[12px]" style={{ color: "#8A9AAA" }}>Recall this bottle?</p>
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
              className="text-[12px] px-3 py-1.5 rounded-full transition-all active:scale-95"
              style={{ background: "#EEF2FA", color: "#6A7A9A" }}
            >
              Cancel
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRecall(); }}
              className="text-[12px] px-3 py-1.5 rounded-full transition-all active:scale-95"
              style={{ background: "#FDEAF2", color: "#C07090" }}
            >
              Recall
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Received Bottle Card ────────────────────────────────────────────

// ─── Reply Sheet Overlay ─────────────────────────────────────────────

const REPLY_STARTERS = [
  "I felt that too…",
  "Something that helped me…",
  "You're not alone because…",
];

function ReplySheetOverlay({
  bottle,
  userId,
  recipientRecordId,
  isSeed,
  onClose,
  onSent,
}: {
  bottle: ReceivedBottle;
  userId?: string;
  recipientRecordId?: string;
  isSeed?: boolean;
  onClose: () => void;
  onSent: () => void;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    if (!isSeed && userId && recipientRecordId) {
      try {
        await fetch("/api/drift/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, recipientRecordId, replyText: text.trim() }),
        });
      } catch { /* show success anyway */ }
    }
    setSending(false);
    setDone(true);
    setTimeout(() => { onSent(); onClose(); }, 1400);
  }

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col animate-fade-in"
      style={{ background: PAGE_BG }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-14 pb-4 flex-shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.70)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3A4A5A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <p className="text-[16px] font-bold" style={{ color: "#1A2A3A" }}>Reply to this bottle</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 flex flex-col gap-4">
        {/* Quote */}
        <div className="p-4" style={{ background: "rgba(255,255,255,0.78)", borderRadius: 18, boxShadow: "0 2px 12px rgba(80,100,160,0.07)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#9AAAB8" }}>A bottle from the ocean</p>
          <p className="text-[13px] leading-relaxed italic" style={{ color: "#4A5A6A" }}>
            "{bottle.content.slice(0, 120)}{bottle.content.length > 120 ? "…" : ""}"
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {[...bottle.emotions, ...bottle.topics].map((tag) => (
              <TagPill key={tag} label={tag} />
            ))}
          </div>
        </div>

        {/* Starter prompts */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: "#9AAAB8" }}>Start with</p>
          <div className="flex flex-wrap gap-2">
            {REPLY_STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => setText(s)}
                className="text-[12px] px-3 py-1.5 rounded-full transition-all active:scale-95"
                style={{ background: "rgba(255,255,255,0.80)", color: "#4A6A8A", border: "1px solid rgba(100,140,180,0.18)" }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <div className="p-4" style={{ background: "rgba(255,255,255,0.82)", borderRadius: 18, boxShadow: "0 2px 12px rgba(80,100,160,0.07)" }}>
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write something genuine…"
            rows={5}
            className="w-full text-[14px] leading-relaxed outline-none resize-none"
            style={{ background: "transparent", color: "#1A2A3A" }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending || done}
          className="w-full py-3.5 flex items-center justify-center gap-2 rounded-2xl font-semibold text-[15px] transition-all active:scale-[0.98]"
          style={{
            background: done ? "#4A8A6A" : (!text.trim() ? "rgba(45,58,74,0.35)" : "#2D3A4A"),
            color: "white",
          }}
        >
          {done ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {isSeed ? "Your reply drifted out 🌊" : "Reply sent"}
            </>
          ) : sending ? "Sending…" : "Send reply"}
        </button>
      </div>
    </div>
  );
}

// ─── Received Bottle Card ─────────────────────────────────────────────

function ReceivedBottleCard({
  bottle,
  userId,
  recipientRecordId,
  initialHearted = false,
  isSeed = false,
  onReplySent,
}: {
  bottle: ReceivedBottle;
  userId?: string;
  recipientRecordId?: string;
  initialHearted?: boolean;
  isSeed?: boolean;
  onReplySent?: (id: string) => void;
}) {
  const [hearted, setHearted] = useState(initialHearted);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replySent, setReplySent] = useState((bottle as ReceivedBottle & { replied?: boolean }).replied ?? false);

  async function toggleHeart() {
    const next = !hearted;
    setHearted(next);
    if (!isSeed && userId && recipientRecordId) {
      try {
        await fetch("/api/drift/resonate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, recipientRecordId }),
        });
      } catch { /* optimistic, swallow error */ }
    }
  }

  return (
    <>
    <div style={{ background: "rgba(255,255,255,0.82)", borderRadius: 16, padding: "14px 16px", boxShadow: "0 1px 8px rgba(80,100,160,0.06)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px]" style={{ color: "#9AAAB8" }}>{bottle.date}</span>
        <span className="text-[12px] italic" style={{ color: "#9AAAB8" }}>Anonymous</span>
      </div>
      <p className="text-[14px] leading-relaxed mb-3" style={{ color: "#1A2A3A" }}>{bottle.content}</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {[...bottle.emotions, ...bottle.topics].map((tag) => (
          <TagPill key={tag} label={tag} />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={toggleHeart}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 transition-all active:scale-95"
          style={{
            background: hearted ? "#F9D0DF" : "#FDEAF2",
            borderRadius: 12,
            color: "#C07090",
            transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24"
            fill={hearted ? "#C07090" : "none"}
            stroke="#C07090" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span className="text-[12px] font-medium">Felt this too</span>
        </button>

        {replySent ? (
          <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5"
            style={{ background: "#EAF4EE", borderRadius: 12, color: "#4A8A6A" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-[12px] font-medium">Reply sent</span>
          </div>
        ) : (
          <button
            onClick={() => setReplyOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 transition-all active:scale-95"
            style={{ background: "#EEF2FA", borderRadius: 12, color: "#5A7AAA" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="text-[12px] font-medium">Gentle reply</span>
          </button>
        )}
      </div>
    </div>

    {/* Full-screen reply sheet */}
    {replyOpen && (
      <ReplySheetOverlay
        bottle={bottle}
        userId={userId}
        recipientRecordId={recipientRecordId}
        isSeed={isSeed}
        onClose={() => setReplyOpen(false)}
        onSent={() => {
          setReplySent(true);
          onReplySent?.(recipientRecordId ?? bottle.id);
        }}
      />
    )}
    </>
  );
}

// ─── Tag pill ─────────────────────────────────────────────────────────

function TagPill({ label }: { label: string }) {
  return (
    <span
      className="text-[12px] px-3 py-1 rounded-full"
      style={{ background: "#EEF2FA", color: "#6A7A9A" }}
    >
      {label}
    </span>
  );
}

// ─── Calendar icon ────────────────────────────────────────────────────

function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9AAAB8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

// ─── Persistent state (survives tab switching / unmount) ──────────────
let _myBottles: BottleEntry[] = SEED_MY_BOTTLES;
let _replies: BottleReply[] = SEED_REPLIES;

// ─── DriftSeaScreen ───────────────────────────────────────────────────

export default function DriftSeaScreen({ isGuest = true, userId }: { isGuest?: boolean; userId?: string }) {
  const [activeTab, setActiveTab] = useState<"my" | "received">("received");
  const [driftOpen, setDriftOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [detailBottle, setDetailBottle] = useState<BottleEntry | null>(null);
  const [drifted, setDrifted] = useState(false);
  const [myBottles, _setMyBottles] = useState<BottleEntry[]>(() => isGuest ? _myBottles : []);
  const [receivedBottles, setReceivedBottles] = useState<(ReceivedBottle & { recipientRecordId: string; replied: boolean })[]>([]);
  const [replies, _setReplies] = useState<BottleReply[]>(() => isGuest ? _replies : []);
  const unreadCount = replies.filter((r) => !r.read).length;

  // Fetch real data for logged-in users
  useEffect(() => {
    if (!userId) return;
    Promise.all([
      fetch(`/api/drift/mine?userId=${userId}`).then((r) => r.json()),
      fetch(`/api/drift/received?userId=${userId}`).then((r) => r.json()),
      fetch(`/api/drift/replies?userId=${userId}`).then((r) => r.json()),
    ]).then(async ([mine, received, repliesData]) => {
      if (mine.bottles) {
        _setMyBottles(mine.bottles.map(apiBottleToEntry));
      }
      if (repliesData.replies) {
        _setReplies(repliesData.replies.map(apiReplyToBottleReply));
      }
      // If no received bottles, try to assign orphaned bottles from other users
      const receivedList = received.bottles ?? [];
      if (receivedList.length === 0) {
        await fetch("/api/drift/init-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }).catch(() => {});
        // Re-fetch received after potential assignment
        const refreshed = await fetch(`/api/drift/received?userId=${userId}`).then((r) => r.json()).catch(() => ({}));
        setReceivedBottles((refreshed.bottles ?? []).map(apiReceivedToBottle));
      } else {
        setReceivedBottles(receivedList.map(apiReceivedToBottle));
      }
    }).catch(() => {});
  }, [userId]);

  function setMyBottles(updater: BottleEntry[] | ((prev: BottleEntry[]) => BottleEntry[])) {
    _setMyBottles((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (isGuest) _myBottles = next;
      return next;
    });
  }
  function setReplies(updater: BottleReply[] | ((prev: BottleReply[]) => BottleReply[])) {
    _setReplies((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (isGuest) _replies = next;
      return next;
    });
  }

  function handleDrifted(bottle: BottleEntry) {
    setDriftOpen(false);
    setMyBottles((prev) => [bottle, ...prev]);
    setDrifted(true);
  }

  function handleDriftDismiss() {
    setDrifted(false);
    setActiveTab("my");
  }

  async function handleRepliesOpen() {
    setRepliesOpen(true);
    // Mark all unread replies as read via API
    if (userId) {
      const unread = replies.filter((r) => !r.read);
      await Promise.all(
        unread.map((r) =>
          fetch("/api/drift/replies", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipientRecordId: r.id }),
          })
        )
      ).catch(() => {});
    }
    setReplies((prev) => prev.map((r) => ({ ...r, read: true })));
  }

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: PAGE_BG }}>
      {/* Scrollable main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pt-16 pb-4">

          {/* ── Header ── */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-[26px] font-bold leading-tight" style={{ color: "#1A2A3A" }}>Drift Sea</h1>
              <p className="text-[13px] mt-0.5" style={{ color: "#8A9AAA" }}>Let one feeling drift</p>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {/* Bell — replies */}
              <button
                onClick={handleRepliesOpen}
                className="w-10 h-10 flex items-center justify-center relative transition-all active:scale-90"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6A8AAA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span
                    className="absolute top-1.5 right-1.5 flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ width: 14, height: 14, borderRadius: "50%", background: "#E07840" }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
              {/* Profile */}
              <button
                onClick={() => setProfileOpen(true)}
                className="w-10 h-10 flex items-center justify-center transition-all active:scale-90"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6A8AAA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── Drift a bottle card ── */}
          <button
            onClick={() => setDriftOpen(true)}
            className="w-full mb-6 transition-all active:scale-[0.98]"
            style={{
              backgroundImage: "url('/drift-card-bg.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderRadius: 20,
              boxShadow: "0 2px 14px rgba(80,100,160,0.08)",
              padding: "24px 16px",
            }}
          >
            <div className="flex flex-col items-center">
              {/* Concentric rings + bottle icon */}
              <div className="relative flex items-center justify-center mb-3" style={{ width: 110, height: 110 }}>
                {/* Outer ring */}
                <div style={{ position: "absolute", width: 110, height: 110, borderRadius: "50%", border: "1.2px solid rgba(100,130,160,0.13)" }} />
                {/* Middle ring */}
                <div style={{ position: "absolute", width: 84, height: 84, borderRadius: "50%", border: "1.2px solid rgba(100,130,160,0.15)" }} />
                {/* Inner filled circle */}
                <div style={{ position: "absolute", width: 62, height: 62, borderRadius: "50%", background: "rgba(235,240,250,0.9)" }} />
                {/* Bottle SVG — floats gently */}
                <svg
                  className="animate-float"
                  width="28" height="36"
                  viewBox="0 0 28 36"
                  fill="none"
                  stroke="#2C3E50"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ position: "relative" }}
                >
                  {/* Cap — small rounded rect */}
                  <rect x="10" y="1" width="8" height="4" rx="1.8" />
                  {/* Short neck */}
                  <path d="M10.5 5 L9 8 M17.5 5 L19 8" />
                  {/* Body — tall oval (rx equals half-width for fully rounded sides) */}
                  <rect x="5" y="8" width="18" height="24" rx="9" />
                  {/* Two label lines */}
                  <line x1="8.5" y1="18" x2="19.5" y2="18" strokeOpacity="0.4" />
                  <line x1="8.5" y1="22" x2="19.5" y2="22" strokeOpacity="0.4" />
                </svg>
              </div>
              <p className="text-[15px] font-semibold" style={{ color: "#2A3A4A" }}>Drift a bottle</p>
            </div>
          </button>

          {/* ── Tab switcher ── */}
          <div className="flex p-1 rounded-full mb-4" style={{ background: "rgba(100,130,170,0.12)" }}>
            {(["my", "received"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-1.5 text-[14px] font-semibold rounded-full transition-all"
                style={{
                  color: activeTab === tab ? "#E07840" : "#9AAAB8",
                  background: activeTab === tab ? "rgba(255,255,255,0.82)" : "transparent",
                  boxShadow: activeTab === tab ? "0 1px 4px rgba(80,100,160,0.10)" : "none",
                }}
              >
                {tab === "my" ? "My Bottles" : "Bottles Received"}
              </button>
            ))}
          </div>

          {/* ── My Bottles ── */}
          {activeTab === "my" && (
            <div className="flex flex-col gap-3">
              {myBottles.length === 0 ? (
                <div className="flex items-center justify-center py-16 px-6 text-center">
                  <p className="text-[14px] leading-relaxed" style={{ color: "rgba(60,70,120,0.7)" }}>
                    You haven't sent any bottles yet.<br />Start a conversation and let one drift.
                  </p>
                </div>
              ) : myBottles.map((b) => (
                <MyBottleCard
                  key={b.id}
                  bottle={b}
                  onOpen={() => setDetailBottle(b)}
                  onRecall={async () => {
                    if (userId) {
                      try {
                        await fetch(`/api/drift/bottle?id=${b.id}&userId=${userId}`, { method: "DELETE" });
                      } catch { /* swallow — still remove from UI */ }
                    }
                    setMyBottles((prev) => prev.filter((x) => x.id !== b.id));
                  }}
                />
              ))}
            </div>
          )}

          {/* ── Bottles Received ── */}
          {activeTab === "received" && (
            <div className="flex flex-col gap-3">
              {(isGuest || receivedBottles.length === 0) && (
                <p className="text-[11px] text-center pb-0.5" style={{ color: "#9AAAB8" }}>
                  {isGuest ? "Sample bottles from the ocean" : "From the ocean — reply while you wait for your matches"}
                </p>
              )}
              {(isGuest
                ? SEED_BOTTLES
                : receivedBottles.length > 0
                  ? receivedBottles
                  : SEED_BOTTLES
              ).map((b) => {
                const real = !isGuest && receivedBottles.length > 0;
                const rb = b as ReceivedBottle & { recipientRecordId?: string; replied?: boolean; resonated?: boolean };
                return (
                  <ReceivedBottleCard
                    key={b.id}
                    bottle={b}
                    userId={real ? userId : undefined}
                    recipientRecordId={rb.recipientRecordId}
                    initialHearted={rb.resonated ?? false}
                    isSeed={!real}
                    onReplySent={(id) => setReceivedBottles((prev) => prev.map((r) => r.id === id ? { ...r, replied: true } : r))}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>


      {/* ── Overlays ── */}
      {driftOpen && (
        <DriftBottleScreen onBack={() => setDriftOpen(false)} onDrifted={handleDrifted} userId={userId} />
      )}
      {profileOpen && (
        <DriftProfileScreen onBack={() => setProfileOpen(false)} userId={userId} />
      )}
      {repliesOpen && (
        <RepliesScreen
          onBack={() => setRepliesOpen(false)}
          replies={replies}
          onMarkRead={(id) => setReplies((prev) => prev.map((r) => r.id === id ? { ...r, read: true } : r))}
        />
      )}
      {detailBottle && (
        <BottleDetailScreen bottle={detailBottle} onBack={() => setDetailBottle(null)} />
      )}
      {drifted && <DriftedConfirmation onDismiss={handleDriftDismiss} />}
    </div>
  );
}

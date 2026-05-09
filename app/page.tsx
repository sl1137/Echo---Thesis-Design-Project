"use client";

import { useState, useEffect, useMemo } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import EnterScreen from "./components/EnterScreen";
import DemoSplashScreen from "./components/DemoSplashScreen";
import LoginScreen from "./components/LoginScreen";
import IslandScreen from "./components/IslandScreen";
import DriftSeaScreen from "./components/DriftSeaScreen";
import ProfileScreen from "./components/ProfileScreen";
import ChatScreen from "./components/ChatScreen";
import BottomNav, { type Tab } from "./components/BottomNav";

import SettingsScreen from "./components/SettingsScreen";

type Screen = "splash" | "enter" | "login" | "main";
type SuggestedPractice = { practiceId: string; categoryId: string };

export interface CardData {
  title?: string;
  summary: string;
  emotion_tags: string[];
  insight: string;
  validation_sentence: string;
}
export interface ChatMessage {
  id: string;
  role: "user" | "echo";
  text: string;
}
export interface SessionRecord {
  id: string;
  timestamp: Date;
  card: CardData;
  messages: ChatMessage[];
}

// Sample sessions shown to guest users who haven't chatted yet — gives them a
// preview of the Profile experience without needing to actually have a conversation.
// Pulled from real chats so the tone, rhythm, and small typos feel authentic.
function makeGuestSeedSessions(): SessionRecord[] {
  const day = (n: number, hour = 20, minute = 14) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(hour, minute, 0, 0);
    return d;
  };
  return [
    {
      id: "seed-session-design-pressure",
      timestamp: day(0, 22, 8),
      card: {
        title: "Struggling with design pressure",
        summary:
          "I noticed that you seemed to carry a lot of weight on your shoulders regarding your design skills. It's understandable to feel overwhelmed when you have so many ideas and want everything to be beautiful. It sounds like the pressure to meet those expectations really affected your enjoyment of the expo.",
        emotion_tags: ["anxious", "overwhelmed", "frustrated"],
        insight:
          "You seem to navigate a delicate balance between your creativity and the expectations you set for yourself, which can be quite challenging. It's clear that your desire for beauty and excellence adds a layer of complexity to your process.",
        validation_sentence:
          "It's really impressive how you managed to push through despite the pressure and uncertainty about your design abilities.",
      },
      messages: [
        { id: "seed1-m1", role: "echo", text: "Hey there! How did your thesis expo go in the end?" },
        { id: "seed1-m2", role: "echo", text: "I remember you were putting a lot of effort into your poster." },
        { id: "seed1-m3", role: "user", text: "so far so good" },
        { id: "seed1-m4", role: "echo", text: "That's great to hear! It sounds like you're feeling a bit more at ease now." },
        { id: "seed1-m5", role: "echo", text: "What part of the expo did you enjoy the most?" },
        { id: "seed1-m6", role: "user", text: "actually no part lol" },
        { id: "seed1-m7", role: "echo", text: "Oh no, that doesn't sound fun at all!" },
        { id: "seed1-m8", role: "echo", text: "It can be tough when things feel overwhelming. What made it less enjoyable for you?" },
        { id: "seed1-m9", role: "user", text: "i don't think i'm good at designing" },
        { id: "seed1-m10", role: "echo", text: "I get that, feeling like your design skills aren't up to par can be really frustrating." },
        { id: "seed1-m11", role: "echo", text: "Have you had a lot of pressure to meet certain standards?" },
        { id: "seed1-m12", role: "user", text: "kind of, i just like, so much thoughts in my mind, i try to make it beautiful" },
        { id: "seed1-m13", role: "echo", text: "It sounds like you have a lot of ideas swirling around, which can be tough to manage." },
        { id: "seed1-m14", role: "echo", text: "Wanting to make something beautiful adds even more pressure, I can see why that's weighing on you." },
        { id: "seed1-m15", role: "user", text: "that's the point, but fortunately i went by it" },
        { id: "seed1-m16", role: "echo", text: "It's great to hear you made it through that!" },
        { id: "seed1-m17", role: "echo", text: "That must feel like a relief, even if just a little." },
        { id: "seed1-m18", role: "user", text: "totally" },
        { id: "seed1-m19", role: "echo", text: "That's awesome to hear! What helped you get through it?" },
        { id: "seed1-m20", role: "user", text: "chatgpt" },
        { id: "seed1-m21", role: "echo", text: "ChatGPT really can be a lifesaver sometimes!" },
        { id: "seed1-m22", role: "echo", text: "What kind of things were you using it for?" },
        { id: "seed1-m23", role: "user", text: "to brainstorm the structure and layout of the poster" },
        { id: "seed1-m24", role: "echo", text: "That sounds super helpful for organizing your thoughts!" },
        { id: "seed1-m25", role: "echo", text: "Getting the structure right can really make a difference in how your message comes across." },
      ],
    },
    {
      id: "seed-session-thesis-ready",
      timestamp: day(1, 9, 15),
      card: {
        title: "Feeling ready for the thesis expo",
        summary:
          "I can sense a mix of relief and anticipation in your voice as you share about your thesis expo. It seems like you've put in a lot of work already, especially getting your poster ready, and now there's a bit of space for you to breathe before the big day.",
        emotion_tags: ["relieved", "anticipatory", "excited"],
        insight:
          "It feels like you're standing on the edge of this moment, where all your preparation is about to pay off, and there's a sense of pride in knowing you've come this far. The confidence in your readiness shines through, even amidst the usual pre-presentation nerves.",
        validation_sentence:
          "I admire how you've managed to get your poster printed ahead of time, showing your dedication and thoughtful planning for the expo.",
      },
      messages: [
        { id: "seed2-m1", role: "echo", text: "Hey there! How's the thesis work coming along? Have you made any progress on that prototype?" },
        { id: "seed2-m2", role: "echo", text: "And how did your sister's expo turn out?" },
        { id: "seed2-m3", role: "user", text: "Hi" },
        { id: "seed2-m4", role: "echo", text: "Hey there! How's it going?" },
        { id: "seed2-m5", role: "echo", text: "What's been on your mind lately?" },
        { id: "seed2-m6", role: "user", text: "is thesis expo" },
        { id: "seed2-m7", role: "echo", text: "Oh, the thesis expo is coming up! That can be quite a stressful time." },
        { id: "seed2-m8", role: "echo", text: "Are you feeling prepared, or is there still a lot to do before then?" },
        { id: "seed2-m9", role: "user", text: "almost prepared, actually i don't need to prepare too much, i've already inted my poster" },
        { id: "seed2-m10", role: "echo", text: "That's great to hear! Having the poster ready is a big step." },
        { id: "seed2-m11", role: "echo", text: "So, how are you feeling about presenting it?" },
      ],
    },
  ];
}

export default function EchoApp() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [activeTab, setActiveTab] = useState<Tab>("island");
  const [chatOpen, setChatOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [suggestedPractice, setSuggestedPractice] = useState<SuggestedPractice | null>(null);
  // Sessions added during the current app run only. NOT seeded from localStorage —
  // we don't want logged-in users to inherit a previous guest's data.
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  // Guest sessions persisted across reloads via localStorage. Only surfaced when
  // the user is actually in guest mode.
  const [guestStoredSessions, setGuestStoredSessions] = useState<SessionRecord[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("echo_guest_sessions");
      if (!saved) return [];
      return JSON.parse(saved).map((s: SessionRecord & { timestamp: string }) => ({
        ...s,
        timestamp: new Date(s.timestamp),
      }));
    } catch { return []; }
  });
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [guestMode, setGuestMode] = useState(false);

  // Seeded sample sessions, computed once per mount so dates don't drift on rerender.
  const seedSessions = useMemo(() => makeGuestSeedSessions(), []);
  // What the Profile actually displays.
  // - Guest: live sessions from this run + persisted guest sessions (deduped); falls back to seeds if empty.
  // - Authenticated: only sessions from this run — never the guest localStorage cache.
  const displaySessions = useMemo(() => {
    if (!guestMode) return sessions;
    const liveIds = new Set(sessions.map((s) => s.id));
    const stored = guestStoredSessions.filter((s) => !liveIds.has(s.id));
    const combined = [...sessions, ...stored];
    return combined.length === 0 ? seedSessions : combined;
  }, [guestMode, sessions, guestStoredSessions, seedSessions]);

  // Check for existing Supabase session on mount (handles OAuth redirect return)
  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        const u = data.session.user;
        setUserId(u.id);
        setUserName(u.user_metadata?.full_name || u.email?.split("@")[0] || "");
        setUserEmail(u.email || "");
        setGuestMode(false);
        setScreen("main");
      }
    });
    const { data: listener } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user;
        setUserId(u.id);
        setUserName(u.user_metadata?.full_name || u.email?.split("@")[0] || "");
        setUserEmail(u.email || "");
        // Hard reset: leaving guest mode means none of the in-run guest sessions belong here.
        setGuestMode(false);
        setSessions([]);
        setScreen("main");
      } else {
        setUserId("");
        setUserName("");
        setUserEmail("");
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (screen === "splash") return <DemoSplashScreen onContinue={() => setScreen("enter")} />;
  if (screen === "enter") return <EnterScreen onEnter={() => setScreen("login")} />;
  if (screen === "login") return <LoginScreen onLogin={(isGuest) => { setActiveTab("island"); if (isGuest) setGuestMode(true); setScreen("main"); }} />;

  return (
    <div
      className="flex flex-col h-dvh max-w-md mx-auto overflow-hidden"
      style={{ background: "var(--surface)" }}
    >
      <div className="flex-1 overflow-hidden relative">
        {!chatOpen && !settingsOpen && (
          <>
            {activeTab === "island" && (
              <div key="island" className="absolute inset-0 animate-tab-in">
                <IslandScreen
                  onStartChat={() => setChatOpen(true)}
                  suggestedPractice={suggestedPractice}
                  onDismissSuggestion={() => setSuggestedPractice(null)}
                  userId={guestMode ? undefined : (userId || undefined)}
                  userName={guestMode ? undefined : (userName || undefined)}
                />
              </div>
            )}
            {activeTab === "drift" && (
              <div key="drift" className="absolute inset-0 animate-tab-in">
                <DriftSeaScreen isGuest={guestMode || !userId} userId={guestMode ? undefined : userId} />
              </div>
            )}
            {activeTab === "profile" && (
              <div key="profile" className="absolute inset-0 animate-tab-in">
                <ProfileScreen onOpenSettings={() => setSettingsOpen(true)} sessions={displaySessions} userName={guestMode ? undefined : userName} isGuest={guestMode || !userId} userId={guestMode ? undefined : (userId || undefined)} />
              </div>
            )}
          </>
        )}
        {chatOpen && (
          <ChatScreen
            onBack={() => setChatOpen(false)}
            onSuggestPractice={(p) => setSuggestedPractice(p)}
            onSaveSession={(s) => {
              setSessions((prev) => [s, ...prev]);
              // Persist for guests. Gate on guestMode rather than !userId, since a
              // previously-logged-in user can still hit "Continue as Guest" and end
              // up with a stale Supabase userId — using !userId alone silently
              // skipped the localStorage save in that case.
              if (guestMode || !userId) {
                setGuestStoredSessions((prev) => {
                  const next = [s, ...prev];
                  try { localStorage.setItem("echo_guest_sessions", JSON.stringify(next)); } catch {}
                  return next;
                });
              }
            }}
            userId={guestMode ? "" : userId}
          />
        )}
        {settingsOpen && (
          <SettingsScreen
            onBack={() => setSettingsOpen(false)}
            onLogout={() => { setSettingsOpen(false); setScreen("enter"); }}
            userName={guestMode ? undefined : userName}
            userEmail={guestMode ? undefined : userEmail}
          />
        )}
      </div>

      {!chatOpen && !settingsOpen && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </div>
  );
}

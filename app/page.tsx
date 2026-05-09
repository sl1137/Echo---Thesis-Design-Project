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
function makeGuestSeedSessions(): SessionRecord[] {
  const day = (n: number, hour = 20, minute = 14) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(hour, minute, 0, 0);
    return d;
  };
  return [
    {
      id: "seed-session-1",
      timestamp: day(0, 21, 32),
      card: {
        title: "Quiet evening",
        summary: "Took a slower pace today after a long week. Sat with the quiet for a bit.",
        emotion_tags: ["calm", "grateful"],
        insight: "Letting the day end without forcing more out of yourself is its own kind of care.",
        validation_sentence: "It's okay for the day to just end. You don't have to make every moment productive.",
      },
      messages: [
        { id: "s1m1", role: "user", text: "Today's been quieter than usual. I think I needed it." },
        { id: "s1m2", role: "echo", text: "That sounds like a small relief. What did the quiet give you?" },
        { id: "s1m3", role: "user", text: "Just space. I didn't realize how loud the week had gotten." },
        { id: "s1m4", role: "echo", text: "Sometimes you only notice the noise once it stops." },
        { id: "s1m5", role: "user", text: "Yeah. I want to keep this for tomorrow if I can." },
      ],
    },
    {
      id: "seed-session-2",
      timestamp: day(1, 14, 8),
      card: {
        title: "Deadline pile-up",
        summary: "Talked through the deadline pile-up and the fog of trying to switch tasks.",
        emotion_tags: ["overwhelmed", "anxious"],
        insight: "When everything feels equally urgent, picking one thing to do next is its own form of clarity.",
        validation_sentence: "It makes sense you're spinning. You're not behind — you're carrying a lot at once.",
      },
      messages: [
        { id: "s2m1", role: "user", text: "I have like four things due this week and I can't focus on any of them." },
        { id: "s2m2", role: "echo", text: "That sounds exhausting. When you say you can't focus, what's the hardest part — picking, or staying with whatever you pick?" },
        { id: "s2m3", role: "user", text: "Both. Mostly picking. Everything feels equally urgent." },
        { id: "s2m4", role: "echo", text: "When everything is loud, even small movement is hard. Want to try just naming the next 30 minutes?" },
        { id: "s2m5", role: "user", text: "Maybe just the lit review. That's the one I keep avoiding." },
      ],
    },
    {
      id: "seed-session-3",
      timestamp: day(2, 23, 45),
      card: {
        title: "Running on fumes",
        summary: "Recognized that the tiredness isn't laziness, it's a real limit.",
        emotion_tags: ["tired", "low energy"],
        insight: "Your body has been telling you something for a while. Listening doesn't mean giving up — it means recovering.",
        validation_sentence: "You're not falling short. You're running on fumes and still showing up.",
      },
      messages: [
        { id: "s3m1", role: "user", text: "I keep thinking I should be doing more but I'm just tired all the time." },
        { id: "s3m2", role: "echo", text: "That gap between what you think you should do and what you have for it — it's hard to sit with. How long has it been like this?" },
        { id: "s3m3", role: "user", text: "A while. Maybe since spring break ended." },
        { id: "s3m4", role: "echo", text: "That's not nothing. It might be less about pushing harder and more about what you've been carrying since then." },
      ],
    },
    {
      id: "seed-session-4",
      timestamp: day(4, 19, 22),
      card: {
        title: "Between two places",
        summary: "Talked about feeling between two cultures and not fully fitting either.",
        emotion_tags: ["lost", "lonely"],
        insight: "The in-between is real, even if it's hard to name. Carrying two worlds isn't a failure to fit.",
        validation_sentence: "Belonging to two places and not fully feeling at home in either is a quiet kind of loneliness. It's real.",
      },
      messages: [
        { id: "s4m1", role: "user", text: "I called home today and it felt weird. Like I'm not the same person who left." },
        { id: "s4m2", role: "echo", text: "What kind of weird? Disconnected, or just out of sync?" },
        { id: "s4m3", role: "user", text: "Out of sync. They talk about people I don't really know anymore. And here I'm still figuring out where I fit." },
        { id: "s4m4", role: "echo", text: "That sounds like being between, not out. It doesn't mean you're lost — it means you're carrying both at once." },
        { id: "s4m5", role: "user", text: "I never thought of it like that." },
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
  const [sessions, setSessions] = useState<SessionRecord[]>(() => {
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
  // What the Profile actually displays: real saved sessions, or seeds for an empty guest.
  const displaySessions =
    guestMode && sessions.length === 0 ? seedSessions : sessions;

  // Check for existing Supabase session on mount (handles OAuth redirect return)
  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        const u = data.session.user;
        setUserId(u.id);
        setUserName(u.user_metadata?.full_name || u.email?.split("@")[0] || "");
        setUserEmail(u.email || "");
        setScreen("main");
      }
    });
    const { data: listener } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user;
        setUserId(u.id);
        setUserName(u.user_metadata?.full_name || u.email?.split("@")[0] || "");
        setUserEmail(u.email || "");
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
              setSessions((prev) => {
                const next = [s, ...prev];
                // Persist for guests. Gate on guestMode rather than !userId, since a
                // previously-logged-in user can still hit "Continue as Guest" and end
                // up with a stale Supabase userId — using !userId alone silently
                // skipped the localStorage save in that case.
                if (guestMode || !userId) {
                  try { localStorage.setItem("echo_guest_sessions", JSON.stringify(next)); } catch {}
                }
                return next;
              });
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

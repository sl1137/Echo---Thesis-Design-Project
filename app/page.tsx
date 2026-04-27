"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import EnterScreen from "./components/EnterScreen";
import LoginScreen from "./components/LoginScreen";
import IslandScreen from "./components/IslandScreen";
import DriftSeaScreen from "./components/DriftSeaScreen";
import ProfileScreen from "./components/ProfileScreen";
import ChatScreen from "./components/ChatScreen";
import BottomNav, { type Tab } from "./components/BottomNav";

import SettingsScreen from "./components/SettingsScreen";

type Screen = "enter" | "login" | "main";
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

export default function EchoApp() {
  const [screen, setScreen] = useState<Screen>("enter");
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
                <ProfileScreen onOpenSettings={() => setSettingsOpen(true)} sessions={sessions} userName={guestMode ? undefined : userName} isGuest={guestMode || !userId} userId={guestMode ? undefined : (userId || undefined)} />
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
                // Persist for guest users (auth users rely on Supabase)
                if (!userId) {
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

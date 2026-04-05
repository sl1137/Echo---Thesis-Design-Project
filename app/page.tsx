"use client";

import { useState } from "react";
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
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  if (screen === "enter") return <EnterScreen onEnter={() => setScreen("login")} />;
  if (screen === "login") return <LoginScreen onLogin={() => setScreen("main")} />;

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
                />
              </div>
            )}
            {activeTab === "drift" && (
              <div key="drift" className="absolute inset-0 animate-tab-in">
                <DriftSeaScreen />
              </div>
            )}
            {activeTab === "profile" && (
              <div key="profile" className="absolute inset-0 animate-tab-in">
                <ProfileScreen onOpenSettings={() => setSettingsOpen(true)} sessions={sessions} />
              </div>
            )}
          </>
        )}
        {chatOpen && (
          <ChatScreen
            onBack={() => setChatOpen(false)}
            onSuggestPractice={(p) => setSuggestedPractice(p)}
            onSaveSession={(s) => setSessions((prev) => [s, ...prev])}
          />
        )}
        {settingsOpen && (
          <SettingsScreen
            onBack={() => setSettingsOpen(false)}
            onLogout={() => { setSettingsOpen(false); setScreen("enter"); }}
          />
        )}
      </div>

      {!chatOpen && !settingsOpen && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </div>
  );
}

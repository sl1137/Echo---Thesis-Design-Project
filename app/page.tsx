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

export default function EchoApp() {
  const [screen, setScreen] = useState<Screen>("enter");
  const [activeTab, setActiveTab] = useState<Tab>("island");
  const [chatOpen, setChatOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
              <IslandScreen onStartChat={() => setChatOpen(true)} />
            )}
            {activeTab === "drift" && <DriftSeaScreen />}
            {activeTab === "profile" && <ProfileScreen onOpenSettings={() => setSettingsOpen(true)} />}
          </>
        )}
        {chatOpen && <ChatScreen onBack={() => setChatOpen(false)} />}
        {settingsOpen && <SettingsScreen onBack={() => setSettingsOpen(false)} />}
      </div>

      {!chatOpen && !settingsOpen && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </div>
  );
}

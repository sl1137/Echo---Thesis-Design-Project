"use client";

import { useState } from "react";
import EnterScreen from "./components/EnterScreen";
import LoginScreen from "./components/LoginScreen";
import HomeScreen from "./components/HomeScreen";
import ChatScreen from "./components/ChatScreen";

type Screen = "enter" | "login" | "home" | "chat";

export default function EchoApp() {
  const [screen, setScreen] = useState<Screen>("enter");

  switch (screen) {
    case "enter":
      return <EnterScreen onEnter={() => setScreen("login")} />;
    case "login":
      return <LoginScreen onLogin={() => setScreen("home")} />;
    case "home":
      return (
        <HomeScreen
          onStartChat={() => setScreen("chat")}
          onNavigate={() => {}}
        />
      );
    case "chat":
      return <ChatScreen onBack={() => setScreen("home")} />;
  }
}

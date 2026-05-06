import { NextResponse } from "next/server";
import { REALTIME_VOICE_SYSTEM } from "@/prompts";
import { getMemoryContext } from "@/lib/memory";

// Prepended before all other instructions — model reads this first
const LANG_OVERRIDE = `CRITICAL LANGUAGE RULE (overrides everything below):
You MUST speak English by default. Your very first words MUST be in English.
Only switch to Chinese if the user's first spoken words are in Chinese.
Never start a conversation in Chinese. Never mix languages in one response.`;

export async function POST(request: Request) {
  const { userId } = await request.json().catch(() => ({}));
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  const model = process.env.OPENAI_REALTIME_MODEL || "gpt-4o-realtime-preview-2024-12-17";

  try {
    const memoryContext = userId ? await getMemoryContext(userId) : "";

    const memorySection = memoryContext
      ? `\n\n## User Memory & Context\nThe following is what you know about this user from previous conversations. Use it naturally — reference it the way a friend who remembers would, without announcing that you have notes.\n${memoryContext}`
      : "";

    const instructions = `${LANG_OVERRIDE}\n\n${REALTIME_VOICE_SYSTEM}${memorySection}`;

    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        voice: "shimmer",
        instructions,
        input_audio_transcription: { model: "whisper-1" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI session error:", response.status, errorText);
      return NextResponse.json({ error: "Failed to create realtime session" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Realtime session error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

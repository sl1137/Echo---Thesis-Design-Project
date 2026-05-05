import { NextResponse } from "next/server";
import { REALTIME_VOICE_SYSTEM } from "@/prompts";
import { getMemoryContext } from "@/lib/memory";

export async function POST(request: Request) {
  const { userId } = await request.json().catch(() => ({}));
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  const model = process.env.OPENAI_REALTIME_MODEL || "gpt-4o-realtime-preview-2024-12-17";

  try {
    const memoryContext = userId ? await getMemoryContext(userId) : "";
    const instructions = memoryContext
      ? `${REALTIME_VOICE_SYSTEM}\n\n${memoryContext}`
      : REALTIME_VOICE_SYSTEM;

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

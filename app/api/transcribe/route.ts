import { NextResponse } from "next/server";

/**
 * POST /api/transcribe
 * Accepts a multipart/form-data with an "audio" file field.
 * Sends it to OpenAI Whisper and returns { text }.
 */
export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  try {
    const incoming = await request.formData();
    const audio = incoming.get("audio") as File | null;
    if (!audio) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const form = new FormData();
    form.append("file", audio, audio.name || "recording.webm");
    form.append("model", "whisper-1");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Whisper error:", res.status, err);
      return NextResponse.json({ error: "Transcription failed" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ text: data.text || "" });
  } catch (err) {
    console.error("Transcribe error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

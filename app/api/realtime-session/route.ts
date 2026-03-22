import { NextResponse } from "next/server";
import { REALTIME_VOICE_SYSTEM } from "@/prompts";

/**
 * POST /api/realtime-session
 *
 * Creates an ephemeral session token for OpenAI Realtime API.
 * The frontend uses this token to establish a WebRTC connection
 * directly with OpenAI — the real API key never leaves the server.
 */
export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const model =
    process.env.OPENAI_REALTIME_MODEL || "gpt-4o-realtime-preview-2024-12-17";

  try {
    // Request an ephemeral client secret from OpenAI
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          voice: "shimmer",
          instructions: REALTIME_VOICE_SYSTEM,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI session error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to create realtime session" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Realtime session error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

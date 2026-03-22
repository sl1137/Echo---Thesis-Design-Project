import { NextResponse } from "next/server";
import { TEXT_MODE_SYSTEM } from "@/prompts";

/**
 * POST /api/chat
 *
 * Handles text mode chat messages using OpenAI Chat Completions API.
 * Returns 1-3 short message bubbles per assistant turn for natural chat rhythm.
 */
export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { message, conversation = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Build messages array with system instruction
    const messages = [
      {
        role: "system" as const,
        content: TEXT_MODE_SYSTEM,
      },
      // Include conversation history (last 10 messages for context)
      ...conversation.slice(-10).map((msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? "user" : "assistant" as const,
        content: msg.content,
      })),
      // Current user message
      {
        role: "user" as const,
        content: message,
      },
    ];

    // Call OpenAI Chat Completions API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 200,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI chat error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to get response" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    // Parse bubbles from JSON response
    let bubbles: string[] = [];
    try {
      const parsed = JSON.parse(content);
      bubbles = Array.isArray(parsed.bubbles) ? parsed.bubbles : [parsed.bubbles || content];
    } catch {
      // Fallback: treat entire response as single bubble
      bubbles = [content || "…"];
    }

    // Filter empty bubbles and limit to 3
    bubbles = bubbles.filter((b: string) => b && b.trim()).slice(0, 3);

    // Ensure at least one bubble
    if (bubbles.length === 0) {
      bubbles = ["…"];
    }

    return NextResponse.json({ bubbles });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

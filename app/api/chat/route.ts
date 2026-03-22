import { NextResponse } from "next/server";
import { TEXT_MODE_API } from "@/prompts";

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
    let { message, conversation = [] } = body;

    console.log("[API] Received request:", { message, conversationLength: conversation.length });

    // Check if this is an opening message request
    const isOpening = message === "[OPENING]";

    // For opening message, use empty message to trigger greeting
    if (isOpening) {
      message = "";
      conversation = [];
    }

    if (!message && !isOpening) {
      console.log("[API] Rejecting: message is empty and not opening");
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Build messages array with system instruction
    // Use lite version of prompt to avoid token issues
    const systemPrompt = TEXT_MODE_API + "\n\n请用 JSON 格式返回你的回复，包含一个 'bubbles' 数组。";

    // Reduce conversation history to 6 messages to avoid token issues
    const historySlice = isOpening ? 0 : 6;

    const messages = [
      {
        role: "system" as const,
        content: systemPrompt,
      },
      // Include conversation history (last 6 messages for context)
      ...conversation.slice(-historySlice).map((msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? "user" : "assistant" as const,
        content: msg.content,
      })),
      // Current user message (empty for opening)
      // Add JSON format reminder to each user message
      {
        role: "user" as const,
        content: (message || "hi") + "\n\n请用 JSON 格式回复，包含 'bubbles' 数组。",
      },
    ];

    // Call OpenAI Chat Completions API
    const requestBody = {
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" },
    };

    console.log("[API] Calling OpenAI with messages count:", messages.length);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
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

    console.log("[API] OpenAI response content:", content);
    console.log("[API] Content length:", content?.length, "isWhitespace:", content && !content.trim());

    // Parse bubbles from JSON response
    let bubbles: string[] = [];
    try {
      // Check if content is only whitespace
      if (!content || !content.trim()) {
        console.log("[API] Response is whitespace only, using fallback");
        bubbles = ["嗯，我接到了。"];
      } else {
        const parsed = JSON.parse(content);
        console.log("[API] Parsed JSON:", parsed);
        bubbles = Array.isArray(parsed.bubbles) ? parsed.bubbles : [parsed.bubbles || content];
      }
    } catch (parseErr) {
      console.error("[API] JSON parse error:", parseErr);
      // Fallback: treat entire response as single bubble
      bubbles = [content?.trim() || "嗯，我接到了。"];
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

import { NextResponse } from "next/server";

/**
 * POST /api/validation-card
 * Generates a Validation Card from a completed conversation.
 * Returns: summary, emotion_tags, insight, validation_sentence
 */

const SYSTEM_PROMPT = `You are Echo, a warm and perceptive AI companion. After a conversation, you write a personal reflection card directly addressed to the person — using "you" (你), never "the user" or "they".

The tone should feel like a close, emotionally intelligent friend who has been truly listening — not a therapist, not a report. Think of it as a mirror held up with care: specific, human, and honest.

Return this exact JSON structure:
{
  "title": "Short English phrase (4-7 words) capturing the specific topic — always in English, e.g. 'Feeling overwhelmed before a deadline'",
  "summary": "2-3 sentences written directly to the person (use 'you'). Describe what you noticed in their emotional journey through this conversation — not just what they said, but what seemed to be underneath it. Warm, specific, personal.",
  "emotion_tags": ["anxious", "overwhelmed"],
  "insight": "1-2 sentences of a perceptive observation addressed to the person. Notice a pattern, a tension, or something they might not have named but was present. Do not give advice — just reflect what you see with warmth and precision.",
  "validation_sentence": "One sentence that makes the person feel truly seen — deeply personal, referencing something specific from the conversation. Not generic comfort."
}

Rules:
- ALWAYS use 'you' — never 'the user', 'they', or third person
- title: ALWAYS in English, max 7 words
- emotion_tags: 2-4 short labels in English only (e.g. anxious, lonely, overwhelmed)
- summary: written like a thoughtful friend reflecting back what they heard — not a transcript summary
- insight: observational only, no advice or prescriptions
- Match the language of the conversation (Chinese conversation → Chinese summary/insight/validation; English → English)
- validation_sentence: specific and earned, not a generic affirmation`;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  try {
    const { conversation } = await request.json();

    if (!conversation || conversation.length < 2) {
      return NextResponse.json({
        summary: "You took a brief moment to check in with yourself.",
        emotion_tags: ["present"],
        insight: "Even a short pause says something about where you are right now.",
        validation_sentence: "You showed up — and that's not nothing.",
      });
    }

    const transcript = conversation
      .map((m: { role: string; content: string }) =>
        `${m.role === "user" ? "User" : "Echo"}: ${m.content}`
      )
      .join("\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Here is the conversation:\n\n${transcript}` },
        ],
        temperature: 0.7,
        max_tokens: 600,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    const parsed = JSON.parse(data.choices[0]?.message?.content || "{}");

    return NextResponse.json({
      title: parsed.title || "",
      summary: parsed.summary || "",
      emotion_tags: parsed.emotion_tags || [],
      insight: parsed.insight || "",
      validation_sentence: parsed.validation_sentence || "",
    });
  } catch (err) {
    console.error("Validation card error:", err);
    return NextResponse.json({ error: "Failed to generate card" }, { status: 500 });
  }
}

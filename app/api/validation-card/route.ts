import { NextResponse } from "next/server";

/**
 * POST /api/validation-card
 * Generates a Validation Card from a completed conversation.
 * Returns: summary, emotion_tags, insight, validation_sentence
 */

const SYSTEM_PROMPT = `You are a compassionate AI assistant. Analyze the conversation provided and generate a Validation Card with the following 4 components. Respond ONLY in JSON.

The Validation Card should:
- Be warm, non-clinical, and genuine
- Reflect the actual content of the conversation
- Feel like something a caring friend might notice and say
- Always respond in English regardless of the conversation language

Return this exact JSON structure:
{
  "title": "Short English phrase (4-7 words) summarizing the main topic of the conversation — always in English regardless of conversation language, e.g. 'Feeling overwhelmed before a deadline' or 'Missing home and feeling lonely'",
  "summary": "2-3 sentence summary of what was discussed and the emotional arc of the conversation",
  "emotion_tags": ["anxious", "overwhelmed"],
  "insight": "1-2 sentences of a gentle, non-clinical observation about the emotions or patterns in this conversation",
  "validation_sentence": "One warm sentence that validates the person's experience — something that makes them feel truly seen and understood"
}

Rules:
- title: ALWAYS in English, max 7 words, captures the specific topic discussed (not just emotions)
- emotion_tags: 2-4 short labels in English ONLY (e.g. anxious, lonely, overwhelmed, pressured) — never use Chinese
- insight: observational, not prescriptive — describe what you noticed, don't give advice
- validation_sentence: deeply personal, not generic — reference something specific from the conversation`;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  try {
    const { conversation } = await request.json();

    if (!conversation || conversation.length < 2) {
      return NextResponse.json({
        summary: "This was a brief moment together.",
        emotion_tags: ["present"],
        insight: "Even a short check-in matters.",
        validation_sentence: "You showed up, and that takes something.",
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

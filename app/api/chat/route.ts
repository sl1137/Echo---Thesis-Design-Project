import { NextResponse } from "next/server";
import { TEXT_MODE_API } from "@/prompts";
import { getMemoryContext } from "@/lib/memory";

/**
 * POST /api/chat
 *
 * Handles text mode chat messages using OpenAI Chat Completions API.
 * Returns 1-3 short message bubbles per assistant turn for natural chat rhythm.
 */

// ─── Crisis detection ────────────────────────────────────────────────
const CRISIS_KEYWORDS = [
  // English
  "suicide", "kill myself", "end my life", "self-harm", "self harm",
  "hurt myself", "cut myself", "don't want to live", "want to die",
  "take my life", "no reason to live", "better off dead",
  // Chinese
  "自杀", "自残", "伤害自己", "割腕", "不想活", "想死", "结束生命", "了结自己",
  "活不下去", "不想活了",
];

function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

/**
 * Detect the language of a text (simple heuristic)
 * Returns 'en' for English, 'zh' for Chinese
 */
function detectLanguage(text: string): 'en' | 'zh' {
  // Check for Chinese characters
  const chinesePattern = /[\u4e00-\u9fa5]/;
  const chineseMatch = text.match(chinesePattern);

  // Check for English words (at least 3 consecutive Latin letters)
  const englishPattern = /[a-zA-Z]{3,}/;
  const englishMatch = text.match(englishPattern);

  const chineseCount = chineseMatch ? chineseMatch.length : 0;
  const englishCount = englishMatch ? englishMatch.length : 0;

  // If more Chinese characters, it's Chinese; otherwise English
  return chineseCount > englishCount ? 'zh' : 'en';
}

/**
 * Get language instruction for the prompt
 */
function getLanguageInstruction(userMessage: string, conversation: Array<{ role: string; content: string }>): string {
  // First, check the current user message
  const currentLang = detectLanguage(userMessage);

  // Also check recent conversation history for language consistency
  // Look for the last 2 user messages to determine language pattern
  const recentHistory = conversation.slice(-6);
  let userLangCount = { en: 0, zh: 0 };

  for (const msg of recentHistory) {
    if (msg.role === 'user') {
      const lang = detectLanguage(msg.content);
      userLangCount[lang]++;
    }
  }

  // If current message language matches majority of history, use it
  // Otherwise, prefer current message language (user might have switched)
  const historyMajority = userLangCount.zh > userLangCount.en ? 'zh' : 'en';

  // If user just switched language, follow the current message
  // If history strongly matches current, use current
  const targetLang = currentLang;

  if (targetLang === 'en') {
    return "\n\nIMPORTANT: Respond in English. Match the user's language - if they write in English, you respond in English.";
  } else {
    return "\n\n重要：请用中文回复。保持与用户相同的语言——如果用户用中文，你用中文回复。";
  }
}
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
    let { message, conversation = [], userId } = body;

    console.log("[API] Received request:", { message, conversationLength: conversation.length });

    // Check if this is an opening message request
    const isOpening = message === "[OPENING]";
    const isSafeConfirmation = message === "[USER_CONFIRMED_SAFE]";
    const isDriftRewrite = (message || "").startsWith("[DRIFT_REWRITE]");

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
    // Add language instruction based on user's language
    const languageInstruction = isOpening ? "" : getLanguageInstruction(message || "", conversation);

    // Inject memory context if userId provided
    const memoryContext = userId ? await getMemoryContext(userId) : "";
    const memorySection = memoryContext ? `\n\n${memoryContext}` : "";

    // Determine language for system prompt JSON reminder
    const systemLang = isOpening ? 'zh' : detectLanguage(message || "");
    const jsonSystemReminder = systemLang === 'en'
      ? "\n\nPlease respond in JSON format with a 'bubbles' array."
      : "\n\n请用 JSON 格式返回你的回复，包含一个 'bubbles' 数组。";

    const systemPrompt = TEXT_MODE_API + memorySection + languageInstruction + jsonSystemReminder;

    // Reduce conversation history to 6 messages to avoid token issues
    const historySlice = isOpening ? 0 : 6;

    // Determine language for JSON format reminder
    const userLang = isOpening ? 'zh' : detectLanguage(message || "");
    const jsonReminder = userLang === 'en'
      ? "\n\nPlease respond in JSON format with a 'bubbles' array."
      : "\n\n请用 JSON 格式回复，包含 'bubbles' 数组。";

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
      // For safe confirmation, replace with a contextual prompt
      {
        role: "user" as const,
        content: isSafeConfirmation
          ? "[System: The user just indicated they are safe right now after a moment of distress. Respond warmly and briefly — acknowledge their strength, gently remind them you're here whenever they want to talk, and that it's okay to feel however they feel. Keep it to 1 bubble, short and genuine. Don't be clinical.]" + jsonReminder
          : isDriftRewrite
          ? `[System: A user tried to send this as an anonymous drift bottle message to other students, but it contains crisis-level content. Suggest ONE alternative short message (1-2 sentences max) that expresses the same underlying emotion in a way that's safe to share with peers. Keep it genuine and raw — not clinical or sanitized. Just the rewritten message text, nothing else. Original: "${message.replace("[DRIFT_REWRITE] ", "")}"]` + jsonReminder
          : (message || "hi") + jsonReminder,
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
    // Determine fallback language based on the last user message
    const fallbackLang = detectLanguage(message || "");
    const fallbackResponse = fallbackLang === 'en'
      ? "Hmm, I got it."
      : "嗯，我接到了。";

    try {
      // Check if content is only whitespace
      if (!content || !content.trim()) {
        console.log("[API] Response is whitespace only, using fallback");
        bubbles = [fallbackResponse];
      } else {
        const parsed = JSON.parse(content);
        console.log("[API] Parsed JSON:", parsed);
        bubbles = Array.isArray(parsed.bubbles) ? parsed.bubbles : [parsed.bubbles || content];
      }
    } catch (parseErr) {
      console.error("[API] JSON parse error:", parseErr);
      // Fallback: treat entire response as single bubble
      bubbles = [content?.trim() || fallbackResponse];
    }

    // Filter empty bubbles and limit to 3
    bubbles = bubbles.filter((b: string) => b && b.trim()).slice(0, 3);

    // Ensure at least one bubble
    if (bubbles.length === 0) {
      bubbles = ["…"];
    }

    const crisis = (isSafeConfirmation || isDriftRewrite) ? false : detectCrisis(message || "");
    return NextResponse.json({ bubbles, crisis });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

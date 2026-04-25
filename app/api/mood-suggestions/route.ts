import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  // Check cache
  const { data: identity } = await supabase
    .from("user_identity")
    .select("ai_suggestions, suggestions_updated_at")
    .eq("user_id", userId)
    .single();

  const lastUpdated = identity?.suggestions_updated_at ? new Date(identity.suggestions_updated_at) : null;
  const cacheValid = lastUpdated && (Date.now() - lastUpdated.getTime()) < 24 * 60 * 60 * 1000;

  if (cacheValid && identity?.ai_suggestions?.length) {
    return NextResponse.json({ suggestions: identity.ai_suggestions });
  }

  // Fetch sessions — include topics and insight so we can detect recurring themes (not just emotions)
  const { data: sessions, count } = await supabase
    .from("sessions")
    .select("emotion_tags, topics, summary, insight", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(8);

  if ((count ?? 0) < 3) {
    return NextResponse.json({ insufficient: true, sessionCount: count ?? 0 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "No API key" }, { status: 500 });

  const sessionContext = (sessions ?? []).map((s, i) =>
    `Session ${i + 1}:
  Topics: ${(s.topics ?? []).join(", ") || "—"}
  Emotions: ${(s.emotion_tags ?? []).join(", ") || "—"}
  Summary: ${s.summary || "—"}
  Insight: ${s.insight || "—"}`
  ).join("\n\n");

  const SUGGESTIONS_PROMPT = `You are writing 3-4 short, warm suggestions to a person whose recent reflections you have been quietly noticing. The tone is that of a thoughtful friend, NEVER an advisor or coach. Reflective. Inviting. Low-pressure.

The person is likely an international graduate student. Beyond emotional patterns, they often carry quiet anxiety about "where am I going" — thesis direction, post-graduation, career path, big-but-fuzzy decisions. These "next steps" feelings are often what makes everything else heavier.

Your job: read the recent sessions and write suggestions that address BOTH layers when they appear:
1. Emotional patterns (recurring anxiety, low energy, isolation)
2. Direction / forward-motion concerns (recurring mentions of thesis, job search, future, decisions, feeling stuck about what's next, "I don't know what to do")

How to write each suggestion:
- 1-2 short sentences
- Reference a SPECIFIC theme from their sessions, not generic
- Frame as a gentle invitation or open question — never a command
- Good shapes: "Want to try…?", "What if you wrote down…?", "Notice the moments when…", "There might be one tiny version of X you could…"
- Bad shapes: "You should…", "You must…", "Try to…", "It is important to…"

Output mix (when data supports it):
- At least 1 emotional-regulation suggestion (breathing / grounding / rest)
- At least 1 direction-leaning suggestion when topics recur — help them carve a smaller, less scary version of the bigger question (e.g. "Your thesis has been on your mind 3 weeks running — what's one 20-min block you could spend with it tomorrow, just to sit beside it?")
- The direction suggestions should help them FEEL LESS LOST, not give them answers about their career

Hard rules:
- NEVER tell them what to decide about career, school, or relationships
- NEVER use clinical/therapy language ("symptoms", "regulate your nervous system", "cognitive distortions")
- NEVER promise outcomes ("this will help you find clarity")
- Keep the door open — questions over instructions
- Match the language of their sessions: if summaries/insights are in Chinese, write suggestions in Chinese; otherwise English
- Each suggestion must stand alone (no "see suggestion 2")

Return JSON: { "suggestions": ["...", "...", "...", "..."] }`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SUGGESTIONS_PROMPT },
        { role: "user", content: `Recent sessions (most recent first):\n\n${sessionContext}` },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) return NextResponse.json({ error: "Generation failed" }, { status: 500 });

  const data = await res.json();
  let suggestions: string[] = [];
  try {
    suggestions = JSON.parse(data.choices[0].message.content).suggestions ?? [];
  } catch {
    return NextResponse.json({ error: "Parse failed" }, { status: 500 });
  }

  // Cache in user_identity
  await supabase.from("user_identity").update({
    ai_suggestions: suggestions,
    suggestions_updated_at: new Date().toISOString(),
  }).eq("user_id", userId);

  return NextResponse.json({ suggestions });
}

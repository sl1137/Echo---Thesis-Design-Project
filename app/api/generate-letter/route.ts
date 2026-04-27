import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// GET — check if a letter exists for this week
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const weekStart = getWeekStart();
  const { data } = await supabase
    .from("weekly_letters")
    .select("letter_json, read")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .single();

  if (data) return NextResponse.json({ letter: data.letter_json, read: data.read });

  // No letter yet — check session count and generate if ≥ 3
  const { count } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) < 3) return NextResponse.json({ insufficient: true, sessionCount: count ?? 0 });

  // Generate the letter
  const letter = await generateLetter(userId);
  if (!letter) return NextResponse.json({ error: "Generation failed" }, { status: 500 });

  await supabase.from("weekly_letters").upsert({
    user_id: userId,
    week_start: weekStart,
    letter_json: letter,
    read: false,
  }, { onConflict: "user_id,week_start" });

  return NextResponse.json({ letter, read: false });
}

// PATCH — mark letter as read
export async function PATCH(request: Request) {
  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const weekStart = getWeekStart();
  await supabase
    .from("weekly_letters")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("week_start", weekStart);

  return NextResponse.json({ ok: true });
}

async function generateLetter(userId: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  // Fetch recent sessions and narratives
  const [{ data: sessions }, { data: narratives }, { data: identity }] = await Promise.all([
    supabase.from("sessions").select("summary, emotion_tags, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
    supabase.from("user_narratives").select("theme, narrative_text").eq("user_id", userId).order("last_mentioned_at", { ascending: false }).limit(3),
    supabase.from("user_identity").select("name, personality_notes").eq("user_id", userId).single(),
  ]);

  const userName = identity?.name || "there";
  const sessionSummaries = (sessions ?? []).map((s, i) =>
    `Session ${i + 1}: emotions=[${s.emotion_tags?.join(", ")}] — ${s.summary}`
  ).join("\n");
  const narrativeContext = (narratives ?? []).map(n => `${n.theme}: ${n.narrative_text}`).join("\n");
  const personalityNotes = identity?.personality_notes || "";

  const prompt = `You are Echo, a warm and emotionally supportive AI companion. Write a personal weekly letter to ${userName}.

User context:
${personalityNotes ? `About them: ${personalityNotes}\n` : ""}${narrativeContext ? `What they've been navigating:\n${narrativeContext}\n` : ""}Recent sessions:\n${sessionSummaries}

Write a warm, personal letter in JSON format:
{
  "date": "will be set automatically",
  "title": "<2-line emotional title, use \\n for line break>",
  "sections": [
    { "body": "<opening paragraph — personal, warm, no heading>" },
    { "heading": "<section heading>", "body": "<paragraph>" },
    { "heading": "<section heading>", "body": "<paragraph>" },
    { "heading": "<section heading>", "body": "<paragraph>" }
  ]
}

Guidelines:
- Write in second person to ${userName}
- Be warm, specific, non-clinical
- Reference real things from their sessions
- 3-4 sections total
- Each section body 2-4 sentences
- Do NOT mention being an AI explicitly`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 800,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  try {
    const letter = JSON.parse(data.choices[0].message.content);
    const now = new Date();
    letter.date = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return letter;
  } catch {
    return null;
  }
}

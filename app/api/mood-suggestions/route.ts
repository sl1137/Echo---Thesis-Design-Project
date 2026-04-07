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

  // Fetch sessions
  const { data: sessions, count } = await supabase
    .from("sessions")
    .select("emotion_tags, summary", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(7);

  if ((count ?? 0) < 3) {
    return NextResponse.json({ insufficient: true, sessionCount: count ?? 0 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "No API key" }, { status: 500 });

  const sessionContext = (sessions ?? []).map((s, i) =>
    `Session ${i + 1}: emotions=[${s.emotion_tags?.join(", ")}] — ${s.summary}`
  ).join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: `Based on these recent emotional check-ins, write 3-4 short, warm, specific suggestions for this person. Each should be 1-2 sentences. Be practical, not clinical. Reference specific patterns you notice.

Recent sessions:
${sessionContext}

Return JSON: { "suggestions": ["...", "...", "...", "..."] }`,
      }],
      temperature: 0.7,
      max_tokens: 400,
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

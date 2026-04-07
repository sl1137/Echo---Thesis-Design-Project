import { supabase } from "./supabase";

export interface SessionData {
  emotion_tags: string[];
  topics: string[];
  summary: string;
  insight: string;
  validation_sentence: string;
}

// ─── Ensure user_identity row exists ──────────────────────────────────
export async function ensureIdentity(userId: string): Promise<void> {
  const { error } = await supabase
    .from("user_identity")
    .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
  if (error) console.error("[memory] ensureIdentity error:", error.message);
}

// ─── Save session summary ──────────────────────────────────────────────
export async function saveSession(userId: string, data: SessionData): Promise<void> {
  await ensureIdentity(userId);
  const { error } = await supabase.from("sessions").insert({
    user_id: userId,
    emotion_tags: data.emotion_tags,
    topics: data.topics,
    summary: data.summary,
    insight: data.insight,
    validation_sentence: data.validation_sentence,
  });
  if (error) console.error("[memory] saveSession error:", error.message);
}

// ─── Consolidate narratives for themes with 3+ sessions ───────────────
export async function consolidateNarratives(userId: string): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return;

  // Get all sessions for this user
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("topics, summary, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !sessions?.length) return;

  // Count topic frequency
  const topicCounts: Record<string, string[]> = {};
  for (const s of sessions) {
    for (const topic of s.topics ?? []) {
      if (!topicCounts[topic]) topicCounts[topic] = [];
      if (s.summary) topicCounts[topic].push(s.summary);
    }
  }

  // Only consolidate topics with 3+ mentions
  for (const [theme, summaries] of Object.entries(topicCounts)) {
    if (summaries.length < 3) continue;

    // Check if narrative already up to date (updated within last 3 sessions)
    const { data: existing } = await supabase
      .from("user_narratives")
      .select("mention_count, updated_at")
      .eq("user_id", userId)
      .eq("theme", theme)
      .single();

    if (existing && existing.mention_count >= summaries.length) continue;

    // Generate narrative via LLM
    const prompt = `Here are ${summaries.length} session summaries about "${theme}" for this user:\n\n${summaries.slice(0, 5).map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nWrite a 2-3 sentence narrative summarizing their ongoing experience with this theme. Be warm, specific, and avoid clinical language. Write in third person (e.g. "They have been...").`;

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 150,
          temperature: 0.6,
        }),
      });
      const data = await res.json();
      const narrative = data.choices?.[0]?.message?.content?.trim();
      if (!narrative) continue;

      await supabase.from("user_narratives").upsert({
        user_id: userId,
        theme,
        narrative_text: narrative,
        mention_count: summaries.length,
        last_mentioned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,theme" });
    } catch (e) {
      console.error("[memory] consolidate error for theme", theme, e);
    }
  }
}

// ─── Assemble memory context string for system prompt ─────────────────
export async function getMemoryContext(userId: string): Promise<string> {
  try {
    const [identityRes, narrativesRes, sessionsRes] = await Promise.all([
      supabase.from("user_identity").select("personality_notes, core_themes").eq("user_id", userId).single(),
      supabase.from("user_narratives").select("theme, narrative_text").eq("user_id", userId).order("last_mentioned_at", { ascending: false }).limit(3),
      supabase.from("sessions").select("summary, emotion_tags, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(2),
    ]);

    const identity = identityRes.data;
    const narratives = narrativesRes.data ?? [];
    const recentSessions = sessionsRes.data ?? [];

    if (!identity && !narratives.length && !recentSessions.length) return "";

    const parts: string[] = ["## What I remember about you:"];

    if (identity?.personality_notes) {
      parts.push(`**About you:** ${identity.personality_notes}`);
    }

    if (narratives.length > 0) {
      parts.push("**What you've been navigating:**");
      for (const n of narratives) {
        parts.push(`- ${n.theme}: ${n.narrative_text}`);
      }
    }

    if (recentSessions.length > 0) {
      parts.push("**Recently:**");
      for (const s of recentSessions) {
        if (s.summary) parts.push(`- ${s.summary}`);
      }
    }

    return parts.join("\n");
  } catch (e) {
    console.error("[memory] getMemoryContext error:", e);
    return "";
  }
}

import { NextResponse } from "next/server";
import { saveSession, consolidateNarratives } from "@/lib/memory";

/**
 * POST /api/session-save
 * Saves a completed session summary and triggers narrative consolidation if needed.
 * Called in parallel with /api/validation-card at the end of each chat session.
 */
export async function POST(request: Request) {
  try {
    const { userId, emotion_tags, topics, summary, insight, validation_sentence } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Save session and consolidate narratives in parallel
    await Promise.all([
      saveSession(userId, { emotion_tags: emotion_tags ?? [], topics: topics ?? [], summary: summary ?? "", insight: insight ?? "", validation_sentence: validation_sentence ?? "" }),
      consolidateNarratives(userId),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[session-save] error:", err);
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
  }
}

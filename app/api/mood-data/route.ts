import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const EMOTION_COLORS: Record<string, string> = {
  Happiness:  "#E8C455",
  Calmness:   "#6B8F5E",
  Anger:      "#D4897A",
  Excitement: "#7EB3D8",
  Sadness:    "#A8A0C8",
  Stress:     "#C97B6A",
};

const EMOTION_MAP: Record<string, string> = {
  happy: "Happiness", joy: "Happiness", grateful: "Happiness",
  content: "Happiness", relieved: "Happiness", hopeful: "Happiness",
  calm: "Calmness", peaceful: "Calmness", relaxed: "Calmness",
  settled: "Calmness", safe: "Calmness",
  angry: "Anger", frustrated: "Anger", irritated: "Anger", annoyed: "Anger",
  excited: "Excitement", energized: "Excitement", motivated: "Excitement", enthusiastic: "Excitement",
  sad: "Sadness", lonely: "Sadness", depressed: "Sadness", upset: "Sadness", down: "Sadness",
  stressed: "Stress", anxious: "Stress", worried: "Stress",
  overwhelmed: "Stress", nervous: "Stress", pressure: "Stress",
  anxiety: "Stress", stress: "Stress", loneliness: "Sadness",
  sadness: "Sadness", happiness: "Happiness", excitement: "Excitement",
  calmness: "Calmness", anger: "Anger",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const { data: sessions, count } = await supabase
    .from("sessions")
    .select("emotion_tags", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(7);

  const sessionCount = count ?? 0;

  if (sessionCount < 3) {
    return NextResponse.json({ insufficient: true, sessionCount });
  }

  // Count how many sessions contain each emotion category
  const categoryCounts: Record<string, number> = {
    Happiness: 0, Calmness: 0, Anger: 0, Excitement: 0, Sadness: 0, Stress: 0,
  };

  for (const session of sessions ?? []) {
    const seenCategories = new Set<string>();
    for (const tag of session.emotion_tags ?? []) {
      const category = EMOTION_MAP[tag.toLowerCase()];
      if (category && !seenCategories.has(category)) {
        categoryCounts[category]++;
        seenCategories.add(category);
      }
    }
  }

  const total = sessions?.length ?? 1;
  const emotions = Object.entries(categoryCounts).map(([label, cnt]) => ({
    label,
    color: EMOTION_COLORS[label],
    pct: Math.round((cnt / total) * 100),
  }));

  return NextResponse.json({ emotions, sessionCount });
}

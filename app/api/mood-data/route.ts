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
  // Happiness — warm, connected, glad, grateful
  happy: "Happiness", happiness: "Happiness", joy: "Happiness", joyful: "Happiness",
  grateful: "Happiness", gratitude: "Happiness", content: "Happiness", contentment: "Happiness",
  relieved: "Happiness", relief: "Happiness", hopeful: "Happiness", hope: "Happiness",
  glad: "Happiness", proud: "Happiness", pleased: "Happiness", warm: "Happiness",
  connected: "Happiness", loved: "Happiness", supported: "Happiness",
  appreciated: "Happiness", touched: "Happiness", fulfilled: "Happiness",
  optimistic: "Happiness", cheerful: "Happiness", playful: "Happiness",

  // Calmness — settled, grounded, present
  calm: "Calmness", calmness: "Calmness", peaceful: "Calmness", peace: "Calmness",
  relaxed: "Calmness", settled: "Calmness", safe: "Calmness", grounded: "Calmness",
  steady: "Calmness", okay: "Calmness", neutral: "Calmness", clear: "Calmness",
  balanced: "Calmness", rested: "Calmness", quiet: "Calmness", present: "Calmness",
  centered: "Calmness", soft: "Calmness", open: "Calmness", mindful: "Calmness",

  // Anger — frustrated, resentful, irritated
  angry: "Anger", anger: "Anger", frustrated: "Anger", frustration: "Anger",
  irritated: "Anger", irritation: "Anger", annoyed: "Anger", annoyance: "Anger",
  resentful: "Anger", resentment: "Anger", bitter: "Anger", mad: "Anger",
  upset: "Anger", indignant: "Anger", fed: "Anger", defensive: "Anger",
  jealous: "Anger", envious: "Anger", betrayed: "Anger", disrespected: "Anger",

  // Excitement — energized, motivated, eager
  excited: "Excitement", excitement: "Excitement", energized: "Excitement",
  motivated: "Excitement", enthusiastic: "Excitement", enthusiasm: "Excitement",
  inspired: "Excitement", curious: "Excitement", curiosity: "Excitement",
  eager: "Excitement", engaged: "Excitement", determined: "Excitement",
  hyped: "Excitement", thrilled: "Excitement", driven: "Excitement",
  passionate: "Excitement", ambitious: "Excitement", creative: "Excitement",

  // Sadness — low, empty, tired, disconnected
  sad: "Sadness", sadness: "Sadness", lonely: "Sadness", loneliness: "Sadness",
  isolated: "Sadness", isolation: "Sadness", depressed: "Sadness", depression: "Sadness",
  down: "Sadness", low: "Sadness", blue: "Sadness", grief: "Sadness", grieving: "Sadness",
  numb: "Sadness", empty: "Sadness", hollow: "Sadness", disconnected: "Sadness",
  flat: "Sadness", hopeless: "Sadness", helpless: "Sadness",
  tired: "Sadness", exhausted: "Sadness", drained: "Sadness", weary: "Sadness",
  defeated: "Sadness", heavy: "Sadness", broken: "Sadness", hurt: "Sadness",
  homesick: "Sadness", missing: "Sadness", regret: "Sadness", regretful: "Sadness",
  guilty: "Sadness", guilt: "Sadness", ashamed: "Sadness", shame: "Sadness",
  unmotivated: "Sadness", depleted: "Sadness", misunderstood: "Sadness",
  invalidated: "Sadness", sensitive: "Sadness", vulnerable: "Sadness",
  powerless: "Sadness", worthless: "Sadness", invisible: "Sadness", unheard: "Sadness",
  disheartened: "Sadness", despondent: "Sadness", melancholic: "Sadness",
  burdened: "Sadness", withdrawn: "Sadness", detached: "Sadness",

  // Stress — anxious, overwhelmed, lost, scattered
  stressed: "Stress", stress: "Stress", anxious: "Stress", anxiety: "Stress",
  worried: "Stress", worry: "Stress", overwhelmed: "Stress", overwhelm: "Stress",
  nervous: "Stress", nervousness: "Stress", pressure: "Stress", pressured: "Stress",
  tense: "Stress", tension: "Stress", scared: "Stress", afraid: "Stress",
  fearful: "Stress", fear: "Stress", panicked: "Stress", panicky: "Stress", panic: "Stress",
  restless: "Stress", confused: "Stress", confusion: "Stress", scattered: "Stress",
  lost: "Stress", stuck: "Stress", frozen: "Stress", paralyzed: "Stress",
  uncertain: "Stress", unsure: "Stress", shaken: "Stress", agitated: "Stress",
  rushed: "Stress", overloaded: "Stress", overstimulated: "Stress",
  insecure: "Stress", insecurity: "Stress", doubtful: "Stress", doubt: "Stress",
  conflicted: "Stress", torn: "Stress", foggy: "Stress", fog: "Stress",
  burnout: "Stress", trapped: "Stress", apprehensive: "Stress", avoidant: "Stress",
  hypervigilant: "Stress", triggered: "Stress", dysregulated: "Stress",
  "burned out": "Stress", "self-critical": "Sadness", "socially isolated": "Sadness",
  "under pressure": "Stress", "worn out": "Sadness", "out of place": "Sadness",
  "on edge": "Stress", "run down": "Sadness", "spread thin": "Stress",
};

function resolveCategory(tag: string): string | undefined {
  const lower = tag.toLowerCase().trim();
  if (EMOTION_MAP[lower]) return EMOTION_MAP[lower];
  for (const word of lower.split(/\s+/)) {
    if (EMOTION_MAP[word]) return EMOTION_MAP[word];
  }
  return undefined;
}

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
      const category = resolveCategory(tag);
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

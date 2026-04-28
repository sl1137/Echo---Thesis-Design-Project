import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const { data, error } = await supabase
    .from("drift_bottles")
    .select(`
      id, content, feeling_tags, topic_tags, created_at,
      drift_recipients ( reply_text, reply_read, resonated_at )
    `)
    .eq("sender_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[drift/mine]", error);
    return NextResponse.json({ error: "Failed to fetch bottles" }, { status: 500 });
  }

  const bottles = (data ?? []).map((b) => {
    const recipients = Array.isArray(b.drift_recipients) ? b.drift_recipients : (b.drift_recipients ? [b.drift_recipients] : []);
    const firstRecipient = recipients[0];
    const resonanceCount = recipients.filter((r: { resonated_at: string | null }) => !!r.resonated_at).length;
    return {
      id: b.id,
      content: b.content,
      feeling_tags: b.feeling_tags,
      topic_tags: b.topic_tags,
      created_at: b.created_at,
      replied: !!firstRecipient?.reply_text,
      reply_read: firstRecipient?.reply_read ?? true,
      resonance_count: resonanceCount,
    };
  });

  return NextResponse.json({ bottles });
}

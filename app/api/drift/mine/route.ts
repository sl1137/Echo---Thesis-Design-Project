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
      drift_recipients ( reply_text, reply_read )
    `)
    .eq("sender_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[drift/mine]", error);
    return NextResponse.json({ error: "Failed to fetch bottles" }, { status: 500 });
  }

  const bottles = (data ?? []).map((b) => {
    const recipient = Array.isArray(b.drift_recipients) ? b.drift_recipients[0] : b.drift_recipients;
    return {
      id: b.id,
      content: b.content,
      feeling_tags: b.feeling_tags,
      topic_tags: b.topic_tags,
      created_at: b.created_at,
      replied: !!recipient?.reply_text,
      reply_read: recipient?.reply_read ?? true,
    };
  });

  return NextResponse.json({ bottles });
}

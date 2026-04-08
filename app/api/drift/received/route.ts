import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const { data, error } = await supabase
    .from("drift_recipients")
    .select(`
      id, received_at, reply_text, bottle_read,
      drift_bottles ( content, feeling_tags, topic_tags )
    `)
    .eq("recipient_id", userId)
    .order("received_at", { ascending: false });

  if (error) {
    console.error("[drift/received]", error);
    return NextResponse.json({ error: "Failed to fetch received bottles" }, { status: 500 });
  }

  const bottles = (data ?? []).map((r) => {
    const b = Array.isArray(r.drift_bottles) ? r.drift_bottles[0] : r.drift_bottles;
    return {
      recipient_record_id: r.id,
      content: b?.content ?? "",
      feeling_tags: b?.feeling_tags ?? [],
      topic_tags: b?.topic_tags ?? [],
      received_at: r.received_at,
      replied: !!r.reply_text,
      bottle_read: r.bottle_read,
    };
  });

  return NextResponse.json({ bottles });
}

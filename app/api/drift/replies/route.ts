import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET — replies to my bottles
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const { data, error } = await supabase
    .from("drift_recipients")
    .select(`
      id, reply_text, replied_at, reply_read,
      drift_bottles ( content, sender_id )
    `)
    .not("reply_text", "is", null)
    .order("replied_at", { ascending: false });

  if (error) {
    console.error("[drift/replies GET]", error);
    return NextResponse.json({ error: "Failed to fetch replies" }, { status: 500 });
  }

  // Filter to only replies on MY bottles
  const replies = (data ?? [])
    .filter((r) => {
      const b = Array.isArray(r.drift_bottles) ? r.drift_bottles[0] : r.drift_bottles;
      return b?.sender_id === userId;
    })
    .map((r) => {
      const b = Array.isArray(r.drift_bottles) ? r.drift_bottles[0] : r.drift_bottles;
      return {
        id: r.id,
        bottle_excerpt: (b?.content ?? "").slice(0, 80),
        reply_text: r.reply_text,
        replied_at: r.replied_at,
        reply_read: r.reply_read,
      };
    });

  return NextResponse.json({ replies });
}

// PATCH — mark reply as read
export async function PATCH(request: Request) {
  try {
    const { recipientRecordId } = await request.json();
    if (!recipientRecordId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await supabase
      .from("drift_recipients")
      .update({ reply_read: true })
      .eq("id", recipientRecordId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[drift/replies PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

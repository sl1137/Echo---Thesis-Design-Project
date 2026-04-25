import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { userId, content, feelingTags, topicTags } = await request.json();
    if (!userId || !content?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ensure user exists in user_identity
    await supabase.from("user_identity").upsert({ user_id: userId }, { onConflict: "user_id" });

    // 1. Save the bottle
    const { data: bottle, error: bottleErr } = await supabase
      .from("drift_bottles")
      .insert({ sender_id: userId, content: content.trim(), feeling_tags: feelingTags ?? [], topic_tags: topicTags ?? [] })
      .select("id")
      .single();

    if (bottleErr || !bottle) {
      console.error("[drift/bottle] insert error:", bottleErr);
      return NextResponse.json({ error: "Failed to save bottle" }, { status: 500 });
    }

    // 2. Find a recipient via tag matching
    const allTags = [...(feelingTags ?? []), ...(topicTags ?? [])];
    let recipientId: string | null = null;

    if (allTags.length > 0) {
      // Find users who sent bottles with overlapping tags in last 30 days
      const { data: tagMatches } = await supabase
        .from("drift_bottles")
        .select("sender_id")
        .neq("sender_id", userId)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .or(
          allTags.map((t: string) => `feeling_tags.cs.{"${t}"}`).join(",") +
          "," +
          allTags.map((t: string) => `topic_tags.cs.{"${t}"}`).join(",")
        );

      if (tagMatches && tagMatches.length > 0) {
        const pool = [...new Set(tagMatches.map((r) => r.sender_id))];
        recipientId = pool[Math.floor(Math.random() * pool.length)];
      }
    }

    // Fallback: random user
    if (!recipientId) {
      const { data: allUsers } = await supabase
        .from("user_identity")
        .select("user_id")
        .neq("user_id", userId);

      if (allUsers && allUsers.length > 0) {
        const pick = allUsers[Math.floor(Math.random() * allUsers.length)];
        recipientId = pick.user_id;
      }
    }

    // 3. Create delivery record if we found a recipient
    if (recipientId) {
      await supabase
        .from("drift_recipients")
        .insert({ bottle_id: bottle.id, recipient_id: recipientId });
    }

    return NextResponse.json({ ok: true, bottleId: bottle.id });
  } catch (err) {
    console.error("[drift/bottle]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    if (!id || !userId) {
      return NextResponse.json({ error: "Missing id or userId" }, { status: 400 });
    }

    // Verify the bottle belongs to this user before deleting
    const { data: bottle, error: fetchErr } = await supabase
      .from("drift_bottles")
      .select("sender_id")
      .eq("id", id)
      .single();

    if (fetchErr || !bottle) {
      return NextResponse.json({ error: "Bottle not found" }, { status: 404 });
    }
    if (bottle.sender_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete delivery / reply records first, then the bottle itself
    await supabase.from("drift_recipients").delete().eq("bottle_id", id);
    const { error: deleteErr } = await supabase
      .from("drift_bottles")
      .delete()
      .eq("id", id)
      .eq("sender_id", userId);

    if (deleteErr) {
      console.error("[drift/bottle] delete error:", deleteErr);
      return NextResponse.json({ error: "Failed to delete bottle" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[drift/bottle] DELETE", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { recipientRecordId, replyText, userId } = await request.json();
    if (!recipientRecordId || !replyText?.trim() || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify ownership and no existing reply
    const { data: record, error: fetchErr } = await supabase
      .from("drift_recipients")
      .select("id, recipient_id, reply_text")
      .eq("id", recipientRecordId)
      .single();

    if (fetchErr || !record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    if (record.recipient_id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (record.reply_text) {
      return NextResponse.json({ error: "Already replied" }, { status: 409 });
    }

    const { error } = await supabase
      .from("drift_recipients")
      .update({ reply_text: replyText.trim(), replied_at: new Date().toISOString() })
      .eq("id", recipientRecordId);

    if (error) {
      console.error("[drift/reply]", error);
      return NextResponse.json({ error: "Failed to save reply" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[drift/reply]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

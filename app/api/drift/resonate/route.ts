import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/drift/resonate
// body: { userId, recipientRecordId }
// Toggles resonated_at on the drift_recipients record.
// Requires: ALTER TABLE drift_recipients ADD COLUMN resonated_at TIMESTAMPTZ;
export async function POST(request: Request) {
  const { userId, recipientRecordId } = await request.json();
  if (!userId || !recipientRecordId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Verify ownership
  const { data: record, error: fetchErr } = await supabase
    .from("drift_recipients")
    .select("id, recipient_id, resonated_at")
    .eq("id", recipientRecordId)
    .single();

  if (fetchErr || !record) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }
  if (record.recipient_id !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const newValue = record.resonated_at ? null : new Date().toISOString();
  const { error: updateErr } = await supabase
    .from("drift_recipients")
    .update({ resonated_at: newValue })
    .eq("id", recipientRecordId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ resonated: !!newValue });
}

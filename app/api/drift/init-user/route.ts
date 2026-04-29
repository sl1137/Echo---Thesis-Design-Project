import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/drift/init-user
// Called when a new user opens Drift Sea with no received bottles.
// Finds orphaned bottles (sent by others, no delivery record yet) and assigns up to 2 to this user.
export async function POST(request: Request) {
  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  // Skip if user already has received bottles
  const { count: existing } = await supabase
    .from("drift_recipients")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId);

  if ((existing ?? 0) > 0) {
    return NextResponse.json({ assigned: 0, skipped: true });
  }

  // Get all bottle IDs that already have at least one recipient
  const { data: delivered } = await supabase
    .from("drift_recipients")
    .select("bottle_id");
  const deliveredIds = new Set((delivered ?? []).map((r) => r.bottle_id));

  // Get recent bottles from other users
  const { data: candidates } = await supabase
    .from("drift_bottles")
    .select("id")
    .neq("sender_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const orphaned = (candidates ?? []).filter((b) => !deliveredIds.has(b.id));
  const toAssign = orphaned.slice(0, 2);

  if (toAssign.length === 0) {
    return NextResponse.json({ assigned: 0 });
  }

  await supabase.from("drift_recipients").insert(
    toAssign.map((b) => ({ bottle_id: b.id, recipient_id: userId }))
  );

  return NextResponse.json({ assigned: toAssign.length });
}

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const { data } = await supabase
    .from("user_identity")
    .select("drift_nickname, drift_bio")
    .eq("user_id", userId)
    .single();

  return NextResponse.json({
    nickname: data?.drift_nickname ?? "",
    bio: data?.drift_bio ?? "A Graduate Student",
  });
}

export async function PUT(request: Request) {
  try {
    const { userId, nickname, bio } = await request.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    await supabase
      .from("user_identity")
      .upsert({ user_id: userId, drift_nickname: nickname, drift_bio: bio }, { onConflict: "user_id" });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[drift/profile PUT]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

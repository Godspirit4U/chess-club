import { NextResponse } from "next/server";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";

function cell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "member") {
    return new NextResponse("Not allowed", { status: 403 });
  }

  const supabase = createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id,name")
    .eq("slug", params.slug)
    .single();

  if (!tournament) return new NextResponse("Not found", { status: 404 });

  const { data: rows } = await supabase
    .from("tournament_players")
    .select(
      "registered_at,withdrawn_at,profiles(full_name,email,phone,chesscom_username,lichess_username,chess_username,chess_platform)"
    )
    .eq("tournament_id", tournament.id)
    .order("registered_at", { ascending: true });

  const header = ["S.No", "Name", "Chess.com ID", "Mobile"];

  const lines = [header.map(cell).join(",")];

  let index = 0;
  for (const row of rows ?? []) {
    if ((row as any).withdrawn_at) continue;
    const p = (row as any).profiles ?? {};
    index += 1;
    lines.push(
      [
        cell(index),
        cell(p.full_name),
        cell(p.chesscom_username ?? p.chess_username ?? ""),
        cell(p.phone ?? "")
      ].join(",")
    );
  }

  const filename = `${tournament.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-players.csv`;

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}

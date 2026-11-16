import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentProfile();
  if (!me || me.role === "member") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name,email,phone,chesscom_username,chess_username,chess_platform,role,retired_at")
    .neq("role", "super_admin")
    .order("full_name", { ascending: true });

  const rows = (data ?? []).map((p, index) => ({
    "S.No": index + 1,
    Name: p.full_name ?? "",
    Email: p.email ?? "",
    "Mobile": p.phone ?? "",
    "Chess.com ID":
      p.chesscom_username ?? (p.chess_platform === "chesscom" ? p.chess_username : "") ?? "",
    Status: p.retired_at ? "Retired" : "Active"
  }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = [{ wch: 6 }, { wch: 26 }, { wch: 34 }, { wch: 14 }, { wch: 22 }, { wch: 10 }];

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Members");

  const buffer = XLSX.write(book, { type: "array", bookType: "xlsx" }) as ArrayBuffer;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="saiu-chess-club-members.xlsx"`,
      "Cache-Control": "no-store"
    }
  });
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChessBoard from "@/components/ChessBoard";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string; id: string } };

const resultText: Record<string, string> = {
  white: "White won",
  black: "Black won",
  draw: "Draw",
  bye: "Bye",
  forfeit_white: "Black won by forfeit",
  forfeit_black: "White won by forfeit",
  unplayed: "Not played yet"
};

async function load(slug: string, id: string) {
  const supabase = createClient();
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id,slug,name")
    .eq("slug", slug)
    .single();
  if (!tournament) return null;

  const { data: match } = await supabase
    .from("matches")
    .select("id,board,white_id,black_id,result,pgn,ended_at,round_id,rounds(number)")
    .eq("id", id)
    .single();
  if (!match) return null;

  const ids = [match.white_id, match.black_id].filter(Boolean) as string[];
  const { data: people } = ids.length
    ? await supabase.from("profiles").select("id,full_name").in("id", ids)
    : { data: [] as { id: string; full_name: string }[] };

  const names = new Map((people ?? []).map((p) => [p.id, p.full_name]));

  return { tournament, match, names };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load(params.slug, params.id);
  if (!data) return { title: "Match" };
  const white = data.match.white_id ? data.names.get(data.match.white_id) : null;
  const black = data.match.black_id ? data.names.get(data.match.black_id) : null;
  return { title: `${white ?? "Player"} vs ${black ?? "Player"}` };
}

export default async function MatchPage({ params }: Props) {
  const data = await load(params.slug, params.id);
  if (!data) notFound();

  const { tournament, match, names } = data;
  const white = match.white_id ? names.get(match.white_id) ?? "Member" : "—";
  const black = match.black_id ? names.get(match.black_id) ?? "Member" : "Bye";
  const round = (match as any).rounds?.number;

  return (
    <>
      <p className="small">
        <Link href="/tournaments">Tournaments</Link> ·{" "}
        <Link href={`/tournaments/${tournament.slug}`}>{tournament.name}</Link>
      </p>

      <h1>
        {white} vs {black}
      </h1>
      <p className="muted small">
        {round ? `Round ${round} · ` : ""}Board {match.board} ·{" "}
        {resultText[match.result] ?? match.result}
        {match.ended_at
          ? ` · finished ${new Date(match.ended_at).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit"
            })}`
          : ""}
      </p>

      {match.pgn ? (
        <>
          <div style={{ marginTop: 20 }}>
            <ChessBoard pgn={match.pgn} />
          </div>
          <p className="small" style={{ marginTop: 12 }}>
            <a
              href={`https://lichess.org/analysis/pgn/${encodeURIComponent(
                match.pgn.replace(/\[[^\]]*\]\s*/g, "").replace(/\s+/g, "_")
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              Analyse on Lichess
            </a>
          </p>
        </>
      ) : (
        <p className="empty" style={{ marginTop: 20 }}>
          No game record was saved for this board. The result still counts towards the table.
        </p>
      )}
    </>
  );
}

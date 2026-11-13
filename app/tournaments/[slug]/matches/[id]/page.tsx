import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
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
    ? await supabase
        .from("profiles")
        .select("id,full_name,phone,chesscom_username,lichess_username")
        .in("id", ids)
    : { data: [] as any[] };

  const names = new Map((people ?? []).map((p) => [p.id, p.full_name]));
  const players = new Map((people ?? []).map((p) => [p.id, p]));

  return { tournament, match, names, players };
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

  const { tournament, match, names, players } = data;
  const white = match.white_id ? names.get(match.white_id) ?? "Member" : "—";
  const black = match.black_id ? names.get(match.black_id) ?? "Member" : "Bye";
  const round = (match as any).rounds?.number;

  const viewer = await getCurrentProfile();
  const opponentId =
    viewer && match.white_id === viewer.id
      ? match.black_id
      : viewer && match.black_id === viewer.id
        ? match.white_id
        : null;
  const opponent = opponentId ? (players.get(opponentId) ?? null) : null;

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

      {opponent ? (
        <section className="card" style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>
            Playing {opponent.full_name}
          </h2>
          <p className="muted small" style={{ marginTop: 0 }}>
            Arrange the game before the round starts.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Link className="btn secondary" href={`/members/${opponent.id}`}>
              Profile
            </Link>

            <Link className="btn secondary" href={`/community/${opponent.id}`}>
              Message here
            </Link>

            {opponent.phone ? (
              <a
                className="btn secondary"
                href={`https://wa.me/91${String(opponent.phone).replace(/[^0-9]/g, "").slice(-10)}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp {opponent.phone}
              </a>
            ) : null}

            {opponent.chesscom_username ? (
              <a
                className="site-link"
                href={`https://www.chess.com/member/${opponent.chesscom_username}`}
                target="_blank"
                rel="noreferrer"
              >
                <span aria-hidden="true" className="site-mark">♟</span>
                <span>
                  <strong>Chess.com</strong>{" "}
                  <span className="site-user">{opponent.chesscom_username}</span>
                </span>
              </a>
            ) : null}

            {opponent.lichess_username ? (
              <a
                className="site-link"
                href={`https://lichess.org/@/${opponent.lichess_username}`}
                target="_blank"
                rel="noreferrer"
              >
                <span aria-hidden="true" className="site-mark">♞</span>
                <span>
                  <strong>Lichess</strong>{" "}
                  <span className="site-user">@{opponent.lichess_username}</span>
                </span>
              </a>
            ) : null}
          </div>
        </section>
      ) : null}

      {match.pgn ? (
        <>
          <div style={{ marginTop: 20 }}>
            <ChessBoard pgn={match.pgn} />
          </div>
          <p className="small" style={{ marginTop: 12 }}>
            <a
              href={`https://lichess.org/analysis/pgn/${encodeURIComponent(
                match.pgn
                  .replace(/\[[^\]]*\]/g, " ")
                  .replace(/\{[^}]*\}/g, " ")
                  .replace(/\d+\.(\.\.)?/g, " ")
                  .replace(/\b(1-0|0-1|1\/2-1\/2|\*)\b/g, " ")
                  .replace(/[?!]+/g, "")
                  .trim()
                  .replace(/\s+/g, "_")
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

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", params.id)
    .single();
  return { title: data?.full_name ?? "Member" };
}

export default async function MemberPage({ params }: Props) {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");

  const supabase = createClient();

  const { data: person } = await supabase
    .from("profiles")
    .select(
      "id,full_name,avatar_path,role,chesscom_username,lichess_username,chess_username,chess_platform,phone,created_at"
    )
    .eq("id", params.id)
    .single();

  if (!person) notFound();

  const [{ count: tournaments }, { count: puzzles }, { data: matches }] = await Promise.all([
    supabase
      .from("tournament_players")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", person.id)
      .is("withdrawn_at", null),
    supabase
      .from("puzzle_solves")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", person.id),
    supabase
      .from("matches")
      .select("white_id,black_id,result")
      .or(`white_id.eq.${person.id},black_id.eq.${person.id}`)
  ]);

  let played = 0;
  let wins = 0;
  let draws = 0;

  for (const m of matches ?? []) {
    if (m.result === "unplayed") continue;
    played++;
    const won =
      (m.white_id === person.id && (m.result === "white" || m.result === "forfeit_black")) ||
      (m.black_id === person.id && (m.result === "black" || m.result === "forfeit_white"));
    if (won) wins++;
    else if (m.result === "draw") draws++;
  }

  const chesscom = person.chesscom_username ?? (person.chess_platform === "chesscom" ? person.chess_username : null);
  const lichess = person.lichess_username ?? (person.chess_platform === "lichess" ? person.chess_username : null);
  const isMe = person.id === me.id;

  return (
    <>
      <p className="small">
        <Link href="/community/people">People</Link>
      </p>

      <div className="card" style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <Avatar name={person.full_name} path={person.avatar_path} size={72} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 24 }}>{person.full_name}</h1>
          <p className="muted small" style={{ margin: "4px 0 0" }}>
            {person.role === "member" ? "Member" : person.role.replace("_", " ")}
            {person.created_at
              ? ` · joined ${new Date(person.created_at).toLocaleDateString("en-IN", {
                  month: "short",
                  year: "numeric"
                })}`
              : ""}
          </p>
        </div>

        {isMe ? (
          <Link className="btn secondary" href="/profile">
            Your profile
          </Link>
        ) : (
          <Link className="btn" href={`/community/${person.id}`}>
            Message
          </Link>
        )}
      </div>

      <div className="grid three" style={{ marginTop: 16 }}>
        <div className="card">
          <h2 style={{ margin: 0, fontSize: 22 }}>{tournaments ?? 0}</h2>
          <p className="muted small" style={{ margin: "2px 0 0" }}>
            {(tournaments ?? 0) === 1 ? "Tournament entered" : "Tournaments entered"}
          </p>
        </div>
        <div className="card">
          <h2 style={{ margin: 0, fontSize: 22 }}>
            {wins}
            <span className="muted" style={{ fontSize: 15 }}>
              {" "}
              / {played}
            </span>
          </h2>
          <p className="muted small" style={{ margin: "2px 0 0" }}>
            Games won
          </p>
        </div>
        <div className="card">
          <h2 style={{ margin: 0, fontSize: 22 }}>{puzzles ?? 0}</h2>
          <p className="muted small" style={{ margin: "2px 0 0" }}>
            {(puzzles ?? 0) === 1 ? "Puzzle solved" : "Puzzles solved"}
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 16 }}>Record</h2>
        <p className="muted small" style={{ margin: 0 }}>
          {played === 0
            ? "No games on record yet."
            : `${played} ${played === 1 ? "game" : "games"} played · ${wins} won · ${draws} drawn · ${played - wins - draws} lost`}
        </p>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 16 }}>Where they play</h2>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {chesscom ? (
            <a
              className="site-link"
              href={`https://www.chess.com/member/${chesscom}`}
              target="_blank"
              rel="noreferrer"
            >
              <span aria-hidden="true" className="site-mark">♟</span>
              <span>
                <strong>Chess.com</strong> <span className="site-user">{chesscom}</span>
              </span>
            </a>
          ) : null}

          {lichess ? (
            <a
              className="site-link"
              href={`https://lichess.org/@/${lichess}`}
              target="_blank"
              rel="noreferrer"
            >
              <span aria-hidden="true" className="site-mark">♞</span>
              <span>
                <strong>Lichess</strong> <span className="site-user">@{lichess}</span>
              </span>
            </a>
          ) : null}

          {!chesscom && !lichess ? (
            <p className="muted small" style={{ margin: 0 }}>
              No online accounts listed.
            </p>
          ) : null}
        </div>

        {!isMe && person.phone ? (
          <p style={{ marginTop: 14, marginBottom: 0 }}>
            <a
              className="btn secondary"
              href={`https://wa.me/91${String(person.phone).replace(/[^0-9]/g, "").slice(-10)}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp {person.phone}
            </a>
          </p>
        ) : null}
      </div>
    </>
  );
}

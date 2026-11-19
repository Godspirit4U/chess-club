import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, getCurrentProfile, isConfigured } from "@/lib/supabase/server";
import { computeStandings, type MatchRow } from "@/lib/pairings";
import { registerForTournament, withdrawFromTournament } from "@/app/admin/tournaments/actions";
import SubmitButton from "@/components/SubmitButton";
import ShareTournament from "@/components/ShareTournament";
import { chesscomRatings, ratingForTimeControl } from "@/lib/chesscom";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

const labels: Record<string, string> = {
  swiss: "Swiss",
  round_robin: "Round robin",
  knockout: "Knockout",
  groups_knockout: "Groups then knockout",
  custom: "Custom"
};

async function loadTournament(slug: string) {
  if (!isConfigured) return null;
  const supabase = createClient();
  const { data } = await supabase
    .from("tournaments")
    .select(
      "id,slug,name,description,status,format,rounds,time_control,rules,structure,starts_at,registration_deadline,share_code"
    )
    .eq("slug", slug)
    .single();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await loadTournament(params.slug);
  return {
    title: t?.name ?? "Tournament",
    description: t?.description ?? undefined
  };
}

export default async function TournamentPage({ params }: Props) {
  const tournament = await loadTournament(params.slug);
  if (!tournament) notFound();

  const profile = await getCurrentProfile();
  const supabase = isConfigured ? createClient() : null;

  const { data: players } = supabase
    ? await supabase
        .from("tournament_players")
        .select("profile_id,withdrawn_at,profiles(full_name,chesscom_username,chess_username,chess_platform)")
        .eq("tournament_id", tournament.id)
    : { data: [] as any[] };

  const { data: playoffMatches } = supabase
    ? await supabase
        .from("matches")
        .select("id,slot,white_id,black_id,result,white_source,black_source")
        .eq("tournament_id", tournament.id)
        .eq("stage", "playoff")
        .order("board", { ascending: true })
    : { data: [] as any[] };

  const playoff = playoffMatches ?? [];
  const playoffBySlot = new Map(playoff.map((m: any) => [m.slot, m]));

  const { data: rounds } = supabase
    ? await supabase
        .from("rounds")
        .select("id,number,published_at,name")
        .eq("tournament_id", tournament.id)
        .not("published_at", "is", null)
        .order("number", { ascending: true })
    : { data: [] as any[] };

  const publishedRoundIds = (rounds ?? []).map((r: any) => r.id);

  const { data: allMatches } = supabase && publishedRoundIds.length
    ? await supabase
        .from("matches")
        .select("id,round_id,board,white_id,black_id,result,pgn")
        .in("round_id", publishedRoundIds)
        .order("board", { ascending: true })
    : { data: [] as any[] };

  const active = (players ?? []).filter((p: any) => !p.withdrawn_at);
  const registered = profile
    ? active.some((p: any) => p.profile_id === profile.id)
    : false;

  const deadlinePassed = tournament.registration_deadline
    ? new Date(tournament.registration_deadline) < new Date()
    : false;
  const registrationOpen = tournament.status === "open" && !deadlinePassed;

  const shareUrl = `https://saiu-chess-club.vercel.app/tournaments/${tournament.slug}`;

  const ratingPairs = await Promise.all(
    active.map(async (p: any) => {
      const username =
        p.profiles?.chesscom_username ??
        (p.profiles?.chess_platform === "chesscom" ? p.profiles?.chess_username : null);
      if (!username) return [p.profile_id, null] as const;
      const stats = await chesscomRatings(username);
      return [p.profile_id, ratingForTimeControl(stats, tournament.time_control)] as const;
    })
  );
  const ratingByPlayer = new Map(ratingPairs);

  const shareSummary = [
    `${tournament.rounds} rounds`,
    tournament.time_control ? `Time control ${tournament.time_control}` : "",
    tournament.starts_at
      ? `Starts ${new Date(tournament.starts_at).toLocaleString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          hour: "numeric",
          minute: "2-digit"
        })}`
      : "",
    registrationOpen ? "Registration is open" : "Registration is closed"
  ]
    .filter(Boolean)
    .join(" · ");

  let qrSvg = "";
  try {
    const QR = await import("qrcode");
    qrSvg = await QR.toString(shareUrl, {
      type: "svg",
      margin: 1,
      width: 148,
      color: { dark: "#14201a", light: "#ffffff" }
    });
  } catch {
    qrSvg = "";
  }

  const statusLabel =
    tournament.status === "running"
      ? "Running now"
      : tournament.status === "completed"
        ? "Completed"
        : registrationOpen
          ? "Registration open"
          : "Registration closed";

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap"
        }}
      >
        <p className="small" style={{ margin: 0 }}>
          <Link href="/tournaments">Tournaments</Link>
        </p>
        {profile && profile.role !== "member" ? (
          <p className="small" style={{ margin: 0, display: "flex", gap: 12 }}>
            <Link className="btn" href={`/tournaments/${tournament.slug}/console`}>
              Open console
            </Link>
            <Link className="btn secondary" href={`/tournaments/${tournament.slug}/edit`}>
              Edit
            </Link>
            <Link className="btn secondary" href={`/tournaments/${tournament.slug}/add-players`}>
              Add players
            </Link>
          </p>
        ) : null}
      </div>

      <h1>{tournament.name}</h1>
      <p className="muted">
        {tournament.rounds} rounds
        {tournament.time_control ? ` · ${tournament.time_control} min` : ""}
        {tournament.starts_at
          ? ` · starts ${new Date(tournament.starts_at).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short"
            })}`
          : ""}
      </p>

      <p className={`badge${tournament.status === "running" ? " live" : ""}`}>{statusLabel}</p>

      {tournament.description ? <p style={{ marginTop: 16 }}>{tournament.description}</p> : null}

      <div style={{ marginTop: 20 }}>
        {tournament.status === "completed" ? (
          <p className="muted small">This tournament has finished.</p>
        ) : registered ? (
          <div className="stack" style={{ maxWidth: 320 }}>
            <p className="muted small" style={{ margin: 0 }}>
              You are registered. Pairings appear here once the admin publishes them.
            </p>
            {registrationOpen ? (
              <form action={withdrawFromTournament}>
                <input type="hidden" name="tournament_id" value={tournament.id} />
                <input type="hidden" name="slug" value={tournament.slug} />
                <SubmitButton className="btn secondary">
                  Withdraw my registration
                </SubmitButton>
              </form>
            ) : null}
          </div>
        ) : registrationOpen ? (
          profile ? (
            <form action={registerForTournament}>
              <input type="hidden" name="tournament_id" value={tournament.id} />
              <input type="hidden" name="slug" value={tournament.slug} />
              <SubmitButton>Register</SubmitButton>
            </form>
          ) : (
            <p>
              <Link className="btn" href="/login">
                Sign in to register
              </Link>
            </p>
          )
        ) : (
          <p className="muted small">
            Registration is closed
            {tournament.registration_deadline
              ? ` since ${new Date(tournament.registration_deadline).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short"
                })}`
              : ""}
            .
          </p>
        )}
      </div>

      {profile && profile.role !== "member" && qrSvg ? (
        <ShareTournament
          title={tournament.name}
          summary={shareSummary}
          url={shareUrl}
          qr={qrSvg}
        />
      ) : null}

      <section style={{ marginTop: 28 }}>
        <h2>Players ({active.length})</h2>
        {active.length === 0 ? null : (
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {active.map((p: any) => (
              <li key={p.profile_id}>
                <Link href={`/members/${p.profile_id}`}>{p.profiles?.full_name ?? "Member"}</Link>
                {ratingByPlayer.get(p.profile_id) ? (
                  <span className="muted small"> · {ratingByPlayer.get(p.profile_id)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {tournament.rules ? (
        <section style={{ marginTop: 28 }}>
          <h2>Rules</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{tournament.rules}</p>
        </section>
      ) : null}

      {tournament.structure ? (
        <section style={{ marginTop: 28 }}>
          <h2>Structure</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{tournament.structure}</p>
        </section>
      ) : null}

      {(allMatches ?? []).length > 0 ? (
        <>
          <section style={{ marginTop: 28 }}>
            <h2>{tournament.status === "running" ? "Live leaderboard" : "Leaderboard"}</h2>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>P</th>
                  <th>W</th>
                  <th>D</th>
                  <th>L</th>
                  <th>Pts</th>
                  <th>Form</th>
                </tr>
              </thead>
              <tbody>
                {computeStandings(
                  active.map((p: any) => ({
                    profileId: p.profile_id,
                    name: p.profiles?.full_name ?? "Member"
                  })),
                  (allMatches as MatchRow[]) ?? [],
                  { win: 1, draw: 0.5, loss: 0 }
                ).map((row, i) => (
                  <tr key={row.profileId}>
                    <td>{i + 1}</td>
                    <td>{row.name}</td>
                    <td>{row.played}</td>
                    <td>{row.wins}</td>
                    <td>{row.draws}</td>
                    <td>{row.losses}</td>
                    <td>
                      <strong>{row.points}</strong>
                    </td>
                    <td className="small muted">{row.form.slice(-5).join(" ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {playoff.length > 0 ? (
            <section style={{ marginTop: 28 }}>
              <h2>Playoff</h2>

              <div className="playoff-grid">
                {["SF1", "ELIM", "SF2", "GF"].map((slot) => {
                  const m = playoffBySlot.get(slot) as any;
                  if (!m) return null;

                  const title =
                    slot === "SF1"
                      ? "Semi-final 1"
                      : slot === "ELIM"
                        ? "Eliminator"
                        : slot === "SF2"
                          ? "Semi-final 2"
                          : "Grand Final";

                  const person = (id: string | null) => {
                    if (!id) return null;
                    const found = (active ?? []).find((p: any) => p.profile_id === id);
                    return {
                      id,
                      name:
                        ((found?.profiles as any)?.full_name ??
                          (found?.profiles as any)?.[0]?.full_name ??
                          "Member") as string
                    };
                  };

                  const label = (source: string | null, fallback: string) => {
                    if (!source) return fallback;
                    const [kind, ref] = source.split(":");
                    const refName =
                      ref === "SF1"
                        ? "Semi-final 1"
                        : ref === "ELIM"
                          ? "the Eliminator"
                          : ref === "SF2"
                            ? "Semi-final 2"
                            : "the previous match";
                    return `${kind === "winner" ? "Winner" : "Loser"} of ${refName}`;
                  };

                  const white = person(m.white_id);
                  const black = person(m.black_id);
                  const whiteLabel = white ? white.name : label(m.white_source, "To be decided");
                  const blackLabel = black ? black.name : label(m.black_source, "To be decided");

                  const score =
                    m.result === "white" || m.result === "forfeit_black"
                      ? "1–0"
                      : m.result === "black" || m.result === "forfeit_white"
                        ? "0–1"
                        : m.result === "draw"
                          ? "½–½"
                          : "";

                  const done = m.result !== "unplayed";

                  return (
                    <div key={m.id} className={`playoff-card ${slot === "GF" ? "final" : ""}`}>
                      <div className="playoff-head">
                        <span>{title}</span>
                        <span className={`status-chip ${done ? "done" : "pending"}`}>
                          {done ? "Completed" : "Pending"}
                        </span>
                      </div>

                      <div className="playoff-body">
                        <div className="playoff-side">
                          <span className="colour-chip light">W</span>
                          {white ? (
                            <Link href={`/members/${white.id}`}>{white.name}</Link>
                          ) : (
                            <span className="muted">{whiteLabel}</span>
                          )}
                        </div>

                        <div className="playoff-side">
                          <span className="colour-chip dark">B</span>
                          {black ? (
                            <Link href={`/members/${black.id}`}>{black.name}</Link>
                          ) : (
                            <span className="muted">{blackLabel}</span>
                          )}
                        </div>

                        {score ? <div className="playoff-score">{score}</div> : null}

                        <Link
                          className="btn secondary"
                          href={`/tournaments/${tournament.slug}/matches/${m.id}`}
                          style={{ minHeight: 30, fontSize: 13, marginTop: 4 }}
                        >
                          Match details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section style={{ marginTop: 28 }}>
            <h2>Pairings</h2>
            {[...(rounds ?? [])].sort((a: any, b: any) => b.number - a.number).map((r: any) => {
              const rows = (allMatches ?? []).filter((m: any) => m.round_id === r.id);
              return (
                <div key={r.id} className="card" style={{ marginBottom: 12 }}>
                  <h3 style={{ marginBottom: 2 }}>
                    {(r as any).name || `Round ${r.number}`}
                    <span className="muted small" style={{ fontWeight: 400, marginLeft: 8 }}>
                      {rows.filter((m: any) => m.result !== "unplayed").length} of {rows.length}{" "}
                      matches completed
                    </span>
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {rows.map((m: any) => {
                      const whiteName = active.find((p: any) => p.profile_id === m.white_id);
                      const blackName = active.find((p: any) => p.profile_id === m.black_id);
                      const score =
                        m.result === "white" || m.result === "forfeit_black"
                          ? "1-0"
                          : m.result === "black" || m.result === "forfeit_white"
                            ? "0-1"
                            : m.result === "draw"
                              ? "½-½"
                              : m.result === "bye"
                                ? "bye"
                                : "";
                      const whiteId = m.white_id;
                      const blackId = m.black_id;

                      return (
                        <li
                          key={m.id}
                          className="small"
                          style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                            flexWrap: "wrap",
                            padding: "6px 0",
                            borderTop: "1px solid var(--border)",
                            listStyle: "none",
                            marginLeft: -18
                          }}
                        >
                          <span style={{ width: 34, color: "var(--muted)" }}>
                            {m.board}
                          </span>

                          {whiteId ? (
                            <Link
                              href={`/members/${whiteId}`}
                              style={{
                                fontWeight: 600,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6
                              }}
                            >
                              <span className="colour-chip light" title="White">W</span>
                              {whiteName?.profiles?.full_name ?? "Member"}
                            </Link>
                          ) : (
                            <span>—</span>
                          )}

                          <span className="muted">vs</span>

                          {blackId ? (
                            <Link
                              href={`/members/${blackId}`}
                              style={{
                                fontWeight: 600,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6
                              }}
                            >
                              <span className="colour-chip dark" title="Black">B</span>
                              {blackName?.profiles?.full_name ?? "Member"}
                            </Link>
                          ) : (
                            <span className="muted">bye</span>
                          )}

                          {score ? <strong style={{ marginLeft: 4 }}>{score}</strong> : null}

                          <span
                            className={`status-chip ${m.result === "unplayed" ? "pending" : "done"}`}
                            style={{ marginLeft: "auto" }}
                          >
                            {m.result === "unplayed" ? "Pending" : "Completed"}
                          </span>

                          <Link
                            className="btn secondary"
                            href={`/tournaments/${tournament.slug}/matches/${m.id}`}
                            style={{ minHeight: 30, fontSize: 13 }}
                          >
                            Open match
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </section>

        </>
      ) : null}
    </>
  );
}

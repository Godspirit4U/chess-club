import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, getCurrentProfile, isConfigured } from "@/lib/supabase/server";
import { computeStandings, type MatchRow } from "@/lib/pairings";
import { registerForTournament, withdrawFromTournament } from "@/app/admin/tournaments/actions";

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
      "id,slug,name,description,status,format,rounds,time_control,rules,structure,starts_at,registration_deadline"
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
        .select("profile_id,withdrawn_at,profiles(full_name)")
        .eq("tournament_id", tournament.id)
    : { data: [] as any[] };

  const { data: rounds } = supabase
    ? await supabase
        .from("rounds")
        .select("id,number,published_at")
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
            <Link href={`/admin/tournaments/${tournament.slug}/console`}>Open console</Link>
            <Link href="/admin/tournaments/new">Create a tournament</Link>
          </p>
        ) : null}
      </div>

      <h1>{tournament.name}</h1>
      <p className="muted">
        {labels[tournament.format] ?? tournament.format} · {tournament.rounds} rounds ·{" "}
        {tournament.time_control}
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
                <button className="btn secondary" type="submit">
                  Withdraw my registration
                </button>
              </form>
            ) : null}
          </div>
        ) : registrationOpen ? (
          profile ? (
            <form action={registerForTournament}>
              <input type="hidden" name="tournament_id" value={tournament.id} />
              <input type="hidden" name="slug" value={tournament.slug} />
              <button className="btn" type="submit">
                Register
              </button>
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

      <section style={{ marginTop: 28 }}>
        <h2>Players ({active.length})</h2>
        {active.length === 0 ? null : (
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {active.map((p: any) => (
              <li key={p.profile_id}>{p.profiles?.full_name ?? "Member"}</li>
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
            <h2>Points table</h2>
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

          <section style={{ marginTop: 28 }}>
            <h2>Pairings</h2>
            {(rounds ?? []).map((r: any) => {
              const rows = (allMatches ?? []).filter((m: any) => m.round_id === r.id);
              return (
                <div key={r.id} className="card" style={{ marginBottom: 12 }}>
                  <h3>Round {r.number}</h3>
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
                      return (
                        <li key={m.id} className="small">
                          {whiteName?.profiles?.full_name ?? "—"} vs{" "}
                          {blackName?.profiles?.full_name ?? "bye"}{" "}
                          {score ? <strong>{score}</strong> : null}{" "}
                          <Link href={`/tournaments/${tournament.slug}/matches/${m.id}`}>
                            open
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

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeStandings, generateSwiss, type MatchRow } from "@/lib/pairings";
import {
  completeTournament,
  deleteTournament,
  generateRound,
  publishRound,
  saveResult,
  startTournament,
  swapColours
} from "@/app/admin/tournaments/console-actions";

export const metadata: Metadata = { title: "Tournament console" };
export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
  searchParams: { error?: string };
};

export default async function ConsolePage({ params, searchParams }: Props) {
  const supabase = createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id,slug,name,status,rounds,points_win,points_draw,points_loss")
    .eq("slug", params.slug)
    .single();

  if (!tournament) notFound();

  const { data: players } = await supabase
    .from("tournament_players")
    .select("profile_id,profiles(full_name)")
    .eq("tournament_id", tournament.id)
    .is("withdrawn_at", null);

  const { data: rounds } = await supabase
    .from("rounds")
    .select("id,number,published_at")
    .eq("tournament_id", tournament.id)
    .order("number", { ascending: true });

  const roundIds = (rounds ?? []).map((r) => r.id);

  const { data: matches } = roundIds.length
    ? await supabase
        .from("matches")
        .select("id,round_id,board,white_id,black_id,result,pgn")
        .in("round_id", roundIds)
        .order("board", { ascending: true })
    : { data: [] as any[] };

  const nameOf = new Map<string, string>();
  for (const p of players ?? []) {
    nameOf.set((p as any).profile_id, (p as any).profiles?.full_name ?? "Member");
  }

  const draftRound = (rounds ?? []).find((r) => !r.published_at) ?? null;
  const draftMatches = draftRound
    ? (matches ?? []).filter((m) => m.round_id === draftRound.id)
    : [];

  const roundNumber = new Map((rounds ?? []).map((r) => [r.id, r.number]));

  const previous = ((matches ?? []) as any[])
    .filter((m) => m.round_id !== draftRound?.id)
    .map((m) => ({ ...m, round: roundNumber.get(m.round_id) ?? 0 })) as MatchRow[];
  const standings = computeStandings(
    (players ?? []).map((p: any) => ({
      profileId: p.profile_id,
      name: p.profiles?.full_name ?? "Member"
    })),
    previous,
    {
      win: Number(tournament.points_win),
      draw: Number(tournament.points_draw),
      loss: Number(tournament.points_loss)
    }
  );

  // Warnings for the draft are recomputed against earlier rounds.
  const draft = draftRound ? generateSwiss(standings, previous) : null;
  const warningFor = new Map<number, string[]>();
  for (const b of draft?.boards ?? []) warningFor.set(b.board, b.warnings);

  return (
    <>
      <p className="small">
        <Link href="/admin">Admin</Link> · <Link href={`/tournaments/${tournament.slug}`}>Public page</Link>
      </p>

      <h1>{tournament.name}</h1>
      <p className="muted small">
        {tournament.status} · {(players ?? []).length} players · {(rounds ?? []).length} of{" "}
        {tournament.rounds} rounds created
      </p>

      {searchParams.error ? (
        <p
          role="alert"
          style={{
            border: "1px solid #e3c9c9",
            background: "#fbf1f1",
            color: "#a32b2b",
            borderRadius: 6,
            padding: "10px 12px",
            fontSize: 14
          }}
        >
          {searchParams.error}
        </p>
      ) : null}

      {tournament.status === "open" ? (
        <form action={startTournament} style={{ marginTop: 16 }}>
          <input type="hidden" name="tournament_id" value={tournament.id} />
          <input type="hidden" name="slug" value={tournament.slug} />
          <button className="btn" type="submit">
            Start the tournament
          </button>
        </form>
      ) : null}

      {tournament.status === "running" && !draftRound ? (
        <form action={generateRound} style={{ marginTop: 16 }}>
          <input type="hidden" name="tournament_id" value={tournament.id} />
          <input type="hidden" name="slug" value={tournament.slug} />
          <button className="btn" type="submit">
            Generate pairings for round {(rounds?.length ?? 0) + 1}
          </button>
        </form>
      ) : null}

      {draftRound ? (
        <section style={{ marginTop: 28 }}>
          <h2>Round {draftRound.number}: draft pairings</h2>
          <p className="muted small">
            Nothing here is public yet. Members see only the list of participants until
            you publish.
          </p>

          <table style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Board</th>
                <th>White</th>
                <th>Black</th>
                <th>Check</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {draftMatches.map((m) => {
                const warnings = warningFor.get(m.board) ?? [];
                const isBye = !m.black_id;
                return (
                  <tr key={m.id}>
                    <td>{m.board}</td>
                    <td>{m.white_id ? nameOf.get(m.white_id) ?? "Member" : "—"}</td>
                    <td>{isBye ? "Bye" : m.black_id ? nameOf.get(m.black_id) ?? "Member" : "—"}</td>
                    <td className="small">
                      {isBye ? (
                        <span className="muted">No opponent this round</span>
                      ) : warnings.length ? (
                        <span style={{ color: "var(--amber)" }}>{warnings.join("; ")}</span>
                      ) : (
                        <span className="muted">OK</span>
                      )}
                    </td>
                    <td>
                      {!isBye ? (
                        <form action={swapColours}>
                          <input type="hidden" name="match_id" value={m.id} />
                          <input type="hidden" name="slug" value={tournament.slug} />
                          <input type="hidden" name="white_id" value={m.white_id ?? ""} />
                          <input type="hidden" name="black_id" value={m.black_id ?? ""} />
                          <button className="btn secondary" type="submit" style={{ minHeight: 36 }}>
                            Swap colours
                          </button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <form action={publishRound} style={{ marginTop: 16 }}>
            <input type="hidden" name="round_id" value={draftRound.id} />
            <input type="hidden" name="slug" value={tournament.slug} />
            <button className="btn" type="submit">
              Publish pairings for round {draftRound.number}
            </button>
          </form>
        </section>
      ) : null}

      {(rounds ?? []).some((r) => r.published_at) ? (
        <section style={{ marginTop: 28 }}>
          <h2>Enter results</h2>
          <p className="muted small">
            One row per board. A PGN is optional; the result counts either way.
          </p>

          {(rounds ?? [])
            .filter((r) => r.published_at)
            .map((r) => {
              const rows = (matches ?? []).filter((m) => m.round_id === r.id);
              return (
                <div key={r.id} className="card" style={{ marginBottom: 16 }}>
                  <h3>Round {r.number}</h3>
                  {rows.map((m) => {
                    const isBye = !m.black_id;
                    return (
                      <form
                        key={m.id}
                        action={saveResult}
                        style={{
                          display: "grid",
                          gap: 8,
                          padding: "10px 0",
                          borderTop: "1px solid var(--border)"
                        }}
                      >
                        <input type="hidden" name="match_id" value={m.id} />
                        <input type="hidden" name="slug" value={tournament.slug} />

                        <div className="small">
                          Board {m.board}: {m.white_id ? nameOf.get(m.white_id) : "—"} vs{" "}
                          {isBye ? "bye" : m.black_id ? nameOf.get(m.black_id) : "—"}{" "}
                          <span className="muted">· now: {m.result}</span>
                        </div>

                        {isBye ? (
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button className="btn secondary" name="result" value="bye" type="submit">
                              Count as bye
                            </button>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <button className="btn" name="result" value="white" type="submit">
                                White won
                              </button>
                              <button className="btn secondary" name="result" value="draw" type="submit">
                                Draw
                              </button>
                              <button className="btn" name="result" value="black" type="submit">
                                Black won
                              </button>
                            </div>
                            <input
                              name="pgn"
                              placeholder="PGN, optional"
                              defaultValue={m.pgn ?? ""}
                              style={{ fontSize: 13 }}
                            />
                          </>
                        )}
                      </form>
                    );
                  })}
                </div>
              );
            })}
        </section>
      ) : null}

      {tournament.status === "running" ? (
        <form action={completeTournament} style={{ marginTop: 24 }}>
          <input type="hidden" name="tournament_id" value={tournament.id} />
          <input type="hidden" name="slug" value={tournament.slug} />
          <button className="btn secondary" type="submit">
            Mark the tournament complete
          </button>
        </form>
      ) : null}
      <section style={{ marginTop: 44, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
        <h2>Delete this tournament</h2>
        <p className="muted small">
          Removes the tournament, its registrations, pairings and results. This cannot be
          undone.
        </p>
        <form action={deleteTournament} className="stack" style={{ maxWidth: 420 }}>
          <input type="hidden" name="tournament_id" value={tournament.id} />
          <input type="hidden" name="slug" value={tournament.slug} />
          <label style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 400 }}>
            <input
              type="checkbox"
              name="confirm"
              style={{ width: 18, minHeight: 18 }}
              required
            />
            I understand this deletes everything for this tournament
          </label>
          <button
            className="btn secondary"
            type="submit"
            style={{ color: "var(--danger)", maxWidth: 220 }}
          >
            Delete tournament
          </button>
        </form>
      </section>
    </>
  );
}

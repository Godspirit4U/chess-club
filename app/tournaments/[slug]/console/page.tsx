import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { computeStandings, generateSwiss, type MatchRow } from "@/lib/pairings";
import SubmitButton from "@/components/SubmitButton";
import ConfirmButton from "@/components/ConfirmButton";
import { SLOT_TITLE } from "@/lib/playoff";
import AddRound from "@/components/AddRound";
import PgnInput from "@/components/PgnInput";
import ResultRow from "@/components/ResultRow";
import {
  completeTournament,
  deleteRound,
  deleteTournament,
  generateRound,
  publishRound,
  regenerateRound,
  createPlayoff,
  createRoundRobin,
  renameRound,
  balanceCustomColours,
  shuffleCustomRound,
  swapMatchColours,
  saveResult,
  startTournament,
  swapColours
} from "@/lib/tournament-actions";

export const metadata: Metadata = { title: "Tournament console" };
export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
  searchParams: { error?: string };
};

export default async function ConsolePage({ params, searchParams }: Props) {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  if (me.role === "member") redirect("/");

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
    .select("id,number,published_at,name")
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

  const { data: playoffMatches } = await supabase
    .from("matches")
    .select("id,slot,white_id,black_id,result,pgn,white_source,black_source")
    .eq("tournament_id", tournament.id)
    .eq("stage", "playoff")
    .order("board", { ascending: true });

  const playoff = playoffMatches ?? [];
  const playoffBySlot = new Map(playoff.map((m: any) => [m.slot, m]));

  const draftRounds = (rounds ?? []).filter((r: any) => !r.published_at);
  const draftRound = draftRounds[0] ?? null;
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap"
        }}
      >
        <p className="small" style={{ margin: 0 }}>
          Console
        </p>

        <Link className="btn secondary" href={`/tournaments/${tournament.slug}`}>
          Exit console
        </Link>
      </div>

      <h1 style={{ marginTop: 8 }}>{tournament.name}</h1>
      <p className="muted small">
        {tournament.status} · {(players ?? []).length} players · {(rounds ?? []).length} of{" "}
        {tournament.rounds} rounds created
      </p>

      <p style={{ marginTop: 8 }}>
        <a className="btn secondary" href={`/admin/tournaments/${tournament.slug}/export`}>
          Export player list
        </a>
      </p>

      {searchParams.error ? (
        <p
          role="alert"
          style={{
            border: "1px solid #e3c9c9",
            background: "var(--tint-danger)",
            color: "var(--danger)",
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
          <SubmitButton>Start the tournament</SubmitButton>
        </form>
      ) : null}

      {draftRounds.length > 0 ? (
        <section style={{ marginTop: 28 }}>
          <h2>Draft pairings</h2>
          <p className="muted small">
            Nothing here is public yet. Check each round, then publish it.
          </p>

          {draftRounds.map((dr: any) => {
            const rows = (matches ?? []).filter((m: any) => m.round_id === dr.id);
            return (
              <div key={dr.id} className="card" style={{ marginTop: 12 }}>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap"
                  }}
                >
                  <h3 style={{ marginTop: 0, marginBottom: 0 }}>
                    {dr.name || `Round ${dr.number}`}
                  </h3>

                  <form action={renameRound} style={{ display: "flex", gap: 6 }}>
                    <input type="hidden" name="round_id" value={dr.id} />
                    <input type="hidden" name="slug" value={tournament.slug} />
                    <input
                      name="name"
                      list="round-name-options"
                      defaultValue={dr.name ?? ""}
                      placeholder={`Round ${dr.number}`}
                      style={{ width: 150, minHeight: 30, fontSize: 13 }}
                    />
                    <button
                      type="submit"
                      className="btn secondary"
                      style={{ minHeight: 30, fontSize: 12 }}
                    >
                      Name it
                    </button>
                  </form>
                </div>

                <table className="draft-table" style={{ marginTop: 8 }}>
                  <thead>
                    <tr>
                      <th>Board</th>
                      <th>White</th>
                      <th>Black</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((m: any) => {
                      const whiteName = (players ?? []).find(
                        (pl: any) => pl.profile_id === m.white_id
                      );
                      const blackName = (players ?? []).find(
                        (pl: any) => pl.profile_id === m.black_id
                      );
                      return (
                        <tr key={m.id}>
                          <td>{m.board}</td>
                          <td>
                            <span className="colour-chip light" style={{ marginRight: 6 }}>W</span>
                            {((whiteName?.profiles as any)?.full_name ??
                              (whiteName?.profiles as any)?.[0]?.full_name) ?? "—"}
                          </td>
                          <td>
                            <span className="colour-chip dark" style={{ marginRight: 6 }}>B</span>
                            {((blackName?.profiles as any)?.full_name ??
                              (blackName?.profiles as any)?.[0]?.full_name) ?? "bye"}
                          </td>
                          <td className="draft-actions">
                            {m.white_id && m.black_id ? (
                              <form action={swapMatchColours}>
                                <input type="hidden" name="match_id" value={m.id} />
                                <input type="hidden" name="slug" value={tournament.slug} />
                                <button
                                  type="submit"
                                  className="btn secondary"
                                  style={{ minHeight: 28, fontSize: 12 }}
                                >
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

                <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  <form action={publishRound}>
                    <input type="hidden" name="round_id" value={dr.id} />
                    <input type="hidden" name="slug" value={tournament.slug} />
                    <SubmitButton>Publish round {dr.number}</SubmitButton>
                  </form>

                  <form action={balanceCustomColours}>
                    <input type="hidden" name="tournament_id" value={tournament.id} />
                    <input type="hidden" name="round_id" value={dr.id} />
                    <input type="hidden" name="slug" value={tournament.slug} />
                    <SubmitButton className="btn secondary">Balance colours</SubmitButton>
                  </form>

                  <form action={shuffleCustomRound}>
                    <input type="hidden" name="tournament_id" value={tournament.id} />
                    <input type="hidden" name="round_id" value={dr.id} />
                    <input type="hidden" name="slug" value={tournament.slug} />
                    <SubmitButton className="btn secondary">Shuffle</SubmitButton>
                  </form>

                  <form action={deleteRound}>
                    <input type="hidden" name="round_id" value={dr.id} />
                    <input type="hidden" name="slug" value={tournament.slug} />
                    <ConfirmButton
                      message={`Delete the draft pairings for round ${dr.number}? Nothing has been played yet, so this is safe.`}
                      style={{ minHeight: 34, color: "var(--danger)" }}
                    >
                      Delete draft
                    </ConfirmButton>
                  </form>
                </div>
              </div>
            );
          })}
        </section>
      ) : null}

      <datalist id="round-name-options">
        <option value="Round 1" />
        <option value="Round 2" />
        <option value="Round 3" />
        <option value="Quarterfinals" />
        <option value="Semi-final 1" />
        <option value="Semi-final 2" />
        <option value="Eliminator" />
        <option value="Grand Final" />
      </datalist>

      <AddRound
        tournamentId={tournament.id}
        slug={tournament.slug}
        canAddSwiss={tournament.status === "running" && draftRounds.length === 0}
        nextRoundNumber={(rounds?.length ?? 0) + 1}
        rounds={(rounds ?? []).map((r: any) => ({ id: r.id, number: r.number, name: r.name ?? null }))}
        playerNames={(players ?? []).map(
          (p: any) =>
            ((p.profiles as any)?.full_name ?? (p.profiles as any)?.[0]?.full_name ?? "Member") as string
        )}
      />

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
                  {(() => {
                    const all = (matches ?? []).filter((m: any) => m.round_id === r.id);
                    const done = all.filter((m: any) => m.result !== "unplayed").length;
                    const withPgn = all.filter((m: any) => m.pgn).length;
                    return (
                      <p className="small muted" style={{ margin: "0 0 8px" }}>
                        {done} of {all.length} results entered · {withPgn} with PGN
                      </p>
                    );
                  })()}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap"
                    }}
                  >
                    <h3 style={{ margin: 0 }}>{r.name || `Round ${r.number}`}</h3>

                    <form action={renameRound} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input type="hidden" name="round_id" value={r.id} />
                      <input type="hidden" name="slug" value={tournament.slug} />
                      <input
                        name="name"
                        list="round-name-options"
                        defaultValue={(r as any).name ?? ""}
                        placeholder={`Round ${r.number}`}
                        style={{ width: 150, minHeight: 30, fontSize: 13 }}
                      />
                      <button
                        type="submit"
                        className="btn secondary"
                        style={{ minHeight: 30, fontSize: 12 }}
                      >
                        Rename
                      </button>
                    </form>

                    <form action={deleteRound}>
                      <input type="hidden" name="round_id" value={r.id} />
                      <input type="hidden" name="slug" value={tournament.slug} />
                      <ConfirmButton
                        message={`Delete the pairings and results for round ${r.number}?`}
                        style={{ minHeight: 32, fontSize: 13, color: "var(--danger)" }}
                      >
                        Delete round
                      </ConfirmButton>
                    </form>
                  </div>
                  {rows.map((m) => {
                    const isBye = !m.black_id;
                    return (
                      <ResultRow
                        key={m.id}
                        matchId={m.id}
                        slug={tournament.slug}
                        board={m.board}
                        whiteName={m.white_id ? nameOf.get(m.white_id) ?? "Member" : "—"}
                        blackName={m.black_id ? nameOf.get(m.black_id) ?? "Member" : "bye"}
                        result={m.result}
                        pgn={m.pgn ?? null}
                        isBye={isBye}
                      />
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
          <SubmitButton className="btn secondary">
            Mark the tournament complete
          </SubmitButton>
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

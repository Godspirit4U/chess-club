import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeStandings, generateSwiss, type MatchRow } from "@/lib/pairings";
import {
  generateRound,
  publishRound,
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
        .select("id,round_id,board,white_id,black_id,result")
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

  const previous = (matches ?? []).filter((m) => m.round_id !== draftRound?.id) as MatchRow[];
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
            Generate round {(rounds?.length ?? 0) + 1}
          </button>
        </form>
      ) : null}

      {draftRound ? (
        <section style={{ marginTop: 28 }}>
          <h2>Round {draftRound.number}: draft pairings</h2>
          <p className="muted small">
            Nothing here is public yet. Check the boards, swap colours where needed, then
            publish.
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
              Publish round {draftRound.number}
            </button>
          </form>
        </section>
      ) : null}

      {(rounds ?? []).some((r) => r.published_at) ? (
        <section style={{ marginTop: 28 }}>
          <h2>Published rounds</h2>
          {(rounds ?? [])
            .filter((r) => r.published_at)
            .map((r) => {
              const rows = (matches ?? []).filter((m) => m.round_id === r.id);
              return (
                <div key={r.id} className="card" style={{ marginBottom: 12 }}>
                  <h3>Round {r.number}</h3>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {rows.map((m) => (
                      <li key={m.id} className="small">
                        {m.white_id ? nameOf.get(m.white_id) : "—"} vs{" "}
                        {m.black_id ? nameOf.get(m.black_id) : "bye"}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
        </section>
      ) : null}
    </>
  );
}

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createPuzzle } from "./actions";

export const metadata: Metadata = { title: "Puzzles" };
export const dynamic = "force-dynamic";

type Props = { searchParams: { error?: string } };

export default async function AdminPuzzlesPage({ searchParams }: Props) {
  const supabase = createClient();
  const { data: puzzles } = await supabase
    .from("puzzles")
    .select("id,puzzle_date,note")
    .order("puzzle_date", { ascending: false })
    .limit(30);

  return (
    <>
      <h1>Puzzles</h1>

      {searchParams.error ? (
        <p role="alert" style={{ color: "var(--danger)", fontSize: 14 }}>
          {searchParams.error}
        </p>
      ) : null}

      <form action={createPuzzle} className="card stack" style={{ marginTop: 16 }}>
        <div className="field">
          <label htmlFor="puzzle_date">Date</label>
          <input id="puzzle_date" name="puzzle_date" type="date" required />
        </div>
        <div className="field">
          <label htmlFor="fen">Position (FEN)</label>
          <input id="fen" name="fen" required placeholder="r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4" />
        </div>
        <div className="field">
          <label htmlFor="solution">Solution moves</label>
          <input id="solution" name="solution" required placeholder="Qxf7# (space separated if more than one move)" />
        </div>
        <div className="field">
          <label htmlFor="note">Note, optional</label>
          <input id="note" name="note" placeholder="Mate in one, from round 3" />
        </div>
        <button className="btn" type="submit">
          Add puzzle
        </button>
      </form>

      <section style={{ marginTop: 28 }}>
        <h2>Recent puzzles</h2>
        {(puzzles ?? []).length === 0 ? (
          <p className="empty">No puzzles yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {(puzzles ?? []).map((p) => (
                <tr key={p.id}>
                  <td>{p.puzzle_date}</td>
                  <td className="muted small">{p.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

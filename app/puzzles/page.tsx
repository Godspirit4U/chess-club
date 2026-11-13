import type { Metadata } from "next";
import Link from "next/link";
import { createClient, getCurrentProfile, isConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Puzzles",
  description: "A chess puzzle a day from the SaiU Chess Club, solved on the board."
};
export const dynamic = "force-dynamic";

export default async function PuzzlesPage() {
  const profile = await getCurrentProfile();
  const isAdmin = Boolean(profile && profile.role !== "member");
  let puzzles: { id: string; puzzle_date: string; note: string | null }[] = [];
  let solvedCount = 0;

  if (isConfigured) {
    const supabase = createClient();
    const { data } = await supabase
      .from("puzzles")
      .select("id,puzzle_date,note")
      .order("puzzle_date", { ascending: false })
      .limit(200);
    puzzles = data ?? [];

    if (profile) {
      const { count } = await supabase
        .from("puzzle_solves")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", profile.id);
      solvedCount = count ?? 0;
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const latest = puzzles.find((p) => p.puzzle_date === today) ?? puzzles[0] ?? null;

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
        <h1 style={{ margin: 0 }}>Puzzles</h1>
        {isAdmin ? (
          <Link className="btn" href="/puzzles/new">
            Add a puzzle
          </Link>
        ) : null}
      </div>


      {profile ? (
        <p className="small">
          You have solved <strong>{solvedCount}</strong>{" "}
          {solvedCount === 1 ? "puzzle" : "puzzles"} this season.
        </p>
      ) : (
        <p className="small muted">
          <Link href="/login">Sign in</Link> to have your solves counted.
        </p>
      )}

      {latest ? (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>Latest puzzle</h2>
          <p className="muted small">{latest.note ?? "Find the best move."}</p>
          <Link className="btn" href={`/puzzles/${latest.puzzle_date}`}>
            Open the puzzle
          </Link>
        </div>
      ) : null}

      {puzzles.length > 1 ? (
        <section style={{ marginTop: 28 }}>
          <h2>Earlier puzzles</h2>
          <ul style={{ paddingLeft: 18 }}>
            {puzzles.slice(1).map((p) => (
              <li key={p.id} className="small">
                <Link href={`/puzzles/${p.puzzle_date}`}>
                  {new Date(p.puzzle_date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long"
                  })}
                </Link>
                {p.note ? <span className="muted"> · {p.note}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

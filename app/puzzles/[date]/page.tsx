import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import PuzzleBoard from "@/components/PuzzleBoard";
import { deletePuzzle, recordSolve } from "@/app/admin/puzzles/actions";
import ConfirmButton from "@/components/ConfirmButton";

export const dynamic = "force-dynamic";

type Props = { params: { date: string } };

export const metadata: Metadata = { title: "Puzzle" };

export default async function PuzzlePage({ params }: Props) {
  const supabase = createClient();
  const { data: puzzle } = await supabase
    .from("puzzles")
    .select("id,puzzle_date,fen,solution,note")
    .eq("puzzle_date", params.date)
    .single();

  if (!puzzle) notFound();

  const profile = await getCurrentProfile();
  let alreadySolved = false;

  if (profile) {
    const { data: solve } = await supabase
      .from("puzzle_solves")
      .select("id")
      .eq("puzzle_id", puzzle.id)
      .eq("profile_id", profile.id)
      .maybeSingle();
    alreadySolved = Boolean(solve);
  }

  const { count: solverCount } = await supabase
    .from("puzzle_solves")
    .select("id", { count: "exact", head: true })
    .eq("puzzle_id", puzzle.id);

  const solution = puzzle.solution.trim().split(/\s+/);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <p className="small" style={{ margin: 0 }}>
          <Link href="/puzzles">Puzzles</Link>
        </p>
        {profile && profile.role !== "member" ? (
          <form action={deletePuzzle}>
            <input type="hidden" name="id" value={puzzle.id} />
            <ConfirmButton
              message="Delete this puzzle and every solve recorded for it?"
              style={{ minHeight: 28, color: "var(--danger)", fontSize: 13 }}
            >
              Delete puzzle
            </ConfirmButton>
          </form>
        ) : null}
      </div>
      <h1>
        {new Date(puzzle.puzzle_date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric"
        })}
      </h1>
      <p className="muted">{puzzle.note ?? "Find the best move for the side to play."}</p>

      <p className="small" style={{ marginTop: 12 }}>
        {solverCount ?? 0} {(solverCount ?? 0) === 1 ? "member has" : "members have"} solved this
        {" · "}
        <Link href={`/puzzles/${puzzle.puzzle_date}/solvers`}>See who solved this puzzle</Link>
      </p>

      <div style={{ marginTop: 12 }}>
        <PuzzleBoard
          fen={puzzle.fen}
          solution={solution}
          alreadySolved={alreadySolved}
          puzzleId={puzzle.id}
          date={puzzle.puzzle_date}
        />
      </div>

      {!profile ? (
        <p className="small" style={{ marginTop: 12 }}>
          <Link href="/login">Sign in</Link> so this solve counts towards your total.
        </p>
      ) : alreadySolved ? (
        <p className="small muted" style={{ marginTop: 12 }}>
          You have already solved this one.
        </p>
      ) : (
        <form action={recordSolve} style={{ marginTop: 12 }}>
          <input type="hidden" name="puzzle_id" value={puzzle.id} />
          <input type="hidden" name="date" value={puzzle.puzzle_date} />
          <button className="btn secondary" type="submit">
            I solved it
          </button>
        </form>
      )}
    </>
  );
}

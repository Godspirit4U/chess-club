import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";

export const metadata: Metadata = { title: "Who solved it" };
export const dynamic = "force-dynamic";

type Props = { params: { date: string } };

function clock(seconds: number | null) {
  if (!seconds || seconds < 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default async function SolversPage({ params }: Props) {
  const supabase = createClient();

  const { data: puzzle } = await supabase
    .from("puzzles")
    .select("id,puzzle_date")
    .eq("puzzle_date", params.date)
    .single();

  if (!puzzle) notFound();

  const { data: solves } = await supabase
    .from("puzzle_solves")
    .select("solved_at,seconds,profiles(id,full_name,avatar_path)")
    .eq("puzzle_id", puzzle.id)
    .order("solved_at", { ascending: true });

  const rows = solves ?? [];

  return (
    <>
      <p className="small">
        <Link href={`/puzzles/${puzzle.puzzle_date}`}>Puzzle</Link>
      </p>
      <h1>Who solved it</h1>
      <p className="muted small">
        {rows.length} {rows.length === 1 ? "member" : "members"} solved this puzzle
      </p>

      <div style={{ marginTop: 16 }}>
        {rows.map((row: any, index) => {
          const person = row.profiles;
          return (
            <div key={`${row.solved_at}-${index}`} className="person-row">
              <span
                className="small muted"
                style={{ width: 24, textAlign: "right", flexShrink: 0 }}
              >
                {index + 1}
              </span>

              <Avatar name={person?.full_name ?? "Member"} path={person?.avatar_path} size={34} />

              <span style={{ minWidth: 0 }}>
                <span className="person-name" style={{ display: "block" }}>
                  {person?.id ? (
                    <Link href={`/members/${person.id}`}>{person.full_name}</Link>
                  ) : (
                    "Member"
                  )}
                </span>
                <span className="person-meta" style={{ display: "block" }}>
                  {new Date(row.solved_at).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </span>

              <span className="person-actions small">
                {index === 0 ? <span className="badge">first</span> : null}
                <span className="muted">{clock(row.seconds)}</span>
              </span>
            </div>
          );
        })}

        {rows.length === 0 ? (
          <p className="muted small">Nobody has solved this one yet.</p>
        ) : null}
      </div>
    </>
  );
}

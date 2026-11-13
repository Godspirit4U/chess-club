import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/server";
import { createPuzzle } from "@/app/admin/puzzles/actions";
import SubmitButton from "@/components/SubmitButton";

export const metadata: Metadata = { title: "New puzzle" };
export const dynamic = "force-dynamic";

type Props = { searchParams: { error?: string } };

export default async function NewPuzzlePage({ searchParams }: Props) {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  if (me.role === "member") redirect("/puzzles");

  return (
    <>
      <p className="small">
        <Link href="/puzzles">Puzzles</Link>
      </p>
      <h1>New puzzle</h1>

      {searchParams.error ? (
        <p role="alert" style={{ color: "var(--danger)", fontSize: 14 }}>
          {searchParams.error}
        </p>
      ) : null}

      <form action={createPuzzle} className="card stack" style={{ marginTop: 16, maxWidth: 620 }}>
        <div className="field">
          <label htmlFor="puzzle_date">Date</label>
          <input id="puzzle_date" name="puzzle_date" type="date" required />
        </div>
        <div className="field">
          <label htmlFor="fen">Position (FEN)</label>
          <input id="fen" name="fen" required />
        </div>
        <div className="field">
          <label htmlFor="solution">Solution</label>
          <input id="solution" name="solution" placeholder="Qxf7+ Kxf7" required />
        </div>
        <div className="field">
          <label htmlFor="note">Note</label>
          <input id="note" name="note" placeholder="optional" />
        </div>
        <SubmitButton>Add puzzle</SubmitButton>
      </form>
    </>
  );
}

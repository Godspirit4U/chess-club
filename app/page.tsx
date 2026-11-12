import Link from "next/link";
import { createClient, isConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function loadHome() {
  if (!isConfigured) return { next: null, posts: [], puzzle: null };

  try {
    const supabase = createClient();

    const [{ data: tournaments }, { data: posts }, { data: puzzles }] = await Promise.all([
      supabase
        .from("tournaments")
        .select("slug,name,starts_at,status,format,rounds")
        .in("status", ["open", "running"])
        .order("starts_at", { ascending: true })
        .limit(1),
      supabase
        .from("posts")
        .select("slug,title,excerpt,published_at")
        .not("published_at", "is", null)
        .order("published_at", { ascending: false })
        .limit(3),
      supabase
        .from("puzzles")
        .select("id,puzzle_date,note")
        .order("puzzle_date", { ascending: false })
        .limit(1)
    ]);

    return {
      next: tournaments?.[0] ?? null,
      posts: posts ?? [],
      puzzle: puzzles?.[0] ?? null
    };
  } catch {
    return { next: null, posts: [], puzzle: null };
  }
}

export default async function HomePage() {
  const { next, posts, puzzle } = await loadHome();

  return (
    <>
      <section className="hero">
        <h1>The club, on one page.</h1>
        <p className="lede">
          Tournaments, pairings, the points table and a puzzle a day. Sign in with your
          college email and everything you need is here.
        </p>
      </section>

      <section className="grid two" aria-label="What is on now">
        <div className="card">
          <h2>Next tournament</h2>
          {next ? (
            <>
              <p className="badge live">{next.status === "running" ? "Running now" : "Registration open"}</p>
              <h3>
                <Link href={`/tournaments/${next.slug}`}>{next.name}</Link>
              </h3>
              <p className="muted small">
                {next.format.replace(/_/g, " ")} · {next.rounds} rounds
                {next.starts_at ? ` · starts ${new Date(next.starts_at).toDateString()}` : ""}
              </p>
            </>
          ) : (
            <p className="muted">
              Nothing scheduled yet. When an admin creates a tournament it appears here.
            </p>
          )}
        </div>

        <div className="card">
          <h2>Puzzle of the day</h2>
          {puzzle ? (
            <>
              <h3>
                <Link href={`/puzzles/${puzzle.puzzle_date}`}>Today&rsquo;s puzzle</Link>
              </h3>
              <p className="muted small">{puzzle.note ?? "Find the best move for the side to play."}</p>
            </>
          ) : (
            <p className="muted">
              No puzzle posted today. Puzzles appear here every morning once an admin
              adds one.
            </p>
          )}
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <h2 style={{ margin: 0 }}>From the club</h2>
            <Link href="/blog" className="small">
              All posts
            </Link>
          </div>

          {posts.length === 0 ? (
            <p className="empty">
              No posts yet. Announcements, recaps and tournament reports will appear here.
            </p>
          ) : (
            <div className="grid three">
              {posts.map((p) => (
                <article key={p.slug} className="card">
                  <p className="muted small">
                    {p.published_at ? new Date(p.published_at).toDateString() : ""}
                  </p>
                  <h3>
                    <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                  </h3>
                  {p.excerpt ? <p className="muted small">{p.excerpt}</p> : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

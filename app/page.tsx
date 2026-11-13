import Link from "next/link";
import { createClient, getCurrentProfile, isConfigured } from "@/lib/supabase/server";
import { club } from "@/lib/club";

export const dynamic = "force-dynamic";

async function loadHome() {
  if (!isConfigured) return { next: null, posts: [], puzzle: null, members: 0 };

  try {
    const supabase = createClient();

    const [{ data: tournaments }, { data: posts }, { data: puzzles }, { count }] =
      await Promise.all([
        supabase
          .from("tournaments")
          .select("slug,name,starts_at,status,format,rounds,registration_deadline")
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
          .limit(1),
        supabase.from("profiles").select("id", { count: "exact", head: true })
      ]);

    return {
      next: tournaments?.[0] ?? null,
      posts: posts ?? [],
      puzzle: puzzles?.[0] ?? null,
      members: count ?? 0
    };
  } catch {
    return { next: null, posts: [], puzzle: null, members: 0 };
  }
}

const labels: Record<string, string> = {
  swiss: "Swiss",
  round_robin: "Round robin",
  knockout: "Knockout",
  groups_knockout: "Groups then knockout",
  custom: "Custom"
};

export default async function HomePage() {
  const profile = await getCurrentProfile();
  const { next, posts, puzzle, members } = await loadHome();

  return (
    <>
      <section className="hero">
        <h1>{club.name}</h1>
        <p className="lede">{club.tagline}</p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
          {profile ? (
            <Link className="btn" href="/tournaments">
              See tournaments
            </Link>
          ) : (
            <Link className="btn" href="/login?mode=signup">
              Join the club
            </Link>
          )}
          <Link className="btn secondary" href="/about">
            About us
          </Link>
        </div>
      </section>

      <section className="grid two" aria-label="What is on now">
        <div className="card">
          <h2>Next tournament</h2>
          {next ? (
            <>
              <p className="badge live">
                {next.status === "running" ? "Running now" : "Registration open"}
              </p>
              <h3 style={{ marginTop: 6 }}>
                <Link href={`/tournaments/${next.slug}`}>{next.name}</Link>
              </h3>
              <p className="muted small" style={{ margin: 0 }}>
                {labels[next.format] ?? next.format} · {next.rounds} rounds
                {next.starts_at
                  ? ` · starts ${new Date(next.starts_at).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short"
                    })}`
                  : ""}
              </p>
            </>
          ) : (
            <p className="muted small" style={{ margin: 0 }}>
              No tournament open right now.
            </p>
          )}
        </div>

        <div className="card">
          <h2>Puzzle of the day</h2>
          {puzzle ? (
            <>
              <h3 style={{ marginTop: 6 }}>
                <Link href={`/puzzles/${puzzle.puzzle_date}`}>Today&rsquo;s puzzle</Link>
              </h3>
              <p className="muted small" style={{ margin: 0 }}>
                {puzzle.note ?? "Find the best move for the side to play."}
              </p>
            </>
          ) : (
            <p className="muted small" style={{ margin: 0 }}>
              No puzzle posted today.
            </p>
          )}
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>What we do</h2>
        <div className="grid three" style={{ marginTop: 12 }}>
          {club.activities.map((a) => (
            <div key={a.name} className="card">
              <h3 style={{ marginTop: 0 }}>{a.name}</h3>
              <p className="muted small" style={{ margin: 0 }}>
                {a.frequency}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12
          }}
        >
          <h2 style={{ margin: 0 }}>From the club</h2>
          <Link href="/blog" className="small">
            All posts
          </Link>
        </div>

        {posts.length > 0 ? (
          <div className="grid three" style={{ marginTop: 12 }}>
            {posts.map((p) => (
              <article key={p.slug} className="card">
                <p className="muted small" style={{ margin: 0 }}>
                  {p.published_at
                    ? new Date(p.published_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short"
                      })
                    : ""}
                </p>
                <h3 style={{ marginTop: 4 }}>
                  <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                </h3>
                {p.excerpt ? (
                  <p className="muted small" style={{ margin: 0 }}>
                    {p.excerpt}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section style={{ marginTop: 32 }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Joining</h2>
          <p className="muted small">{club.membership.eligibility}</p>
          <p className="muted small" style={{ marginBottom: 12 }}>
            {club.membership.joining}
          </p>
          {!profile ? (
            <Link className="btn" href="/login?mode=signup">
              Create your account
            </Link>
          ) : (
            <Link className="btn secondary" href="/profile">
              Your profile
            </Link>
          )}
        </div>
      </section>
    </>
  );
}

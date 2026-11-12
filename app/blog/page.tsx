import type { Metadata } from "next";
import Link from "next/link";
import { createClient, getCurrentProfile, isConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Blog",
  description: "Announcements, recaps and tournament reports from the SaiU Chess Club."
};
export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const profile = await getCurrentProfile();
  const isAdmin = Boolean(profile && profile.role !== "member");

  let posts: { slug: string; title: string; excerpt: string | null; published_at: string | null }[] = [];

  if (isConfigured) {
    const supabase = createClient();
    const { data } = await supabase
      .from("posts")
      .select("slug,title,excerpt,published_at")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false });
    posts = data ?? [];
  }

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
        <h1 style={{ margin: 0 }}>Blog</h1>
        {isAdmin ? (
          <Link className="btn" href="/admin/blog">
            Write a post
          </Link>
        ) : null}
      </div>
      <p className="muted">Announcements, recaps and reports, written by the committee.</p>

      {posts.length === 0 ? (
        <p className="empty">
          Nothing published yet. Announcements and tournament recaps will appear here.
        </p>
      ) : (
        <div className="stack" style={{ marginTop: 20 }}>
          {posts.map((p) => (
            <article key={p.slug} className="card">
              <p className="muted small" style={{ margin: 0 }}>
                {p.published_at
                  ? new Date(p.published_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })
                  : ""}
              </p>
              <h2 style={{ margin: "4px 0 6px" }}>
                <Link href={`/blog/${p.slug}`}>{p.title}</Link>
              </h2>
              {p.excerpt ? <p className="muted" style={{ margin: 0 }}>{p.excerpt}</p> : null}
            </article>
          ))}
        </div>
      )}
    </>
  );
}

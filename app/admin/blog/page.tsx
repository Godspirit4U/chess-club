import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createPost, deletePost } from "./actions";

export const metadata: Metadata = { title: "Blog" };
export const dynamic = "force-dynamic";

type Props = { searchParams: { error?: string } };

export default async function AdminBlogPage({ searchParams }: Props) {
  const supabase = createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id,slug,title,published_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <h1>Blog</h1>

      {searchParams.error ? (
        <p role="alert" style={{ color: "var(--danger)", fontSize: 14 }}>
          {searchParams.error}
        </p>
      ) : null}

      <form action={createPost} className="card stack" style={{ marginTop: 16 }}>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" required />
        </div>
        <div className="field">
          <label htmlFor="excerpt">One-line summary</label>
          <input id="excerpt" name="excerpt" placeholder="Shown on the home page card" />
        </div>
        <div className="field">
          <label htmlFor="body">Post</label>
          <textarea id="body" name="body" rows={10} required />
        </div>
        <label style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 400 }}>
          <input type="checkbox" name="publish" style={{ width: 18, minHeight: 18 }} defaultChecked />
          Publish now
        </label>
        <button className="btn" type="submit">
          Post
        </button>
      </form>

      <section style={{ marginTop: 28 }}>
        <h2>All posts</h2>
        {(posts ?? []).length === 0 ? (
          <p className="empty">No posts yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Edit</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(posts ?? []).map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                  </td>
                  <td className="muted small">{p.published_at ? "published" : "draft"}</td>
                  <td>
                    <Link href={`/admin/blog/${p.id}`}>Edit</Link>
                  </td>
                  <td>
                    <form action={deletePost}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="btn secondary" type="submit" style={{ minHeight: 34 }}>
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

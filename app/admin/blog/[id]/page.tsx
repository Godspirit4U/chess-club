import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePost } from "../actions";

export const metadata: Metadata = { title: "Edit post" };
export const dynamic = "force-dynamic";

type Props = { params: { id: string }; searchParams: { error?: string } };

export default async function EditPostPage({ params, searchParams }: Props) {
  const supabase = createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("id,slug,title,excerpt,body,published_at")
    .eq("id", params.id)
    .single();

  if (!post) notFound();

  return (
    <>
      <p className="small">
        <Link href="/admin/blog">Blog</Link>
      </p>
      <h1>Edit post</h1>

      {searchParams.error ? (
        <p role="alert" style={{ color: "var(--danger)", fontSize: 14 }}>
          {searchParams.error}
        </p>
      ) : null}

      <form action={updatePost} className="card stack" style={{ marginTop: 16 }}>
        <input type="hidden" name="id" value={post.id} />
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" defaultValue={post.title} required />
        </div>
        <div className="field">
          <label htmlFor="excerpt">One-line summary</label>
          <input id="excerpt" name="excerpt" defaultValue={post.excerpt ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="body">Post</label>
          <textarea id="body" name="body" rows={12} defaultValue={post.body} required />
        </div>
        <label style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 400 }}>
          <input
            type="checkbox"
            name="publish"
            defaultChecked={Boolean(post.published_at)}
            style={{ width: 18, minHeight: 18 }}
          />
          Published
        </label>
        <button className="btn" type="submit">
          Save changes
        </button>
      </form>
    </>
  );
}

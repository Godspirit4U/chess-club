import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/server";
import { createPost } from "@/app/admin/blog/actions";
import SubmitButton from "@/components/SubmitButton";

export const metadata: Metadata = { title: "New post" };
export const dynamic = "force-dynamic";

type Props = { searchParams: { error?: string } };

export default async function NewPostPage({ searchParams }: Props) {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  if (me.role === "member") redirect("/blog");

  return (
    <>
      <p className="small">
        <Link href="/blog">Blog</Link>
      </p>
      <h1>New post</h1>

      {searchParams.error ? (
        <p role="alert" style={{ color: "var(--danger)", fontSize: 14 }}>
          {searchParams.error}
        </p>
      ) : null}

      <form action={createPost} className="card stack" style={{ marginTop: 16, maxWidth: 680 }}>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" required />
        </div>
        <div className="field">
          <label htmlFor="excerpt">One-line summary</label>
          <input id="excerpt" name="excerpt" />
        </div>
        <div className="field">
          <label htmlFor="body">Post</label>
          <textarea id="body" name="body" rows={12} required />
        </div>
        <label style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 400 }}>
          <input type="checkbox" name="publish" defaultChecked style={{ width: 18, minHeight: 18 }} />
          Publish now
        </label>
        <SubmitButton>Create post</SubmitButton>
      </form>
    </>
  );
}

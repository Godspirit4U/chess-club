import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, getCurrentProfile, isConfigured } from "@/lib/supabase/server";
import ConfirmButton from "@/components/ConfirmButton";
import { deletePost } from "@/app/admin/blog/actions";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

async function loadPost(slug: string) {
  if (!isConfigured) return null;
  const supabase = createClient();
  const { data } = await supabase
    .from("posts")
    .select("id,slug,title,excerpt,body,published_at,profiles(full_name)")
    .eq("slug", slug)
    .not("published_at", "is", null)
    .single();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await loadPost(params.slug);
  return { title: post?.title ?? "Post", description: post?.excerpt ?? undefined };
}

export default async function PostPage({ params }: Props) {
  const post = await loadPost(params.slug);
  if (!post) notFound();

  const me = await getCurrentProfile();
  const isAdmin = Boolean(me && me.role !== "member");

  const author = (post as any).profiles?.full_name;

  return (
    <article style={{ maxWidth: 680 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <p className="small" style={{ margin: 0 }}>
          <Link href="/blog">Blog</Link>
        </p>
        {isAdmin && post?.id ? (
          <p className="small" style={{ margin: 0, display: "flex", gap: 12, alignItems: "center" }}>
            <Link href={`/admin/blog/${post.id}`}>Edit</Link>
            <form action={deletePost}>
              <input type="hidden" name="id" value={post.id} />
              <input type="hidden" name="return_to" value="/blog" />
              <ConfirmButton
                message="Delete this post?"
                style={{ minHeight: 28, color: "var(--danger)", fontSize: 13 }}
              >
                Delete
              </ConfirmButton>
            </form>
          </p>
        ) : null}
      </div>
      <h1>{post.title}</h1>
      <p className="muted small">
        {post.published_at
          ? new Date(post.published_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric"
            })
          : ""}
        {author ? ` · ${author}` : ""}
      </p>
      <div style={{ whiteSpace: "pre-wrap", marginTop: 20 }}>{post.body}</div>
    </article>
  );
}

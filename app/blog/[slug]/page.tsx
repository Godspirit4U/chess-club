import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, isConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

async function loadPost(slug: string) {
  if (!isConfigured) return null;
  const supabase = createClient();
  const { data } = await supabase
    .from("posts")
    .select("slug,title,excerpt,body,published_at,profiles(full_name)")
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

  const author = (post as any).profiles?.full_name;

  return (
    <article style={{ maxWidth: 680 }}>
      <p className="small">
        <Link href="/blog">Blog</Link>
      </p>
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

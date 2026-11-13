"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base ? `${base}-${Math.random().toString(36).slice(2, 5)}` : `post-${Date.now()}`;
}

export async function createPost(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "member") redirect("/");

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title || !body) {
    redirect(`/admin/blog?error=${encodeURIComponent("A post needs a title and some text.")}`);
  }

  const publish = formData.get("publish") === "on";
  const supabase = createClient();

  const { error } = await supabase.from("posts").insert({
    slug: slugify(title),
    title,
    excerpt: String(formData.get("excerpt") ?? "").trim() || body.slice(0, 160),
    body,
    author_id: profile.id,
    published_at: publish ? new Date().toISOString() : null
  });

  if (error) {
    redirect(`/admin/blog?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/blog");
  revalidatePath("/");
  redirect("/admin/blog");
}

export async function deletePost(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "member") redirect("/");

  const id = String(formData.get("id") ?? "");
  const supabase = createClient();
  await supabase.from("posts").delete().eq("id", id);

  revalidatePath("/blog");
  revalidatePath("/");
  redirect("/admin/blog");
}

export async function updatePost(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "member") redirect("/");

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title || !body) {
    redirect(`/admin/blog/${id}?error=${encodeURIComponent("A title and some text are needed.")}`);
  }

  const supabase = createClient();
  await supabase
    .from("posts")
    .update({
      title,
      body,
      excerpt: String(formData.get("excerpt") ?? "").trim() || body.slice(0, 160),
      published_at: formData.get("publish") === "on" ? new Date().toISOString() : null
    })
    .eq("id", id);

  revalidatePath("/blog");
  revalidatePath("/");
  redirect("/admin/blog");
}

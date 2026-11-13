"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";

export async function createEvent(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "member") redirect("/");

  const title = String(formData.get("title") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "").trim();

  if (!title || !startsAt) {
    redirect(`/admin/events?error=${encodeURIComponent("A title and a start time are needed.")}`);
  }

  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) {
    redirect(`/admin/events?error=${encodeURIComponent("That start time is not a date.")}`);
  }

  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50)}-${Math.random().toString(36).slice(2, 5)}`;

  const supabase = createClient();
  const { error } = await supabase.from("events").insert({
    slug,
    title,
    description: String(formData.get("description") ?? "").trim() || null,
    kind: String(formData.get("kind") ?? "other"),
    format: String(formData.get("format") ?? "").trim() || null,
    cover_path: String(formData.get("cover_path") ?? "").trim() || null,
    starts_at: date.toISOString(),
    location: String(formData.get("location") ?? "").trim() || null,
    created_by: profile.id
  });

  if (error) {
    redirect(`/admin/events?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/events");
  redirect("/admin/events");
}

export async function deleteEvent(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "member") redirect("/");

  const id = String(formData.get("id") ?? "");
  const supabase = createClient();
  await supabase.from("events").delete().eq("id", id);

  revalidatePath("/events");
  redirect("/admin/events");
}

export async function updateEvent(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "member") redirect("/");

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "").trim();

  if (!title || !startsAt) {
    redirect(`/admin/events/${id}?error=${encodeURIComponent("A title and a start time are needed.")}`);
  }

  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) {
    redirect(`/admin/events/${id}?error=${encodeURIComponent("That start time is not a date.")}`);
  }

  const supabase = createClient();
  await supabase
    .from("events")
    .update({
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      kind: String(formData.get("kind") ?? "other"),
      format: String(formData.get("format") ?? "").trim() || null,
      starts_at: date.toISOString(),
      location: String(formData.get("location") ?? "").trim() || null,
      cover_path: String(formData.get("cover_path") ?? "").trim() || null
    })
    .eq("id", id);

  revalidatePath("/events");
  redirect("/admin/events");
}

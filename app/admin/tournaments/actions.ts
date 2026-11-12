"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";

function makeSlug(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 6);
  return base ? `${base}-${suffix}` : `tournament-${suffix}`;
}

function toIso(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function createTournament(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "member") redirect("/");

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    redirect(`/admin/tournaments/new?error=${encodeURIComponent("A tournament needs a name.")}`);
  }

  const publish = formData.get("publish") === "on";
  const supabase = createClient();

  const { data, error } = await supabase
    .from("tournaments")
    .insert({
      slug: makeSlug(name),
      name,
      description: String(formData.get("description") ?? "").trim() || null,
      format: String(formData.get("format") ?? "swiss"),
      rounds: Number(formData.get("rounds") ?? 5),
      time_control: String(formData.get("time_control") ?? "").trim() || "10+5",
      rules: String(formData.get("rules") ?? "").trim() || null,
      structure: String(formData.get("structure") ?? "").trim() || null,
      starts_at: toIso(formData.get("starts_at")),
      registration_deadline: toIso(formData.get("registration_deadline")),
      status: publish ? "open" : "draft",
      created_by: profile.id
    })
    .select("slug")
    .single();

  if (error) {
    redirect(`/admin/tournaments/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/tournaments");
  revalidatePath("/admin");
  redirect(`/tournaments/${data!.slug}`);
}

export async function registerForTournament(formData: FormData) {
  const tournamentId = String(formData.get("tournament_id") ?? "");
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");

  const supabase = createClient();
  await supabase
    .from("tournament_players")
    .upsert(
      { tournament_id: tournamentId, profile_id: profile.id, withdrawn_at: null },
      { onConflict: "tournament_id,profile_id" }
    );

  revalidatePath(`/tournaments`);
  redirect(`/tournaments/${String(formData.get("slug") ?? "")}`);
}

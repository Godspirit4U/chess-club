"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";

export async function sendRequest(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const to = String(formData.get("addressee_id") ?? "");
  if (to === profile.id) redirect("/community/people");

  const supabase = createClient();
  await supabase.from("connections").upsert(
    { requester_id: profile.id, addressee_id: to, status: "pending" },
    { onConflict: "requester_id,addressee_id", ignoreDuplicates: true }
  );

  revalidatePath("/community/people");
  redirect("/community/people");
}

export async function respondRequest(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "accepted");

  if (!["accepted", "declined"].includes(decision)) redirect("/community/people");

  const supabase = createClient();
  await supabase
    .from("connections")
    .update({ status: decision as "accepted" | "declined", responded_at: new Date().toISOString() })
    .eq("id", id)
    .eq("addressee_id", profile.id);

  revalidatePath("/community/people");
  revalidatePath("/community");
  redirect("/community/people");
}

export async function removeConnection(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const supabase = createClient();

  await supabase.from("connections").delete().eq("id", id);

  revalidatePath("/community/people");
  revalidatePath("/community");
  redirect("/community/people");
}

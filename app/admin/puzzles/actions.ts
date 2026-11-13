"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";

export async function createPuzzle(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "member") redirect("/");

  const date = String(formData.get("puzzle_date") ?? "").trim();
  const fen = String(formData.get("fen") ?? "").trim();
  const solution = String(formData.get("solution") ?? "").trim();

  if (!date || !fen || !solution) {
    redirect(`/admin/puzzles?error=${encodeURIComponent("Date, position and solution are all needed.")}`);
  }

  const supabase = createClient();
  const { error } = await supabase.from("puzzles").insert({
    puzzle_date: date,
    fen,
    solution,
    side_to_move: fen.split(" ")[1] ?? "w",
    note: String(formData.get("note") ?? "").trim() || null,
    created_by: profile.id
  });

  if (error) {
    redirect(`/admin/puzzles?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/puzzles");
  revalidatePath("/");
  redirect("/admin/puzzles");
}

export async function recordSolve(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const puzzleId = String(formData.get("puzzle_id") ?? "");
  const seconds = Number(formData.get("seconds") ?? 0) || null;
  const supabase = createClient();

  await supabase
    .from("puzzle_solves")
    .upsert(
      { puzzle_id: puzzleId, profile_id: profile.id, seconds },
      { onConflict: "puzzle_id,profile_id", ignoreDuplicates: true }
    );

  revalidatePath("/puzzles");
  redirect(`/puzzles/${String(formData.get("date") ?? "")}`);
}

export async function deletePuzzle(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "member") redirect("/");

  const id = String(formData.get("id") ?? "");
  const supabase = createClient();
  await supabase.from("puzzles").delete().eq("id", id);

  revalidatePath("/puzzles");
  redirect("/admin/puzzles");
}

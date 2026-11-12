"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { computeStandings, generateSwiss, type MatchRow } from "@/lib/pairings";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "member") redirect("/");
  return profile;
}

export async function startTournament(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("tournament_id") ?? "");
  const slug = String(formData.get("slug") ?? "");

  const supabase = createClient();
  await supabase.from("tournaments").update({ status: "running" }).eq("id", id);

  revalidatePath(`/admin/tournaments/${slug}/console`);
  revalidatePath(`/tournaments/${slug}`);
  redirect(`/admin/tournaments/${slug}/console`);
}

export async function generateRound(formData: FormData) {
  await requireAdmin();

  const tournamentId = String(formData.get("tournament_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const supabase = createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id,rounds,points_win,points_draw,points_loss")
    .eq("id", tournamentId)
    .single();

  if (!tournament) redirect(`/admin/tournaments/${slug}/console`);

  const { data: players } = await supabase
    .from("tournament_players")
    .select("profile_id,profiles(full_name)")
    .eq("tournament_id", tournamentId)
    .is("withdrawn_at", null);

  const { data: rounds } = await supabase
    .from("rounds")
    .select("id,number")
    .eq("tournament_id", tournamentId)
    .order("number", { ascending: true });

  const nextNumber = (rounds?.length ?? 0) + 1;

  if (nextNumber > tournament.rounds) {
    redirect(`/admin/tournaments/${slug}/console?error=${encodeURIComponent("All rounds have been generated.")}`);
  }

  const roundIds = (rounds ?? []).map((r) => r.id);
  const { data: previous } = roundIds.length
    ? await supabase
        .from("matches")
        .select("white_id,black_id,result")
        .in("round_id", roundIds)
    : { data: [] as MatchRow[] };

  const standings = computeStandings(
    (players ?? []).map((p: any) => ({
      profileId: p.profile_id,
      name: p.profiles?.full_name ?? "Member"
    })),
    (previous as MatchRow[]) ?? [],
    {
      win: Number(tournament.points_win),
      draw: Number(tournament.points_draw),
      loss: Number(tournament.points_loss)
    }
  );

  if (standings.length < 2) {
    redirect(`/admin/tournaments/${slug}/console?error=${encodeURIComponent("At least two players are needed.")}`);
  }

  const draft = generateSwiss(standings, (previous as MatchRow[]) ?? []);

  const { data: round, error } = await supabase
    .from("rounds")
    .insert({ tournament_id: tournamentId, number: nextNumber })
    .select("id")
    .single();

  if (error || !round) {
    redirect(`/admin/tournaments/${slug}/console?error=${encodeURIComponent(error?.message ?? "Could not create the round.")}`);
  }

  const rows = draft.boards.map((b) => ({
    tournament_id: tournamentId,
    round_id: round!.id,
    board: b.board,
    white_id: b.white,
    black_id: b.black,
    result: "unplayed" as const
  }));

  if (draft.bye) {
    rows.push({
      tournament_id: tournamentId,
      round_id: round!.id,
      board: draft.boards.length + 1,
      white_id: draft.bye,
      black_id: null as unknown as string,
      result: "unplayed" as const
    });
  }

  await supabase.from("matches").insert(rows);

  revalidatePath(`/admin/tournaments/${slug}/console`);
  redirect(`/admin/tournaments/${slug}/console`);
}

export async function swapColours(formData: FormData) {
  await requireAdmin();
  const matchId = String(formData.get("match_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const white = String(formData.get("white_id") ?? "");
  const black = String(formData.get("black_id") ?? "");

  if (white && black) {
    const supabase = createClient();
    await supabase
      .from("matches")
      .update({ white_id: black, black_id: white })
      .eq("id", matchId);
  }

  revalidatePath(`/admin/tournaments/${slug}/console`);
  redirect(`/admin/tournaments/${slug}/console`);
}

export async function publishRound(formData: FormData) {
  await requireAdmin();
  const roundId = String(formData.get("round_id") ?? "");
  const slug = String(formData.get("slug") ?? "");

  const supabase = createClient();
  await supabase
    .from("rounds")
    .update({ published_at: new Date().toISOString() })
    .eq("id", roundId);

  revalidatePath(`/admin/tournaments/${slug}/console`);
  revalidatePath(`/tournaments/${slug}`);
  redirect(`/admin/tournaments/${slug}/console`);
}

export async function saveResult(formData: FormData) {
  await requireAdmin();

  const matchId = String(formData.get("match_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const result = String(formData.get("result") ?? "unplayed");
  const pgn = String(formData.get("pgn") ?? "").trim();

  const allowed = ["white", "black", "draw", "bye", "forfeit_white", "forfeit_black", "unplayed"];
  if (!allowed.includes(result)) redirect(`/admin/tournaments/${slug}/console`);

  const supabase = createClient();
  await supabase
    .from("matches")
    .update({
      result,
      pgn: pgn || null,
      ended_at: result === "unplayed" ? null : new Date().toISOString()
    })
    .eq("id", matchId);

  revalidatePath(`/admin/tournaments/${slug}/console`);
  revalidatePath(`/tournaments/${slug}`);
  redirect(`/admin/tournaments/${slug}/console`);
}

export async function completeTournament(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("tournament_id") ?? "");
  const slug = String(formData.get("slug") ?? "");

  const supabase = createClient();
  await supabase.from("tournaments").update({ status: "completed" }).eq("id", id);

  revalidatePath("/tournaments");
  revalidatePath(`/tournaments/${slug}`);
  redirect(`/tournaments/${slug}`);
}

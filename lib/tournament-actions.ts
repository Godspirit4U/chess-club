"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { computeStandings, generateRoundRobin, generateSwiss, type MatchRow } from "@/lib/pairings";
import { resolveBracket } from "@/lib/playoff";

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

  revalidatePath(`/tournaments/${slug}/console`);
  revalidatePath(`/tournaments/${slug}`);
  redirect(`/tournaments/${slug}/console`);
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

  if (!tournament) redirect(`/tournaments/${slug}/console`);

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
    redirect(`/tournaments/${slug}/console?error=${encodeURIComponent("All rounds have been generated.")}`);
  }

  const roundIds = (rounds ?? []).map((r) => r.id);
  const roundNumber = new Map((rounds ?? []).map((r) => [r.id, r.number]));

  const { data: rawPrevious } = roundIds.length
    ? await supabase
        .from("matches")
        .select("white_id,black_id,result,round_id")
        .in("round_id", roundIds)
    : { data: [] as any[] };

  const previous = ((rawPrevious ?? []) as any[]).map((m) => ({
    white_id: m.white_id,
    black_id: m.black_id,
    result: m.result,
    round: roundNumber.get(m.round_id) ?? 0
  })) as MatchRow[];

  const standings = computeStandings(
    (players ?? []).map((p: any) => ({
      profileId: p.profile_id,
      name: p.profiles?.full_name ?? "Member"
    })),
    previous,
    {
      win: Number(tournament.points_win),
      draw: Number(tournament.points_draw),
      loss: Number(tournament.points_loss)
    }
  );

  if (standings.length < 2) {
    redirect(`/tournaments/${slug}/console?error=${encodeURIComponent("At least two players are needed.")}`);
  }

  const mode = String(formData.get("pairing_format") ?? "swiss");
  const requestedBye = String(formData.get("bye_player") ?? "");

  const draft = generateSwiss(standings, previous);

  // If the admin named someone for the bye, swap them into it.
  if (requestedBye) {
    if (draft.bye && draft.bye !== requestedBye) {
      for (const b of draft.boards) {
        if (b.white === requestedBye) {
          b.white = draft.bye;
          draft.bye = requestedBye;
          break;
        }
        if (b.black === requestedBye) {
          b.black = draft.bye;
          draft.bye = requestedBye;
          break;
        }
      }
    } else if (!draft.bye) {
      // Even number of players: remove them from their board and make it a bye.
      for (const b of draft.boards) {
        if (b.white === requestedBye) {
          b.white = null;
          b.black = null;
          draft.bye = requestedBye;
          break;
        }
        if (b.black === requestedBye) {
          b.white = null;
          b.black = null;
          draft.bye = requestedBye;
          break;
        }
      }
      draft.boards = draft.boards.filter((b) => b.white && b.black);
      draft.boards = draft.boards.map((b, i) => ({ ...b, board: i + 1 }));
    }
  }

  // Random mode keeps the same players and colours but ignores the score order.
  if (mode === "random") {
    const shuffled = [...draft.boards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    draft.boards = shuffled.map((b, index) => ({ ...b, board: index + 1 }));
  }

  const { data: round, error } = await supabase
    .from("rounds")
    .insert({ tournament_id: tournamentId, number: nextNumber })
    .select("id")
    .single();

  if (error || !round) {
    redirect(`/tournaments/${slug}/console?error=${encodeURIComponent(error?.message ?? "Could not create the round.")}`);
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

  revalidatePath(`/tournaments/${slug}/console`);
  redirect(`/tournaments/${slug}/console`);
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

  revalidatePath(`/tournaments/${slug}/console`);
  redirect(`/tournaments/${slug}/console`);
}

/** Deletes the current draft and builds a fresh one with new settings. */
export async function regenerateRound(formData: FormData) {
  await requireAdmin();

  const tournamentId = String(formData.get("tournament_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const roundId = String(formData.get("round_id") ?? "");

  const supabase = createClient();

  // Only an unpublished round may be regenerated.
  const { data: round } = await supabase
    .from("rounds")
    .select("id,published_at")
    .eq("id", roundId)
    .single();

  if (!round || round.published_at) {
    redirect(`/tournaments/${slug}/console?error=${encodeURIComponent("That round is already published.")}`);
  }

  await supabase.from("rounds").delete().eq("id", roundId);

  const forwarded = new FormData();
  forwarded.set("tournament_id", tournamentId);
  forwarded.set("slug", slug);
  forwarded.set("pairing_format", String(formData.get("pairing_format") ?? "swiss"));
  forwarded.set("bye_player", String(formData.get("bye_player") ?? ""));

  return generateRound(forwarded);
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

  revalidatePath(`/tournaments/${slug}/console`);
  revalidatePath(`/tournaments/${slug}`);
  redirect(`/tournaments/${slug}/console`);
}

export async function saveResult(formData: FormData) {
  await requireAdmin();

  const matchId = String(formData.get("match_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const tournamentId = String(formData.get("tournament_id") ?? "");
  const result = String(formData.get("result") ?? "unplayed");
  const pgn = String(formData.get("pgn") ?? "").trim();

  const allowed = ["white", "black", "draw", "bye", "forfeit_white", "forfeit_black", "unplayed"];
  if (!allowed.includes(result)) redirect(`/tournaments/${slug}/console`);

  const supabase = createClient();
  await supabase
    .from("matches")
    .update({
      result,
      pgn: pgn || null,
      ended_at: result === "unplayed" ? null : new Date().toISOString()
    })
    .eq("id", matchId);

  revalidatePath(`/tournaments/${slug}/console`);
  // Advance the playoff bracket when a result is recorded.
  const { data: playoff } = await supabase
    .from("matches")
    .select("id,slot,white_id,black_id,result,pgn")
    .eq("tournament_id", tournamentId)
    .eq("stage", "playoff");

  if (playoff && playoff.length > 0) {
    for (const update of resolveBracket(playoff as any)) {
      await supabase
        .from("matches")
        .update({ white_id: update.white_id, black_id: update.black_id })
        .eq("id", update.id);
    }
  }

  revalidatePath(`/tournaments/${slug}`);
  redirect(`/tournaments/${slug}/console`);
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

export async function deleteTournament(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "member") redirect("/");

  const id = String(formData.get("tournament_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const confirmed = formData.get("confirm") === "on";

  if (!confirmed) {
    redirect(
      `/tournaments/${slug}/console?error=${encodeURIComponent(
        "Tick the box to confirm deleting this tournament."
      )}`
    );
  }

  const supabase = createClient();
  await supabase.from("tournaments").delete().eq("id", id);

  revalidatePath("/tournaments");
  revalidatePath("/admin");
  redirect("/tournaments");
}

/** Removes a published round and its pairings, so it can be generated again. */
export async function deleteRound(formData: FormData) {
  await requireAdmin();

  const roundId = String(formData.get("round_id") ?? "");
  const slug = String(formData.get("slug") ?? "");

  const supabase = createClient();
  await supabase.from("rounds").delete().eq("id", roundId);

  revalidatePath(`/tournaments/${slug}`);
  revalidatePath(`/tournaments/${slug}/console`);
  redirect(`/tournaments/${slug}/console`);
}

export async function updateTournament(formData: FormData) {
  const me = await getCurrentProfile();
  if (!me || me.role === "member") redirect("/");

  const id = String(formData.get("id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "");
  const deadline = String(formData.get("registration_deadline") ?? "");

  const back = (msg: string) =>
    `/tournaments/${slug}/edit?error=${encodeURIComponent(msg)}`;

  if (!name) redirect(back("A name is required."));

  const supabase = createClient();
  await supabase
    .from("tournaments")
    .update({
      name,
      description: String(formData.get("description") ?? "").trim() || null,
      format: String(formData.get("format") ?? "swiss"),
      rounds: Number(formData.get("rounds") ?? 5),
      time_control: String(formData.get("time_control") ?? "").trim() || null,
      rules: String(formData.get("rules") ?? "").trim() || null,
      structure: String(formData.get("structure") ?? "").trim() || null,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      registration_deadline: deadline ? new Date(deadline).toISOString() : null
    })
    .eq("id", id);

  revalidatePath(`/tournaments/${slug}`);
  redirect(`/tournaments/${slug}`);
}

/** Registers chosen members directly, without them clicking anything. */
export async function addPlayersToTournament(formData: FormData) {
  const me = await getCurrentProfile();
  if (!me || me.role === "member") redirect("/");

  const tournamentId = String(formData.get("tournament_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const ids = formData.getAll("profile_ids").map(String).filter(Boolean);

  if (ids.length === 0) {
    redirect(`/tournaments/${slug}/add-players?error=${encodeURIComponent("Nobody was selected.")}`);
  }

  const supabase = createClient();

  await supabase.from("tournament_players").upsert(
    ids.map((id) => ({ tournament_id: tournamentId, profile_id: id })),
    { onConflict: "tournament_id,profile_id", ignoreDuplicates: true }
  );

  revalidatePath(`/tournaments/${slug}`);
  redirect(`/tournaments/${slug}?added=${ids.length}`);
}

/** Builds the four-player playoff bracket from the current standings. */
export async function createPlayoff(formData: FormData) {
  const me = await getCurrentProfile();
  if (!me || me.role === "member") redirect("/");

  const tournamentId = String(formData.get("tournament_id") ?? "");
  const slug = String(formData.get("slug") ?? "");

  const supabase = createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id,slug,rounds,points_win,points_draw,points_loss")
    .eq("id", tournamentId)
    .single();

  if (!tournament) redirect(`/tournaments/${slug}`);

  const { data: players } = await supabase
    .from("tournament_players")
    .select("profile_id,withdrawn_at,profiles(full_name)")
    .eq("tournament_id", tournamentId)
    .is("withdrawn_at", null);

  const { data: matches } = await supabase
    .from("matches")
    .select("id,round_id,board,white_id,black_id,result,rounds(number)")
    .eq("tournament_id", tournamentId);

  const standings = computeStandings(
    (players ?? []).map((p: any) => ({
      profileId: p.profile_id,
      name: p.profiles?.full_name ?? "Member"
    })),
    (matches ?? []).map((m: any) => ({
      white_id: m.white_id,
      black_id: m.black_id,
      result: m.result,
      round: m.rounds?.number ?? 0
    })) as MatchRow[],
    {
      win: Number(tournament.points_win),
      draw: Number(tournament.points_draw),
      loss: Number(tournament.points_loss)
    }
  );

  if (standings.length < 4) {
    redirect(`/tournaments/${slug}/console?error=${encodeURIComponent("At least four players are needed.")}`);
  }

  const [first, second, third, fourth] = standings;

  const { error } = await supabase.from("matches").insert([
    {
      tournament_id: tournamentId,
      round_id: null,
      board: 1,
      stage: "playoff",
      slot: "M1",
      white_id: first.profileId,
      black_id: second.profileId,
      result: "unplayed"
    },
    {
      tournament_id: tournamentId,
      round_id: null,
      board: 2,
      stage: "playoff",
      slot: "M2",
      white_id: third.profileId,
      black_id: fourth.profileId,
      result: "unplayed"
    },
    {
      tournament_id: tournamentId,
      round_id: null,
      board: 3,
      stage: "playoff",
      slot: "M3",
      white_source: "loser:M1",
      black_source: "winner:M2",
      result: "unplayed"
    },
    {
      tournament_id: tournamentId,
      round_id: null,
      board: 4,
      stage: "playoff",
      slot: "F",
      white_source: "winner:M1",
      black_source: "winner:M3",
      result: "unplayed"
    }
  ]);

  if (error) {
    redirect(`/tournaments/${slug}/console?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/tournaments/${slug}`);
  redirect(`/tournaments/${slug}/console`);
}

/** Builds a round-robin schedule where each player plays a set number of games. */
export async function createRoundRobin(formData: FormData) {
  const me = await getCurrentProfile();
  if (!me || me.role === "member") redirect("/");

  const tournamentId = String(formData.get("tournament_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const gamesEach = Math.max(1, Math.min(11, Number(formData.get("games_each") ?? 3)));

  const supabase = createClient();

  const { data: players } = await supabase
    .from("tournament_players")
    .select("profile_id")
    .eq("tournament_id", tournamentId)
    .is("withdrawn_at", null);

  const ids = (players ?? []).map((p: any) => p.profile_id);

  if (ids.length < 2) {
    redirect(`/tournaments/${slug}/console?error=${encodeURIComponent("At least two players are needed.")}`);
  }

  const { data: existing } = await supabase
    .from("rounds")
    .select("number")
    .eq("tournament_id", tournamentId)
    .order("number", { ascending: false })
    .limit(1);

  const startAt = (existing?.[0]?.number ?? 0) + 1;

  const schedule = generateRoundRobin(ids, gamesEach);

  for (let i = 0; i < schedule.length; i++) {
    const { data: round, error } = await supabase
      .from("rounds")
      .insert({
        tournament_id: tournamentId,
        number: startAt + i,
        published_at: new Date().toISOString()
      })
      .select("id")
      .single();

    if (error || !round) {
      redirect(`/tournaments/${slug}/console?error=${encodeURIComponent(error?.message ?? "Could not create the round.")}`);
    }

    const rows = schedule[i].map((b) => ({
      tournament_id: tournamentId,
      round_id: round!.id,
      board: b.board,
      white_id: b.white,
      black_id: b.black,
      result: "unplayed" as const
    }));

    if (rows.length > 0) {
      await supabase.from("matches").insert(rows);
    }
  }

  await supabase.from("tournaments").update({ status: "running" }).eq("id", tournamentId);

  revalidatePath(`/tournaments/${slug}`);
  revalidatePath(`/tournaments/${slug}/console`);
  redirect(`/tournaments/${slug}/console`);
}

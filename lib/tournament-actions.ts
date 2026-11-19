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

  const { data: existingPlayoff } = await supabase
    .from("matches")
    .select("id")
    .eq("tournament_id", tournamentId)
    .eq("stage", "playoff")
    .limit(1);

  if (existingPlayoff && existingPlayoff.length > 0) {
    redirect(`/tournaments/${slug}/console?error=${encodeURIComponent("A playoff already exists for this tournament.")}`);
  }

  const source = String(formData.get("source") ?? "table");
  const sourceRoundId = String(formData.get("source_round") ?? "");

  let seeded = standings;

  if (source === "round" && sourceRoundId) {
    const { data: roundMatches } = await supabase
      .from("matches")
      .select("white_id,black_id,result")
      .eq("round_id", sourceRoundId);

    const winners = new Set<string>();
    for (const m of roundMatches ?? []) {
      if (m.result === "white" || m.result === "forfeit_black") winners.add(m.white_id as string);
      else if (m.result === "black" || m.result === "forfeit_white") winners.add(m.black_id as string);
    }

    const ranked = standings.filter((s) => winners.has(s.profileId));

    if (ranked.length < 4) {
      redirect(
        `/tournaments/${slug}/console?error=${encodeURIComponent(
          `That round has ${ranked.length} winners with a result. Four are needed.`
        )}`
      );
    }

    seeded = ranked;
  }

  const [first, second, third, fourth] = seeded;

  const { error } = await supabase.from("matches").insert([
    {
      tournament_id: tournamentId,
      round_id: null,
      board: 1,
      stage: "playoff",
      slot: "SF1",
      white_id: first.profileId,
      black_id: second.profileId,
      result: "unplayed"
    },
    {
      tournament_id: tournamentId,
      round_id: null,
      board: 2,
      stage: "playoff",
      slot: "ELIM",
      white_id: third.profileId,
      black_id: fourth.profileId,
      result: "unplayed"
    },
    {
      tournament_id: tournamentId,
      round_id: null,
      board: 3,
      stage: "playoff",
      slot: "SF2",
      white_source: "loser:SF1",
      black_source: "winner:ELIM",
      result: "unplayed"
    },
    {
      tournament_id: tournamentId,
      round_id: null,
      board: 4,
      stage: "playoff",
      slot: "GF",
      white_source: "winner:SF1",
      black_source: "winner:SF2",
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
        published_at: null
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

/** Creates a draft round from pairings typed or pasted by the admin. */
export async function createCustomRound(formData: FormData) {
  const me = await getCurrentProfile();
  if (!me || me.role === "member") redirect("/");

  const tournamentId = String(formData.get("tournament_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const text = String(formData.get("pairings") ?? "");

  const supabase = createClient();

  const { data: players } = await supabase
    .from("tournament_players")
    .select("profile_id,withdrawn_at,profiles(full_name)")
    .eq("tournament_id", tournamentId)
    .is("withdrawn_at", null);

  const roster = (players ?? []).map((p: any) => ({
    id: p.profile_id as string,
    name: (p.profiles?.full_name ?? (p.profiles as any)?.[0]?.full_name ?? "Member") as string
  }));

  const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

  /** Levenshtein distance, for names that are close but not identical. */
  function distance(a: string, b: string) {
    const rows = a.length + 1;
    const cols = b.length + 1;
    const grid: number[][] = Array.from({ length: rows }, (_, i) =>
      Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );

    for (let i = 1; i < rows; i++) {
      for (let j = 1; j < cols; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        grid[i][j] = Math.min(
          grid[i - 1][j] + 1,
          grid[i][j - 1] + 1,
          grid[i - 1][j - 1] + cost
        );
      }
    }
    return grid[rows - 1][cols - 1];
  }

  function wordMatch(word: string, candidate: string) {
    if (word === candidate) return true;
    if (candidate.startsWith(word) && word.length >= 4) return true;
    if (word.startsWith(candidate) && candidate.length >= 4) return true;
    if (candidate.includes(word) && word.length >= 4) return true;
    // "Prabu" against "Prabhulikith": one letter off at the start.
    if (
      word.length >= 4 &&
      candidate.length >= word.length &&
      distance(word, candidate.slice(0, word.length)) <= 1
    ) {
      return true;
    }
    if (word.length >= 6 && candidate.length >= 6 && distance(word, candidate) <= 1) {
      return true;
    }
    return false;
  }

  function similarity(target: string, name: string) {
    const t = normalise(target);
    const n = normalise(name);
    if (!t || !n) return 0;
    if (t === n) return 1;

    const substringScore =
      n.includes(t) || t.includes(n)
        ? 0.9 * (Math.min(t.length, n.length) / Math.max(t.length, n.length)) + 0.1
        : 0;

    const targetWords = target.toLowerCase().match(/[a-z0-9]+/g) ?? [];
    const nameWords = name.toLowerCase().match(/[a-z0-9]+/g) ?? [];
    if (targetWords.length === 0 || nameWords.length === 0) return substringScore;

    let matched = 0;
    for (const word of targetWords) {
      if (word.length === 1) {
        if (nameWords.some((c) => c.startsWith(word))) matched += 1;
      } else if (nameWords.some((c) => wordMatch(word, c))) {
        matched += 1;
      }
    }

    return Math.max(substringScore, matched / targetWords.length);
  }

  function findPlayer(raw: string) {
    const cleaned = raw.toLowerCase().trim();
    if (!cleaned) return null;

    let best: { id: string; name: string } | null = null;
    let bestScore = 0;

    for (const player of roster) {
      const score = similarity(cleaned, player.name.toLowerCase());
      if (score > bestScore) {
        bestScore = score;
        best = player;
      }
    }

    return bestScore >= 0.75 ? best : null;
  }

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^round\s*-?\s*\d+/i.test(l));

  const boards: { board: number; white: string; black: string }[] = [];
  const problems: string[] = [];

  for (const line of lines) {
    const parts = line.split(/\s+(?:vs\.?|v)\s+/i);
    if (parts.length !== 2) {
      problems.push(`Could not read: ${line}`);
      continue;
    }

    const white = findPlayer(parts[0]);
    const black = findPlayer(parts[1]);

    if (!white || !black) {
      problems.push(
        `Unknown player in: ${line}${!white ? ` (${parts[0].trim()})` : ""}${
          !black ? ` (${parts[1].trim()})` : ""
        }`
      );
      continue;
    }

    boards.push({ board: boards.length + 1, white: white.id, black: black.id });
  }

  if (problems.length > 0 || boards.length === 0) {
    const message =
      problems.length > 0
        ? `${problems.slice(0, 2).join(" · ")}. Check the spelling against the player list.`
        : "No pairings found in the text.";
    redirect(`/tournaments/${slug}/console?error=${encodeURIComponent(message)}`);
  }

  const { data: existing } = await supabase
    .from("rounds")
    .select("number")
    .eq("tournament_id", tournamentId)
    .order("number", { ascending: false })
    .limit(1);

  const nextNumber = (existing?.[0]?.number ?? 0) + 1;

  const { data: round, error } = await supabase
    .from("rounds")
    .insert({ tournament_id: tournamentId, number: nextNumber, published_at: null })
    .select("id")
    .single();

  if (error || !round) {
    redirect(`/tournaments/${slug}/console?error=${encodeURIComponent(error?.message ?? "Could not create the round.")}`);
  }

  await supabase.from("matches").insert(
    boards.map((b) => ({
      tournament_id: tournamentId,
      round_id: round!.id,
      board: b.board,
      white_id: b.white,
      black_id: b.black,
      stage: "custom",
      result: "unplayed" as const
    }))
  );

  revalidatePath(`/tournaments/${slug}/console`);
  redirect(`/tournaments/${slug}/console`);
}

/** Swaps white and black on a single board, for drafts you are checking. */
export async function swapMatchColours(formData: FormData) {
  await requireAdmin();

  const matchId = String(formData.get("match_id") ?? "");
  const slug = String(formData.get("slug") ?? "");

  const supabase = createClient();

  const { data: match } = await supabase
    .from("matches")
    .select("id,white_id,black_id,result")
    .eq("id", matchId)
    .single();

  if (!match || !match.white_id || !match.black_id) {
    redirect(`/tournaments/${slug}/console`);
  }

  await supabase
    .from("matches")
    .update({ white_id: match.black_id, black_id: match.white_id })
    .eq("id", matchId);

  revalidatePath(`/tournaments/${slug}/console`);
  redirect(`/tournaments/${slug}/console`);
}

/** Renames a round, e.g. "Quarterfinals" instead of "Round 5". */
export async function renameRound(formData: FormData) {
  await requireAdmin();

  const roundId = String(formData.get("round_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  const supabase = createClient();
  await supabase
    .from("rounds")
    .update({ name: name || null })
    .eq("id", roundId);

  revalidatePath(`/tournaments/${slug}/console`);
  revalidatePath(`/tournaments/${slug}`);
  redirect(`/tournaments/${slug}/console`);
}

/** Re-pairs a custom draft at random, keeping the same players. */
export async function shuffleCustomRound(formData: FormData) {
  await requireAdmin();

  const roundId = String(formData.get("round_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const tournamentId = String(formData.get("tournament_id") ?? "");

  const supabase = createClient();

  const { data: round } = await supabase
    .from("rounds")
    .select("id,published_at")
    .eq("id", roundId)
    .single();

  if (!round || round.published_at) {
    redirect(`/tournaments/${slug}/console?error=${encodeURIComponent("Only a draft can be shuffled.")}`);
  }

  const { data: matches } = await supabase
    .from("matches")
    .select("id,white_id,black_id")
    .eq("round_id", roundId);

  const ids: string[] = [];
  for (const m of matches ?? []) {
    if (m.white_id) ids.push(m.white_id);
    if (m.black_id) ids.push(m.black_id);
  }

  if (ids.length < 2) {
    redirect(`/tournaments/${slug}/console`);
  }

  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }

  const rows = (matches ?? []).map((m, index) => ({
    id: m.id,
    white_id: ids[index * 2] ?? null,
    black_id: ids[index * 2 + 1] ?? null
  }));

  for (const row of rows) {
    await supabase
      .from("matches")
      .update({ white_id: row.white_id, black_id: row.black_id })
      .eq("id", row.id);
  }

  revalidatePath(`/tournaments/${slug}/console`);
  redirect(`/tournaments/${slug}/console`);
}

/**
 * Reassigns white/black across a draft so each player's colour count stays as
 * even as possible, taking their earlier rounds into account.
 */
export async function balanceCustomColours(formData: FormData) {
  await requireAdmin();

  const roundId = String(formData.get("round_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const tournamentId = String(formData.get("tournament_id") ?? "");

  const supabase = createClient();

  const { data: round } = await supabase
    .from("rounds")
    .select("id,published_at")
    .eq("id", roundId)
    .single();

  if (!round || round.published_at) {
    redirect(`/tournaments/${slug}/console?error=${encodeURIComponent("Only a draft can be rebalanced.")}`);
  }

  // Colour history from every other round.
  const { data: history } = await supabase
    .from("matches")
    .select("white_id,black_id,round_id")
    .eq("tournament_id", tournamentId);

  const balance = new Map<string, number>();
  const last = new Map<string, "w" | "b">();

  for (const m of history ?? []) {
    if (m.round_id === roundId) continue;
    if (m.white_id) {
      balance.set(m.white_id, (balance.get(m.white_id) ?? 0) + 1);
      last.set(m.white_id, "w");
    }
    if (m.black_id) {
      balance.set(m.black_id, (balance.get(m.black_id) ?? 0) - 1);
      last.set(m.black_id, "b");
    }
  }

  const { data: matches } = await supabase
    .from("matches")
    .select("id,board,white_id,black_id")
    .eq("round_id", roundId)
    .order("board", { ascending: true });

  for (const m of matches ?? []) {
    if (!m.white_id || !m.black_id) continue;

    const a = m.white_id;
    const b = m.black_id;
    const balA = balance.get(a) ?? 0;
    const balB = balance.get(b) ?? 0;

    let white = a;
    let black = b;

    if (balA > balB) {
      // A has had more whites, so B should take white.
      white = b;
      black = a;
    } else if (balA === balB) {
      const lastA = last.get(a);
      const lastB = last.get(b);
      if (lastA === "w" && lastB !== "w") {
        white = b;
        black = a;
      }
    }

    if (white !== m.white_id) {
      await supabase
        .from("matches")
        .update({ white_id: white, black_id: black })
        .eq("id", m.id);
    }

    balance.set(white, (balance.get(white) ?? 0) + 1);
    balance.set(black, (balance.get(black) ?? 0) - 1);
    last.set(white, "w");
    last.set(black, "b");
  }

  revalidatePath(`/tournaments/${slug}/console`);
  redirect(`/tournaments/${slug}/console`);
}

/** Removes the whole playoff bracket so it can be rebuilt. */
export async function deletePlayoff(formData: FormData) {
  await requireAdmin();

  const tournamentId = String(formData.get("tournament_id") ?? "");
  const slug = String(formData.get("slug") ?? "");

  const supabase = createClient();
  await supabase
    .from("matches")
    .delete()
    .eq("tournament_id", tournamentId)
    .eq("stage", "playoff");

  revalidatePath(`/tournaments/${slug}/console`);
  revalidatePath(`/tournaments/${slug}`);
  redirect(`/tournaments/${slug}/console`);
}

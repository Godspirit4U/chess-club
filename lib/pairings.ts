export type Standing = {
  profileId: string;
  name: string;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  whites: number;
  blacks: number;
  hadBye: boolean;
  form: ("W" | "D" | "L")[];
  /** Colours played, in round order. Used for the FIDE colour rules. */
  colours: ("w" | "b")[];
};

export type Board = {
  board: number;
  white: string | null;
  black: string | null;
  warnings: string[];
};

export type Draft = {
  boards: Board[];
  bye: string | null;
};

export type MatchRow = {
  white_id: string | null;
  black_id: string | null;
  result: "white" | "black" | "draw" | "bye" | "forfeit_white" | "forfeit_black" | "unplayed";
  /** Round number, so colour history is built in the right order. */
  round?: number;
};

/** Points, records and colour counts for every player in the tournament. */
export function computeStandings(
  players: { profileId: string; name: string }[],
  matches: MatchRow[],
  points: { win: number; draw: number; loss: number }
): Standing[] {
  const table = new Map<string, Standing>();

  for (const p of players) {
    table.set(p.profileId, {
      profileId: p.profileId,
      name: p.name,
      points: 0,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      whites: 0,
      blacks: 0,
      hadBye: false,
      form: [],
      colours: []
    });
  }

  const ordered = [...matches].sort((a, b) => (a.round ?? 0) - (b.round ?? 0));

  for (const m of ordered) {
    if (m.result === "unplayed") continue;

    if (m.result === "bye") {
      const solo = m.white_id ?? m.black_id;
      const row = solo ? table.get(solo) : null;
      if (row) {
        row.points += points.win;
        row.hadBye = true;
        row.form.push("W");
      }
      continue;
    }

    const white = m.white_id ? table.get(m.white_id) : null;
    const black = m.black_id ? table.get(m.black_id) : null;
    if (!white || !black) continue;

    white.played++;
    black.played++;
    white.whites++;
    black.blacks++;
    white.colours.push("w");
    black.colours.push("b");

    if (m.result === "draw") {
      white.points += points.draw;
      black.points += points.draw;
      white.draws++;
      black.draws++;
      white.form.push("D");
      black.form.push("D");
    } else if (m.result === "white" || m.result === "forfeit_black") {
      white.points += points.win;
      black.points += points.loss;
      white.wins++;
      black.losses++;
      white.form.push("W");
      black.form.push("L");
    } else if (m.result === "black" || m.result === "forfeit_white") {
      black.points += points.win;
      white.points += points.loss;
      black.wins++;
      white.losses++;
      black.form.push("W");
      white.form.push("L");
    }
  }

  return [...table.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.wins - a.wins ||
      a.name.localeCompare(b.name)
  );
}

/** The colour a player should get next, per FIDE C.04.1 rules 8. */
function colourPreference(s: Standing): "w" | "b" | null {
  const diff = s.whites - s.blacks;
  if (diff > 0) return "b";
  if (diff < 0) return "w";

  const last = s.colours[s.colours.length - 1];
  if (!last) return null;
  return last === "w" ? "b" : "w";
}

/** Would giving this player this colour break rule 6 or rule 7? */
function colourViolates(s: Standing, colour: "w" | "b"): boolean {
  const whites = s.whites + (colour === "w" ? 1 : 0);
  const blacks = s.blacks + (colour === "b" ? 1 : 0);

  if (Math.abs(whites - blacks) > 2) return true;

  const c = s.colours;
  if (c.length >= 2 && c[c.length - 1] === colour && c[c.length - 2] === colour) {
    return true;
  }

  return false;
}

/** True when these two have already met in any earlier round. */
function havePlayed(a: string, b: string, previous: MatchRow[]) {
  return previous.some(
    (m) =>
      (m.white_id === a && m.black_id === b) || (m.white_id === b && m.black_id === a)
  );
}

/**
 * Swiss pairing for one round.
 * Sorts by score, pairs the top half against the bottom half, avoids repeat
 * opponents, and gives the bye to the lowest scorer who has not had one.
 */
export function generateSwiss(standings: Standing[], previous: MatchRow[]): Draft {
  const pool = [...standings].sort(
    (a, b) => b.points - a.points || b.wins - a.wins || a.name.localeCompare(b.name)
  );

  let bye: string | null = null;

  if (pool.length % 2 === 1) {
    // Lowest scorer who has not already had a bye.
    for (let i = pool.length - 1; i >= 0; i--) {
      if (!pool[i].hadBye) {
        bye = pool[i].profileId;
        pool.splice(i, 1);
        break;
      }
    }
    if (!bye && pool.length > 0) {
      bye = pool[pool.length - 1].profileId;
      pool.pop();
    }
  }

  // Split into score groups, keeping the order inside each group.
  const groups: Standing[][] = [];
  for (const player of pool) {
    const last = groups[groups.length - 1];
    if (last && last[0].points === player.points) last.push(player);
    else groups.push([player]);
  }

  const boards: Board[] = [];
  const used = new Set<string>();

  /** Pairs two players, applying the FIDE colour rules. */
  function makeBoard(player: Standing, opponent: Standing) {
    if (used.has(player.profileId) || used.has(opponent.profileId)) return;
    used.add(player.profileId);
    used.add(opponent.profileId);

    const warnings: string[] = [];
    if (havePlayed(player.profileId, opponent.profileId, previous)) {
      warnings.push("These two have already played");
    }

    const prefA = colourPreference(player);
    const prefB = colourPreference(opponent);

    let whiteIsA: boolean;

    if (prefA && prefB && prefA !== prefB) {
      whiteIsA = prefA === "w";
    } else if (prefA && !prefB) {
      whiteIsA = prefA === "w";
    } else if (!prefA && prefB) {
      whiteIsA = prefB !== "w";
    } else if (prefA && prefB && prefA === prefB) {
      const imbalanceA = Math.abs(player.whites - player.blacks);
      const imbalanceB = Math.abs(opponent.whites - opponent.blacks);
      if (imbalanceA === imbalanceB) whiteIsA = prefA === "w";
      else whiteIsA = imbalanceA > imbalanceB ? prefA === "w" : prefB !== "w";
    } else {
      whiteIsA = true;
    }

    let white = whiteIsA ? player : opponent;
    let black = whiteIsA ? opponent : player;

    const whiteOk = !colourViolates(white, "w");
    const blackOk = !colourViolates(black, "b");

    if (!(whiteOk && blackOk)) {
      const swappedOk = !colourViolates(opponent, "w") && !colourViolates(player, "b");
      if (swappedOk) {
        white = opponent;
        black = player;
        warnings.push("Colours swapped to stay within FIDE limits");
      } else {
        warnings.push("Colour rule cannot be met for this board");
      }
    }

    if (colourViolates(white, "w")) {
      warnings.push(`${white.name} would exceed the colour limits`);
    }

    boards.push({
      board: boards.length + 1,
      white: white.profileId,
      black: black.profileId,
      warnings
    });
  }

  /** Pairs inside one score group: first half against second half. */
  function pairGroup(group: Standing[]) {
    const half = Math.ceil(group.length / 2);
    const top = group.slice(0, half);
    const bottom = group.slice(half);

    for (const player of top) {
      if (used.has(player.profileId)) continue;

      let index = bottom.findIndex(
        (c) => !used.has(c.profileId) && !havePlayed(player.profileId, c.profileId, previous)
      );

      // Everyone legal is taken or already played: accept a repeat.
      if (index === -1) index = bottom.findIndex((c) => !used.has(c.profileId));
      if (index === -1) continue;

      makeBoard(player, bottom[index]);
    }

    // Anything left in this group (odd numbers) pairs among itself.
    const leftover = group.filter((p) => !used.has(p.profileId));
    for (let i = 0; i + 1 < leftover.length; i += 2) {
      makeBoard(leftover[i], leftover[i + 1]);
    }
  }

  // Pair each score group, floating one player down when a group is odd.
  let carried: Standing | null = null;

  for (let gi = 0; gi < groups.length; gi++) {
    let group = groups[gi];

    if (carried) {
      group = [carried, ...group];
      carried = null;
    }

    if (group.length % 2 === 1 && gi < groups.length - 1) {
      carried = group.pop() as Standing;
    }

    pairGroup(group);
  }

  // A floater left at the bottom pairs with whoever is still free.
  if (carried && !used.has(carried.profileId)) {
    const free = pool.find((p) => !used.has(p.profileId) && p.profileId !== carried!.profileId);
    if (free) makeBoard(carried, free);
  }

  return { boards, bye };
}

/**
 * Round-robin schedule by the circle method.
 * Returns `rounds` rounds, each a list of boards, so every player appears
 * once per round and never meets the same opponent twice.
 */
export function generateRoundRobin(
  playerIds: string[],
  rounds: number
): { board: number; white: string; black: string }[][] {
  const players: (string | null)[] = [...playerIds];
  if (players.length % 2 === 1) players.push(null);

  const n = players.length;
  if (n < 2) return [];

  const maxRounds = n - 1;
  const wanted = Math.max(1, Math.min(rounds, maxRounds));

  const arr = [...players];
  const out: { board: number; white: string; black: string }[][] = [];

  // Colour bookkeeping: whites minus blacks, and the last colour each had.
  const balance = new Map<string, number>();
  const lastColour = new Map<string, "w" | "b">();

  for (const id of playerIds) {
    balance.set(id, 0);
  }

  for (let r = 0; r < wanted; r++) {
    const boards: { board: number; white: string; black: string }[] = [];

    for (let i = 0; i < n / 2; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (!a || !b) continue;

      const balA = balance.get(a) ?? 0;
      const balB = balance.get(b) ?? 0;

      let whiteFirst: boolean;

      if (balA !== balB) {
        // Whoever has had fewer whites takes white.
        whiteFirst = balA < balB;
      } else {
        const lastA = lastColour.get(a);
        const lastB = lastColour.get(b);

        if (lastA === "w" && lastB !== "w") whiteFirst = false;
        else if (lastB === "w" && lastA !== "w") whiteFirst = true;
        else whiteFirst = (r + i) % 2 === 0;
      }

      const white = whiteFirst ? a : b;
      const black = whiteFirst ? b : a;

      boards.push({ board: boards.length + 1, white, black });

      balance.set(white, (balance.get(white) ?? 0) + 1);
      balance.set(black, (balance.get(black) ?? 0) - 1);
      lastColour.set(white, "w");
      lastColour.set(black, "b");
    }

    out.push(boards);

    // Rotate everyone except the first player.
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop() as string | null);
    arr.length = 0;
    arr.push(fixed, ...rest);
  }

  return out;
}

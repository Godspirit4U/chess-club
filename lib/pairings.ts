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

  const half = pool.length / 2;
  const top = pool.slice(0, half);
  const bottom = pool.slice(half);

  const used = new Set<string>();
  const boards: Board[] = [];

  for (const player of top) {
    if (used.has(player.profileId)) continue;

    let opponentIndex = bottom.findIndex(
      (c) => !used.has(c.profileId) && !havePlayed(player.profileId, c.profileId, previous)
    );

    // No legal opponent in the bottom half: take the nearest available player.
    if (opponentIndex === -1) {
      opponentIndex = bottom.findIndex((c) => !used.has(c.profileId));
    }

    if (opponentIndex === -1) continue;

    const opponent = bottom[opponentIndex];
    used.add(player.profileId);
    used.add(opponent.profileId);

    const warnings: string[] = [];

    if (havePlayed(player.profileId, opponent.profileId, previous)) {
      warnings.push("These two have already played");
    }

    // FIDE C.04.1: a player should get the colour they have played less, and
    // when balanced, the one alternating from their last game.
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
      // Both want the same colour: the larger imbalance wins, else the higher scorer.
      const imbalanceA = Math.abs(player.whites - player.blacks);
      const imbalanceB = Math.abs(opponent.whites - opponent.blacks);
      if (imbalanceA === imbalanceB) {
        whiteIsA = prefA === "w";
      } else {
        whiteIsA = imbalanceA > imbalanceB ? prefA === "w" : prefB !== "w";
      }
    } else {
      // Neither has a preference: the higher-ranked player takes white.
      whiteIsA = true;
    }

    let white = whiteIsA ? player : opponent;
    let black = whiteIsA ? opponent : player;

    // Hard rules: never more than two apart, never three of the same colour.
    const whiteOk = !colourViolates(white, "w");
    const blackOk = !colourViolates(black, "b");

    if (!(whiteOk && blackOk)) {
      const swappedOk =
        !colourViolates(opponent, "w") && !colourViolates(player, "b");

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

  return { boards, bye };
}

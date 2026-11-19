/**
 * Four-player Page playoff, with the club's naming.
 *
 *   Semi-final 1 : 1st vs 2nd          winner -> Grand Final (white)
 *                                     loser  -> Semi-final 2 (white)
 *   Eliminator   : 3rd vs 4th          winner -> Semi-final 2 (black)
 *   Semi-final 2 : loser of Semi-final 1 vs winner of the Eliminator
 *                                      winner -> Grand Final (black)
 *   Grand Final  : winner of Semi-final 1 vs winner of Semi-final 2
 */
export const PLAYOFF_SLOTS = ["SF1", "ELIM", "SF2", "GF"] as const;
export type PlayoffSlot = (typeof PLAYOFF_SLOTS)[number];

export const SLOT_TITLE: Record<string, string> = {
  SF1: "Semi-final 1 · 1st vs 2nd",
  ELIM: "Eliminator · 3rd vs 4th",
  SF2: "Semi-final 2 · loser of Semi-final 1 vs winner of the Eliminator",
  GF: "Grand Final · winner of Semi-final 1 vs winner of Semi-final 2"
};

export const SLOT_SHORT: Record<string, string> = {
  SF1: "Semi-final 1",
  ELIM: "Eliminator",
  SF2: "Semi-final 2",
  GF: "Grand Final"
};

/** Legacy slot names, so older brackets still resolve. */
const LEGACY: Record<string, string> = { M1: "SF1", M2: "ELIM", M3: "SF2", F: "GF" };

export type PlayoffMatch = {
  id: string;
  slot: string;
  white_id: string | null;
  black_id: string | null;
  result: string;
  pgn: string | null;
};

export function winnerOf(m: PlayoffMatch | undefined): string | null {
  if (!m) return null;
  if (m.result === "white" || m.result === "forfeit_black") return m.white_id;
  if (m.result === "black" || m.result === "forfeit_white") return m.black_id;
  return null;
}

export function loserOf(m: PlayoffMatch | undefined): string | null {
  if (!m) return null;
  if (m.result === "white" || m.result === "forfeit_black") return m.black_id;
  if (m.result === "black" || m.result === "forfeit_white") return m.white_id;
  return null;
}

/** Works out which players belong in the unfilled slots. */
export function resolveBracket(matches: PlayoffMatch[]) {
  const bySlot = new Map<string, PlayoffMatch>();
  for (const m of matches) {
    bySlot.set(LEGACY[m.slot] ?? m.slot, m);
  }

  const sf1 = bySlot.get("SF1");
  const elim = bySlot.get("ELIM");
  const sf2 = bySlot.get("SF2");

  const updates: { id: string; white_id: string | null; black_id: string | null }[] = [];

  if (sf2) {
    const white = loserOf(sf1);
    const black = winnerOf(elim);
    if (sf2.white_id !== white || sf2.black_id !== black) {
      updates.push({ id: sf2.id, white_id: white, black_id: black });
    }
  }

  const gf = bySlot.get("GF");
  if (gf) {
    const white = winnerOf(sf1);
    const black = winnerOf(sf2);
    if (gf.white_id !== white || gf.black_id !== black) {
      updates.push({ id: gf.id, white_id: white, black_id: black });
    }
  }

  return updates;
}

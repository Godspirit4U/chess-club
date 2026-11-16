/**
 * Four-player Page playoff, the format the club uses.
 *
 *   M1: 1st vs 2nd        winner -> Final (white), loser -> M3 (black)
 *   M2: 3rd vs 4th        winner -> M3 (white)
 *   M3: loser(M1) vs winner(M2)   winner -> Final (black)
 *   F : winner(M1) vs winner(M3)
 */
export const PLAYOFF_SLOTS = ["M1", "M2", "M3", "F"] as const;
export type PlayoffSlot = (typeof PLAYOFF_SLOTS)[number];

export const SLOT_TITLE: Record<string, string> = {
  M1: "Match 1 · 1st vs 2nd",
  M2: "Match 2 · 3rd vs 4th",
  M3: "Match 3 · loser of Match 1 vs winner of Match 2",
  F: "Final · winner of Match 1 vs winner of Match 3"
};

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
  const bySlot = new Map(matches.map((m) => [m.slot, m]));

  const m1 = bySlot.get("M1");
  const m2 = bySlot.get("M2");
  const m3 = bySlot.get("M3");

  const updates: { id: string; white_id: string | null; black_id: string | null }[] = [];

  if (m3) {
    const white = winnerOf(m2);
    const black = loserOf(m1);
    if (m3.white_id !== white || m3.black_id !== black) {
      updates.push({ id: m3.id, white_id: white, black_id: black });
    }
  }

  const final = bySlot.get("F");
  if (final) {
    const white = winnerOf(m1);
    const black = winnerOf(m3);
    if (final.white_id !== white || final.black_id !== black) {
      updates.push({ id: final.id, white_id: white, black_id: black });
    }
  }

  return updates;
}

"use client";

import { Chess } from "chess.js";
import { useMemo, useState } from "react";

const GLYPHS: Record<string, string> = {
  wp: "♙", wn: "♘", wb: "♗", wr: "♖", wq: "♕", wk: "♔",
  bp: "♟", bn: "♞", bb: "♝", br: "♜", bq: "♛", bk: "♚"
};

/** Every position in the game, index 0 being the starting position. */
function positionsFromPgn(pgn: string): { fen: string; san: string | null }[] {
  const game = new Chess();
  try {
    game.loadPgn(pgn);
  } catch {
    return [];
  }

  const moves = game.history({ verbose: true });
  const replay = new Chess();
  const out: { fen: string; san: string | null }[] = [{ fen: replay.fen(), san: null }];

  for (const m of moves) {
    replay.move(m.san);
    out.push({ fen: replay.fen(), san: m.san });
  }

  return out;
}

function toGrid(fen: string): ({ type: string; color: string } | null)[][] {
  const rows = fen.split(" ")[0].split("/");
  return rows.map((row) => {
    const cells: ({ type: string; color: string } | null)[] = [];
    for (const ch of row) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < Number(ch); i++) cells.push(null);
      } else {
        const color = ch === ch.toUpperCase() ? "w" : "b";
        cells.push({ type: ch.toLowerCase(), color });
      }
    }
    return cells;
  });
}

export default function ChessBoard({ pgn }: { pgn: string }) {
  const positions = useMemo(() => positionsFromPgn(pgn), [pgn]);
  const [index, setIndex] = useState(Math.max(0, positions.length - 1));

  if (positions.length === 0) {
    return <p className="muted small">The moves for this game could not be read.</p>;
  }

  const current = positions[Math.min(index, positions.length - 1)];
  const grid = toGrid(current.fen);
  const moves = positions.slice(1).map((p) => p.san);

  const btn = { minHeight: 36, padding: "0 12px" } as const;

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          width: "100%",
          maxWidth: 360,
          border: "1px solid var(--border)",
          aspectRatio: "1 / 1"
        }}
        aria-label={`Position after ${index} half moves`}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const light = (r + c) % 2 === 0;
            return (
              <div
                key={`${r}-${c}`}
                style={{
                  background: light ? "#f6f1e3" : "#7d6f52",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "min(5vw, 26px)",
                  lineHeight: 1,
                  color: cell?.color === "w" ? "#fff" : "#111",
                  textShadow:
                    cell?.color === "w"
                      ? "0 0 1px #000, 0 1px 1px rgba(0,0,0,.45)"
                      : "0 0 1px rgba(255,255,255,.6)"
                }}
              >
                {cell ? GLYPHS[`${cell.color}${cell.type}`] : ""}
              </div>
            );
          })
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <button className="btn secondary" style={btn} onClick={() => setIndex(0)} type="button">
          Start
        </button>
        <button
          className="btn secondary"
          style={btn}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          type="button"
        >
          Back
        </button>
        <button
          className="btn secondary"
          style={btn}
          onClick={() => setIndex((i) => Math.min(positions.length - 1, i + 1))}
          type="button"
        >
          Next
        </button>
        <button
          className="btn secondary"
          style={btn}
          onClick={() => setIndex(positions.length - 1)}
          type="button"
        >
          End
        </button>
      </div>

      {moves.length > 0 ? (
        <p className="small muted" style={{ marginTop: 8, wordSpacing: 2 }}>
          {moves
            .map((m, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${m}` : m))
            .join(" ")}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { Chess } from "chess.js";
import { useMemo, useState } from "react";
import { Chessboard } from "react-chessboard";

/** Replays a PGN move by move. */
function positionsFromPgn(pgn: string): { fen: string; san: string | null }[] {
  const game = new Chess();
  try {
    game.loadPgn(pgn);
  } catch {
    return [{ fen: new Chess().fen(), san: null }];
  }

  const history = game.history();
  const replay = new Chess();
  const out: { fen: string; san: string | null }[] = [{ fen: replay.fen(), san: null }];

  for (const san of history) {
    try {
      replay.move(san);
      out.push({ fen: replay.fen(), san });
    } catch {
      break;
    }
  }
  return out;
}

export default function ChessBoard({ pgn }: { pgn: string }) {
  const positions = useMemo(() => positionsFromPgn(pgn), [pgn]);
  const [index, setIndex] = useState(0);

  const at = Math.min(index, positions.length - 1);

  return (
    <div>
      <div style={{ maxWidth: 400 }}>
        <Chessboard
          position={positions[at].fen}
          boardWidth={380}
          arePiecesDraggable={false}
          customBoardStyle={{ borderRadius: 6, boxShadow: "0 1px 3px rgba(20,32,26,0.15)" }}
          customDarkSquareStyle={{ backgroundColor: "#7d6f52" }}
          customLightSquareStyle={{ backgroundColor: "#f6f1e3" }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn secondary"
          style={{ minHeight: 34 }}
          onClick={() => setIndex(0)}
          aria-label="First move"
        >
          ⏮
        </button>
        <button
          type="button"
          className="btn secondary"
          style={{ minHeight: 34 }}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          aria-label="Previous move"
        >
          ◀
        </button>
        <button
          type="button"
          className="btn secondary"
          style={{ minHeight: 34 }}
          onClick={() => setIndex((i) => Math.min(positions.length - 1, i + 1))}
          aria-label="Next move"
        >
          ▶
        </button>
        <button
          type="button"
          className="btn secondary"
          style={{ minHeight: 34 }}
          onClick={() => setIndex(positions.length - 1)}
          aria-label="Last move"
        >
          ⏭
        </button>

        <span className="small muted" style={{ alignSelf: "center" }}>
          {at === 0 ? "Start" : `Move ${Math.ceil(at / 2)}${at % 2 ? "" : "…"}`} · {positions.length - 1} plies
        </span>
      </div>
    </div>
  );
}

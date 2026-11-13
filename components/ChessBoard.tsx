"use client";

import { Chess } from "chess.js";
import { useEffect, useMemo, useState } from "react";
import { Chessboard } from "react-chessboard";

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
  const [playing, setPlaying] = useState(false);

  const at = Math.min(index, positions.length - 1);
  const last = positions.length - 1;

  // Autoplay one move at a time.
  useEffect(() => {
    if (!playing) return;
    if (at >= last) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setIndex((i) => Math.min(last, i + 1)), 800);
    return () => clearTimeout(t);
  }, [playing, at, last]);

  // Arrow keys step through the game.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setPlaying(false);
        setIndex((i) => Math.min(last, i + 1));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setPlaying(false);
        setIndex((i) => Math.max(0, i - 1));
      } else if (event.key === "Home") {
        event.preventDefault();
        setIndex(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setIndex(last);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [last]);

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

      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          className="btn secondary"
          style={{ minHeight: 34 }}
          onClick={() => {
            setPlaying(false);
            setIndex(0);
          }}
          aria-label="First move"
        >
          ⏮
        </button>
        <button
          type="button"
          className="btn secondary"
          style={{ minHeight: 34 }}
          onClick={() => {
            setPlaying(false);
            setIndex((i) => Math.max(0, i - 1));
          }}
          aria-label="Previous move"
        >
          ◀
        </button>
        <button
          type="button"
          className="btn"
          style={{ minHeight: 34 }}
          onClick={() => {
            if (at >= last) setIndex(0);
            setPlaying((p) => !p);
          }}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? "❚❚ Pause" : "▶ Play"}
        </button>
        <button
          type="button"
          className="btn secondary"
          style={{ minHeight: 34 }}
          onClick={() => {
            setPlaying(false);
            setIndex((i) => Math.min(last, i + 1));
          }}
          aria-label="Next move"
        >
          ▶
        </button>
        <button
          type="button"
          className="btn secondary"
          style={{ minHeight: 34 }}
          onClick={() => {
            setPlaying(false);
            setIndex(last);
          }}
          aria-label="Last move"
        >
          ⏭
        </button>

        <span className="small muted">
          {at === 0 ? "Start" : `Move ${Math.ceil(at / 2)}`} · {last} plies · arrow keys work
        </span>
      </div>
    </div>
  );
}

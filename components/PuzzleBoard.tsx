"use client";

import { Chess, type Square } from "chess.js";
import { useMemo, useState } from "react";

const GLYPHS: Record<string, string> = {
  wp: "♙", wn: "♘", wb: "♗", wr: "♖", wq: "♕", wk: "♔",
  bp: "♟", bn: "♞", bb: "♝", br: "♜", bq: "♛", bk: "♚"
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

function gridFrom(game: Chess) {
  const board = game.board();
  return board.map((row) =>
    row.map((cell) => (cell ? { type: cell.type, color: cell.color } : null))
  );
}

export default function PuzzleBoard({
  fen,
  solution,
  onSolved,
  alreadySolved
}: {
  fen: string;
  solution: string[];
  onSolved: () => void;
  alreadySolved: boolean;
}) {
  const game = useMemo(() => {
    const g = new Chess();
    try {
      g.load(fen);
    } catch {
      // ignore, handled below
    }
    return g;
  }, [fen]);

  const [position, setPosition] = useState(() => new Chess(game.fen()));
  const [selected, setSelected] = useState<Square | null>(null);
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(alreadySolved);

  const grid = gridFrom(position);

  function tap(square: Square) {
    if (done) return;

    if (!selected) {
      const piece = position.get(square);
      if (piece && piece.color === position.turn()) {
        setSelected(square);
        setMessage(null);
      }
      return;
    }

    const attempt = new Chess(position.fen());
    try {
      const move = attempt.move({ from: selected, to: square, promotion: "q" });
      if (!move) {
        setSelected(null);
        return;
      }

      const expected = solution[step];
      if (move.san === expected) {
        setPosition(attempt);
        setStep((s) => s + 1);
        setSelected(null);
        setMessage(null);

        if (step + 1 >= solution.length) {
          setDone(true);
          onSolved();
        }
      } else {
        setSelected(null);
        setMessage("Not that move. Try again.");
      }
    } catch {
      setSelected(null);
    }
  }

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
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const square = `${FILES[c]}${8 - r}` as Square;
            const light = (r + c) % 2 === 0;
            const isSelected = selected === square;
            return (
              <button
                key={square}
                type="button"
                onClick={() => tap(square)}
                style={{
                  background: isSelected ? "#bfe6cf" : light ? "#f6f1e3" : "#7d6f52",
                  border: 0,
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "min(5vw, 26px)",
                  lineHeight: 1,
                  cursor: done ? "default" : "pointer",
                  color: cell?.color === "w" ? "#fff" : "#111",
                  textShadow:
                    cell?.color === "w"
                      ? "0 0 1px #000, 0 1px 1px rgba(0,0,0,.45)"
                      : "0 0 1px rgba(255,255,255,.6)"
                }}
                aria-label={`${square}${cell ? `, ${cell.color === "w" ? "white" : "black"} ${cell.type}` : ""}`}
              >
                {cell ? GLYPHS[`${cell.color}${cell.type}`] : ""}
              </button>
            );
          })
        )}
      </div>

      <p className="small" style={{ marginTop: 10 }}>
        {done
          ? "Solved. This one is counted."
          : message
            ? <span style={{ color: "var(--danger)" }}>{message}</span>
            : `Find the best move for ${position.turn() === "w" ? "White" : "Black"}.`}
      </p>
    </div>
  );
}

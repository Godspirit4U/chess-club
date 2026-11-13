"use client";

import { Chess, type Square } from "chess.js";
import { useMemo, useState } from "react";
import { recordSolve } from "@/app/admin/puzzles/actions";

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
  alreadySolved,
  puzzleId,
  date
}: {
  fen: string;
  solution: string[];
  alreadySolved: boolean;
  puzzleId: string;
  date: string;
}) {
  const moves = useMemo(
    () =>
      solution
        .join(" ")
        .replace(/\d+\.(\.\.)?/g, " ")
        .replace(/\b(1-0|0-1|1\/2-1\/2|\*)\b/g, " ")
        .replace(/[?!]+/g, "")
        .trim()
        .split(/\s+/)
        .filter(Boolean),
    [solution]
  );

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

      const expected = moves[step];
      if (move.san === expected) {
        setPosition(attempt);
        setStep((s) => s + 1);
        setSelected(null);
        setMessage(null);

        if (step + 1 >= moves.length) {
          setDone(true);
          submitSolve();
          return;
        }

        // Play the opponent's reply so the solver only has to find their own moves.
        const reply = moves[step + 1];
        if (reply) {
          try {
            const after = new Chess(attempt.fen());
            after.move(reply);
            setPosition(after);
            setStep((s2) => s2 + 2);
            if (step + 2 >= moves.length) {
              setDone(true);
              submitSolve();
            }
          } catch {
            setStep((s2) => s2 + 1);
          }
        }
      } else {
        setSelected(null);
        setMessage("Not that move. Try again.");
      }
    } catch {
      setSelected(null);
    }
  }

  function submitSolve() {
    if (alreadySolved) return;
    const data = new FormData();
    data.set("puzzle_id", puzzleId);
    data.set("date", date);
    void recordSolve(data);
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

"use client";

import { Chess, type Square } from "chess.js";
import { useMemo, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { recordSolve } from "@/app/admin/puzzles/actions";

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

  const [position, setPosition] = useState(() => {
    try {
      return new Chess(fen).fen();
    } catch {
      return fen;
    }
  });
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const startedAt = useRef<number | null>(null);

  function submitSolve() {
    if (alreadySolved) return;
    const data = new FormData();
    data.set("puzzle_id", puzzleId);
    data.set("date", date);
    const elapsed = startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : 0;
    data.set("seconds", String(elapsed));
    void recordSolve(data);
  }

  function attempt(from: string, to: string): boolean {
    if (done || waiting) return false;

    const game = new Chess(position);
    let move;
    try {
      move = game.move({ from, to, promotion: "q" });
    } catch {
      return false;
    }
    if (!move) return false;

    if (move.san !== moves[step]) {
      setWrong(to);
      setMessage("Not that move. Try again.");
      window.setTimeout(() => setWrong(null), 700);
      return false;
    }

    if (!startedAt.current) startedAt.current = Date.now();
    setMessage(null);
    setSelected(null);

    const reply = moves[step + 1];

    if (!reply) {
      setPosition(game.fen());
      setStep(step + 1);
      if (step + 1 >= moves.length) {
        setDone(true);
        submitSolve();
      }
      return true;
    }

    setPosition(game.fen());
    setWaiting(true);

    window.setTimeout(() => {
      try {
        game.move(reply);
      } catch {
        /* malformed reply */
      }
      setPosition(game.fen());
      setStep(step + 2);
      setWaiting(false);

      if (step + 2 >= moves.length) {
        setDone(true);
        submitSolve();
      }
    }, 300);

    return true;
  }

  function onDrop(from: string, to: string) {
    return attempt(from, to);
  }

  function onSquareClick(square: string) {
    if (done || waiting) return;

    const game = new Chess(position);
    const piece = game.get(square as Square);

    if (!selected) {
      if (piece && piece.color === game.turn()) setSelected(square);
      return;
    }

    if (square === selected) {
      setSelected(null);
      return;
    }

    const moved = attempt(selected, square);
    if (!moved) {
      if (piece && piece.color === game.turn()) setSelected(square);
      else setSelected(null);
    }
  }

  // Dots on the squares the selected piece can legally move to.
  const squareStyles: Record<string, React.CSSProperties> = {};
  if (selected) {
    const game = new Chess(position);
    for (const move of game.moves({ square: selected as Square, verbose: true })) {
      const target = (move as any).to as string;
      const occupied = game.get(target as Square);
      squareStyles[target] = occupied
        ? { background: "radial-gradient(circle, rgba(15,125,82,0.45) 78%, transparent 80%)" }
        : {
            background:
              "radial-gradient(circle, rgba(15,125,82,0.45) 22%, transparent 24%)"
          };
    }
    squareStyles[selected] = { background: "rgba(15,125,82,0.28)" };
  }

  if (wrong) {
    squareStyles[wrong] = { background: "rgba(163,43,43,0.45)" };
  }

  return (
    <div>
      <div style={{ maxWidth: 400 }}>
        <Chessboard
          position={position}
          onPieceDrop={onDrop}
          onSquareClick={onSquareClick}
          boardWidth={380}
          arePiecesDraggable={!done && !waiting}
          customSquareStyles={squareStyles}
          customBoardStyle={{ borderRadius: 6, boxShadow: "0 1px 3px rgba(20,32,26,0.15)" }}
          customDarkSquareStyle={{ backgroundColor: "#7d6f52" }}
          customLightSquareStyle={{ backgroundColor: "#f6f1e3" }}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        {done ? (
          <p className="small" style={{ color: "var(--accent)", fontWeight: 600 }}>
            Solved{alreadySolved ? "" : ". Added to your count."}
          </p>
        ) : (
          <p className="small muted" style={{ margin: 0 }}>
            {message ??
              (waiting
                ? "Replying…"
                : `Move ${Math.floor(step / 2) + 1} of ${Math.ceil(moves.length / 2)} · click a piece, then a square`)}
          </p>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn secondary"
            style={{ minHeight: 32, fontSize: 13 }}
            onClick={() => {
              setPosition(new Chess(fen).fen());
              setStep(0);
              setDone(false);
              setMessage(null);
              setSelected(null);
              setShowSolution(false);
              startedAt.current = null;
            }}
          >
            Start again
          </button>

          <button
            type="button"
            className="btn secondary"
            style={{ minHeight: 32, fontSize: 13 }}
            onClick={() => setShowSolution((v) => !v)}
          >
            {showSolution ? "Hide solution" : "Show the solution"}
          </button>
        </div>

        {showSolution ? (
          <p className="small" style={{ marginTop: 8 }}>
            <strong>Solution:</strong> {moves.join(" ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

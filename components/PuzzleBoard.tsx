"use client";

import { Chess } from "chess.js";
import { useMemo, useState } from "react";
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

  function submitSolve() {
    if (alreadySolved) return;
    const data = new FormData();
    data.set("puzzle_id", puzzleId);
    data.set("date", date);
    void recordSolve(data);
  }

  function onDrop(from: string, to: string) {
    if (done) return false;

    const game = new Chess(position);
    let move;
    try {
      move = game.move({ from, to, promotion: "q" });
    } catch {
      return false;
    }
    if (!move) return false;

    if (move.san !== moves[step]) {
      setMessage("Not that move. Try again.");
      return false;
    }

    setMessage(null);

    // Play the opponent's reply straight away.
    const reply = moves[step + 1];
    if (reply) {
      try {
        game.move(reply);
      } catch {
        /* ignore a malformed reply */
      }
    }

    setPosition(game.fen());

    const next = step + (reply ? 2 : 1);
    setStep(next);

    if (next >= moves.length) {
      setDone(true);
      submitSolve();
    }

    return true;
  }

  return (
    <div>
      <div style={{ maxWidth: 400 }}>
        <Chessboard
          position={position}
          onPieceDrop={onDrop}
          boardWidth={380}
          arePiecesDraggable={!done}
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
            {message ?? `Move ${Math.floor(step / 2) + 1} of ${Math.ceil(moves.length / 2)}`}
          </p>
        )}

        {message && !done ? (
          <p className="small" style={{ marginTop: 6 }}>
            <button
              type="button"
              className="btn secondary"
              style={{ minHeight: 32, fontSize: 13 }}
              onClick={() => {
                setPosition(new Chess(fen).fen());
                setStep(0);
                setMessage(null);
              }}
            >
              Start again
            </button>
          </p>
        ) : null}
      </div>
    </div>
  );
}

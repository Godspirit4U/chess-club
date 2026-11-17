"use client";

import { useState } from "react";
import { saveResult } from "@/lib/tournament-actions";
import SubmitButton from "@/components/SubmitButton";
import PgnInput from "@/components/PgnInput";

export default function ResultRow({
  matchId,
  slug,
  board,
  whiteName,
  blackName,
  result,
  pgn,
  isBye
}: {
  matchId: string;
  slug: string;
  board: number;
  whiteName: string;
  blackName: string;
  result: string;
  pgn: string | null;
  isBye: boolean;
}) {
  const [editing, setEditing] = useState(result === "unplayed");

  const won =
    result === "white" || result === "forfeit_black"
      ? whiteName
      : result === "black" || result === "forfeit_white"
        ? blackName
        : null;

  const score =
    result === "draw"
      ? "½–½"
      : result === "white" || result === "forfeit_black"
        ? "1–0"
        : result === "black" || result === "forfeit_white"
          ? "0–1"
          : result === "bye"
            ? "bye"
            : "";

  if (!editing) {
    return (
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          padding: "10px 0",
          borderTop: "1px solid var(--border)"
        }}
      >
        <div className="small">
          Board {board}:{" "}
          <span className="colour-chip light" style={{ marginRight: 5 }}>W</span>
          {whiteName} <span className="muted">vs</span>{" "}
          <span className="colour-chip dark" style={{ margin: "0 5px 0 4px" }}>B</span>
          {isBye ? "bye" : blackName}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <strong className="small">
            {result === "draw" ? "Draw" : result === "bye" ? "Bye" : won ? `${won} won` : "—"}
          </strong>
          <span className="status-chip done">{score}</span>
          {pgn ? (
            <span className="status-chip pgn">PGN saved</span>
          ) : (
            <span className="status-chip nopgn">no PGN</span>
          )}
          <button
            type="button"
            className="btn secondary"
            style={{ minHeight: 30, fontSize: 12 }}
            onClick={() => setEditing(true)}
          >
            Edit match result
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      action={saveResult}
      style={{
        display: "grid",
        gap: 8,
        padding: "10px 0",
        borderTop: "1px solid var(--border)"
      }}
    >
      <input type="hidden" name="match_id" value={matchId} />
      <input type="hidden" name="slug" value={slug} />

      <div className="small">
        Board {board}:{" "}
        <span className="colour-chip light" style={{ marginRight: 5 }}>W</span>
        {whiteName} <span className="muted">vs</span>{" "}
        <span className="colour-chip dark" style={{ margin: "0 5px 0 4px" }}>B</span>
        {isBye ? "bye" : blackName}
        {result !== "unplayed" ? <span className="muted"> · now: {result}</span> : null}
      </div>

      {isBye ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <SubmitButton className="btn secondary" name="result" value="bye">
            Count as bye
          </SubmitButton>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <SubmitButton name="result" value="white">
              White won
            </SubmitButton>
            <SubmitButton className="btn secondary" name="result" value="draw">
              Draw
            </SubmitButton>
            <SubmitButton name="result" value="black">
              Black won
            </SubmitButton>
          </div>

          <PgnInput defaultValue={pgn ?? ""} />

          {result !== "unplayed" ? (
            <div>
              <button
                type="button"
                className="btn secondary"
                style={{ minHeight: 30, fontSize: 12 }}
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          ) : null}
        </>
      )}
    </form>
  );
}

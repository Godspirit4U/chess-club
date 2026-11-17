"use client";

import { useState } from "react";
import {
  createPlayoff,
  createRoundRobin,
  generateRound
} from "@/lib/tournament-actions";
import SubmitButton from "@/components/SubmitButton";

type Mode = "swiss" | "roundrobin" | "playoff" | null;

export default function AddRound({
  tournamentId,
  slug,
  canAddSwiss,
  nextRoundNumber
}: {
  tournamentId: string;
  slug: string;
  canAddSwiss: boolean;
  nextRoundNumber: number;
}) {
  const [mode, setMode] = useState<Mode>(null);

  return (
    <section style={{ marginTop: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>Rounds</h2>
        <button
          type="button"
          className="btn"
          onClick={() => setMode(mode ? null : "swiss")}
          aria-expanded={mode !== null}
        >
          {mode ? "Cancel" : "Add round"}
        </button>
      </div>

      {mode === null ? (
        <p className="muted small" style={{ marginTop: 8 }}>
          Add a round when you are ready. Choose the format first.
        </p>
      ) : null}

      {mode !== null ? (
        <div className="card" style={{ marginTop: 12 }}>
          <p className="small" style={{ marginTop: 0, fontWeight: 600 }}>
            What kind of round?
          </p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className={mode === "swiss" ? "btn" : "btn secondary"}
              onClick={() => setMode("swiss")}
            >
              Swiss
            </button>
            <button
              type="button"
              className={mode === "roundrobin" ? "btn" : "btn secondary"}
              onClick={() => setMode("roundrobin")}
            >
              Round robin
            </button>
            <button
              type="button"
              className={mode === "playoff" ? "btn" : "btn secondary"}
              onClick={() => setMode("playoff")}
            >
              Playoff
            </button>
          </div>

          <div style={{ marginTop: 16 }}>
            {mode === "swiss" ? (
              canAddSwiss ? (
                <form action={generateRound} style={{ display: "grid", gap: 10, maxWidth: 360 }}>
                  <input type="hidden" name="tournament_id" value={tournamentId} />
                  <input type="hidden" name="slug" value={slug} />

                  <div className="field" style={{ margin: 0 }}>
                    <label htmlFor="pairing_format">Pairing method</label>
                    <select id="pairing_format" name="pairing_format" defaultValue="swiss">
                      <option value="swiss">Swiss: by score, no repeat opponents</option>
                      <option value="random">Random draw</option>
                    </select>
                  </div>

                  <div>
                    <SubmitButton>Generate round {nextRoundNumber}</SubmitButton>
                  </div>
                </form>
              ) : (
                <p className="muted small" style={{ margin: 0 }}>
                  Publish the draft round first.
                </p>
              )
            ) : null}

            {mode === "roundrobin" ? (
              <form action={createRoundRobin} style={{ display: "grid", gap: 10, maxWidth: 360 }}>
                <input type="hidden" name="tournament_id" value={tournamentId} />
                <input type="hidden" name="slug" value={slug} />

                <div className="field" style={{ margin: 0 }}>
                  <label htmlFor="games_each">Rounds to create</label>
                  <input
                    id="games_each"
                    name="games_each"
                    type="number"
                    min={1}
                    max={11}
                    defaultValue={3}
                  />
                  <p className="muted small" style={{ margin: "4px 0 0" }}>
                    Each player plays this many games, against different opponents.
                  </p>
                </div>

                <div>
                  <SubmitButton>Create schedule</SubmitButton>
                </div>
              </form>
            ) : null}

            {mode === "playoff" ? (
              <form action={createPlayoff} style={{ display: "grid", gap: 10, maxWidth: 420 }}>
                <input type="hidden" name="tournament_id" value={tournamentId} />
                <input type="hidden" name="slug" value={slug} />

                <p className="muted small" style={{ margin: 0 }}>
                  Takes the top four from the table and builds Match 1, Match 2, Match 3 and the
                  Final. Winners move on as you enter results.
                </p>

                <div>
                  <SubmitButton>Create playoff</SubmitButton>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

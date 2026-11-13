"use client";

import { useState } from "react";

export default function ChessAccounts({
  defaultPlatform,
  defaultLichess,
  defaultChesscom
}: {
  defaultPlatform: string;
  defaultLichess: string;
  defaultChesscom: string;
}) {
  const [platform, setPlatform] = useState(defaultPlatform || "none");

  const showLichess = platform === "lichess" || platform === "both";
  const showChesscom = platform === "chesscom" || platform === "both";

  return (
    <>
      <div className="field">
        <label htmlFor="chess_platform">Where do you play online?</label>
        <select
          id="chess_platform"
          name="chess_platform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        >
          <option value="none">I do not play online</option>
          <option value="lichess">Lichess</option>
          <option value="chesscom">Chess.com</option>
          <option value="both">Both</option>
        </select>
      </div>

      {showLichess ? (
        <div className="field">
          <label htmlFor="lichess_username">Lichess username</label>
          <input
            id="lichess_username"
            name="lichess_username"
            defaultValue={defaultLichess}
            placeholder="your lichess name"
          />
        </div>
      ) : null}

      {showChesscom ? (
        <div className="field">
          <label htmlFor="chesscom_username">Chess.com username</label>
          <input
            id="chesscom_username"
            name="chesscom_username"
            defaultValue={defaultChesscom}
            placeholder="your chess.com name"
          />
        </div>
      ) : null}

      {platform === "none" ? (
        <p className="muted small" style={{ margin: 0 }}>
          You can add one later.
        </p>
      ) : null}
    </>
  );
}

"use client";

import { useRef, useState } from "react";

export default function PgnInput({ defaultValue = "" }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  const [status, setStatus] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function paste() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        setStatus("Clipboard is empty");
        return;
      }
      setValue(text);
      setStatus("Pasted");
      window.setTimeout(() => setStatus(null), 1500);
    } catch {
      // Browsers block clipboard reads without permission; fall back to focus.
      inputRef.current?.focus();
      setStatus("Press and hold to paste");
      window.setTimeout(() => setStatus(null), 2500);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
        <input
          ref={inputRef}
          name="pgn"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="PGN, optional"
          style={{ flex: 1, minWidth: 0 }}
        />
        <button
          type="button"
          className="btn secondary"
          onClick={paste}
          style={{ minHeight: 36, fontSize: 13, whiteSpace: "nowrap" }}
        >
          Paste PGN
        </button>
      </div>
      {status ? (
        <p className="small muted" style={{ margin: "4px 0 0" }}>
          {status}
        </p>
      ) : null}
    </div>
  );
}

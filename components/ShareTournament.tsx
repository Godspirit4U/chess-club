"use client";

import { useState } from "react";

export default function ShareTournament({
  url,
  shortUrl,
  code,
  title
}: {
  url: string;
  shortUrl: string;
  code: string;
  title: string;
}) {
  const [copied, setCopied] = useState<"link" | "short" | "code" | null>(null);

  async function copy(value: string, which: "link" | "short" | "code") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  async function share() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url: shortUrl });
        return;
      } catch {
        /* the user cancelled */
      }
    }
    void copy(shortUrl, "short");
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2 style={{ fontSize: 16 }}>Share this tournament</h2>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" className="btn" onClick={share}>
          Share
        </button>

        <button
          type="button"
          className="btn secondary"
          onClick={() => copy(url, "link")}
        >
          {copied === "link" ? "Copied" : "Copy link"}
        </button>

        <button
          type="button"
          className="btn secondary"
          onClick={() => copy(shortUrl, "short")}
        >
          {copied === "short" ? "Copied" : "Copy short link"}
        </button>
      </div>

      <p className="small" style={{ marginTop: 12, marginBottom: 4 }}>
        Short link
      </p>
      <p className="small" style={{ margin: 0, wordBreak: "break-all" }}>
        <code>{shortUrl}</code>
      </p>

      <p className="small" style={{ marginTop: 12, marginBottom: 4 }}>
        Share code
      </p>
      <p style={{ margin: 0, display: "flex", gap: 10, alignItems: "center" }}>
        <strong style={{ fontSize: 20, letterSpacing: 2 }}>{code}</strong>
        <button
          type="button"
          className="btn secondary"
          style={{ minHeight: 32, fontSize: 13 }}
          onClick={() => copy(code, "code")}
        >
          {copied === "code" ? "Copied" : "Copy code"}
        </button>
      </p>

      <p className="muted small" style={{ marginTop: 12, marginBottom: 0 }}>
        Anyone with the code can open the tournament at <code>/t/{code}</code>. If they are
        already registered, the page shows their registration straight away.
      </p>
    </div>
  );
}

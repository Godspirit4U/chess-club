"use client";

import { useState } from "react";

export default function ShareTournament({
  title,
  summary,
  url,
  qr
}: {
  title: string;
  summary: string;
  url: string;
  qr: string;
}) {
  const [copied, setCopied] = useState(false);

  const message = [
    `*${title}*`,
    "",
    summary,
    "",
    `Click this link to register: ${url}`
  ].join("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2 style={{ fontSize: 16 }}>Share this tournament</h2>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <a
          className="btn"
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noreferrer"
        >
          Share on WhatsApp
        </a>

        <button type="button" className="btn secondary" onClick={copy}>
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div
          aria-hidden="true"
          style={{ width: 148, height: 148 }}
          dangerouslySetInnerHTML={{ __html: qr }}
        />
        <div style={{ minWidth: 0 }}>
          <p className="small" style={{ marginTop: 0 }}>
            Scan to open the tournament.
          </p>
          <p className="muted small" style={{ wordBreak: "break-all", marginBottom: 0 }}>
            {url}
          </p>
        </div>
      </div>

      <p className="muted small" style={{ marginTop: 12, marginBottom: 0 }}>
        The WhatsApp message sends the name, a one-line summary and the link.
      </p>
    </div>
  );
}

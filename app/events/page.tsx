import type { Metadata } from "next";

export const metadata: Metadata = { title: "Events" };

export default function Page() {
  return (
    <>
      <h1>Events</h1>
      <p className="muted">Tournaments, training sessions and casual meets.</p>
      <p className="empty">This page is being built. The layout and the copy are settled; the data lands next.</p>
    </>
  );
}

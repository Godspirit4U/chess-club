import type { Metadata } from "next";

export const metadata: Metadata = { title: "Puzzles" };

export default function Page() {
  return (
    <>
      <h1>Puzzles</h1>
      <p className="muted">One position a day. Solve it on the board and your count goes up.</p>
      <p className="empty">This page is being built. The layout and the copy are settled; the data lands next.</p>
    </>
  );
}

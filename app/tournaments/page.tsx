import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tournaments" };

export default function Page() {
  return (
    <>
      <h1>Tournaments</h1>
      <p className="muted">Every tournament, in three groups: running now, coming up, and finished.</p>
      <p className="empty">This page is being built. The layout and the copy are settled; the data lands next.</p>
    </>
  );
}

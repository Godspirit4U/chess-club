import type { Metadata } from "next";

export const metadata: Metadata = { title: "About the club" };

export default function Page() {
  return (
    <>
      <h1>About the club</h1>
      <p className="muted">Who we are, when we meet, and how the club is run.</p>
      <p className="empty">This page is being built. The layout and the copy are settled; the data lands next.</p>
    </>
  );
}

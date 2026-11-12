import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact" };

export default function Page() {
  return (
    <>
      <h1>Contact</h1>
      <p className="muted">How to reach the committee.</p>
      <p className="empty">This page is being built. The layout and the copy are settled; the data lands next.</p>
    </>
  );
}

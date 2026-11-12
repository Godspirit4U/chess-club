import type { Metadata } from "next";

export const metadata: Metadata = { title: "Your profile" };

export default function Page() {
  return (
    <>
      <h1>Your profile</h1>
      <p className="muted">Your tournaments, your games and your puzzle count.</p>
      <p className="empty">This page is being built. The layout and the copy are settled; the data lands next.</p>
    </>
  );
}

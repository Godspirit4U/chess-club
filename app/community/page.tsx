import type { Metadata } from "next";

export const metadata: Metadata = { title: "Community" };

export default function Page() {
  return (
    <>
      <h1>Community</h1>
      <p className="muted">Find members, message them, and talk in the general room.</p>
      <p className="empty">This page is being built. The layout and the copy are settled; the data lands next.</p>
    </>
  );
}

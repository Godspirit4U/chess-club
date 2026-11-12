import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in" };

export default function Page() {
  return (
    <>
      <h1>Sign in</h1>
      <p className="muted">Use your college email and password.</p>
      <p className="empty">This page is being built. The layout and the copy are settled; the data lands next.</p>
    </>
  );
}

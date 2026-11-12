import type { Metadata } from "next";

export const metadata: Metadata = { title: "Blog" };

export default function Page() {
  return (
    <>
      <h1>Blog</h1>
      <p className="muted">Announcements, recaps and reports from the club.</p>
      <p className="empty">This page is being built. The layout and the copy are settled; the data lands next.</p>
    </>
  );
}

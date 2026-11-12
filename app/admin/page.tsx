import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <>
      <h1>Admin</h1>
      <p className="muted">Create tournaments, post to the blog, add puzzles, and manage admins.</p>
      <p className="empty">The admin area is being built. Sign-in and roles come first, then the tournament console.</p>
    </>
  );
}

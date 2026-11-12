import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.role === "member") redirect("/");

  return (
    <div className="stack">
      <nav
        className="small"
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          borderBottom: "1px solid var(--border)",
          paddingBottom: 12
        }}
        aria-label="Admin"
      >
        <Link href="/admin">Dashboard</Link>
        <Link href="/admin/tournaments/new">New tournament</Link>
        <Link href="/admin/blog">Blog</Link>
        <Link href="/admin/puzzles">Puzzles</Link>
        <Link href="/admin/events">Events</Link>
        <Link href="/tournaments">Public tournaments</Link>
      </nav>
      {children}
    </div>
  );
}

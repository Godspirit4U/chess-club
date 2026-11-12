import type { Metadata } from "next";
import Link from "next/link";
import { createClient, getCurrentProfile, isConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const profile = await getCurrentProfile();

  let drafts = 0;
  let open = 0;
  let running = 0;

  if (isConfigured) {
    const supabase = createClient();
    const { data } = await supabase.from("tournaments").select("status");
    for (const row of data ?? []) {
      if (row.status === "draft") drafts++;
      if (row.status === "open") open++;
      if (row.status === "running") running++;
    }
  }

  return (
    <>
      <h1>Admin</h1>
      <p className="muted">Signed in as {profile?.full_name}.</p>

      <div className="grid three" style={{ marginTop: 20 }}>
        <div className="card">
          <h2>{running}</h2>
          <p className="muted small">Running now</p>
        </div>
        <div className="card">
          <h2>{open}</h2>
          <p className="muted small">Open for registration</p>
        </div>
        <div className="card">
          <h2>{drafts}</h2>
          <p className="muted small">Drafts</p>
        </div>
      </div>

      <p style={{ marginTop: 24 }}>
        <Link className="btn" href="/admin/tournaments/new">
          Create a tournament
        </Link>
      </p>
    </>
  );
}

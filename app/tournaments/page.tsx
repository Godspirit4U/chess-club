import type { Metadata } from "next";
import Link from "next/link";
import { createClient, getCurrentProfile, isConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Tournaments",
  description: "Running, upcoming and completed tournaments at the SaiU Chess Club."
};
export const dynamic = "force-dynamic";

type Row = {
  slug: string;
  name: string;
  status: string;
  format: string;
  rounds: number;
  starts_at: string | null;
};

const labels: Record<string, string> = {
  swiss: "Swiss",
  round_robin: "Round robin",
  knockout: "Knockout",
  groups_knockout: "Groups then knockout",
  custom: "Custom"
};

function Card({ t }: { t: Row }) {
  return (
    <Link href={`/tournaments/${t.slug}`} className="card" style={{ display: "block" }}>
      <h3 style={{ marginBottom: 4 }}>{t.name}</h3>
      <p className="muted small" style={{ margin: 0 }}>
        {labels[t.format] ?? t.format} · {t.rounds} rounds
        {t.starts_at ? ` · ${new Date(t.starts_at).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short"
        })}` : ""}
      </p>
    </Link>
  );
}

export default async function TournamentsPage() {
  const profile = await getCurrentProfile();
  const isAdmin = Boolean(profile && profile.role !== "member");

  let rows: Row[] = [];

  if (isConfigured) {
    const supabase = createClient();
    const { data } = await supabase
      .from("tournaments")
      .select("slug,name,status,format,rounds,starts_at")
      .neq("status", "draft")
      .order("starts_at", { ascending: false });
    rows = (data as Row[]) ?? [];
  }

  const running = rows.filter((r) => r.status === "running");
  const upcoming = rows.filter((r) => r.status === "open");
  const done = rows.filter((r) => r.status === "completed");

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap"
        }}
      >
        <h1 style={{ margin: 0 }}>Tournaments</h1>
        {isAdmin ? (
          <Link className="btn" href="/admin/tournaments/new">
            Create a tournament
          </Link>
        ) : null}
      </div>



      {running.length > 0 ? (
        <section style={{ marginTop: 24 }}>
          <h2>Running now</h2>
          <div className="grid two">
            {running.map((t) => (
              <Card key={t.slug} t={t} />
            ))}
          </div>
        </section>
      ) : null}

      {upcoming.length > 0 ? (
        <section style={{ marginTop: 24 }}>
          <h2>Coming up</h2>
          <div className="grid two">
            {upcoming.map((t) => (
              <Card key={t.slug} t={t} />
            ))}
          </div>
        </section>
      ) : null}

      {done.length > 0 ? (
        <section style={{ marginTop: 24 }}>
          <h2>Completed</h2>
          <div className="grid two">
            {done.map((t) => (
              <Card key={t.slug} t={t} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Tournaments" };
export const dynamic = "force-dynamic";

export default async function AdminTournamentsPage() {
  const supabase = createClient();

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("id,slug,name,status,format,rounds,starts_at,created_at")
    .order("created_at", { ascending: false });

  const ids = (tournaments ?? []).map((t) => t.id);
  const { data: players } = ids.length
    ? await supabase.from("tournament_players").select("tournament_id").in("tournament_id", ids)
    : { data: [] as { tournament_id: string }[] };

  const counts = new Map<string, number>();
  for (const p of players ?? []) {
    counts.set(p.tournament_id, (counts.get(p.tournament_id) ?? 0) + 1);
  }

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
        <Link className="btn" href="/admin/tournaments/new">
          Create a tournament
        </Link>
      </div>
      <p className="muted">Every tournament, whatever its status.</p>

      {(tournaments ?? []).length === 0 ? (
        <p className="empty">No tournaments yet. Create one and it appears here and on the public list.</p>
      ) : (
        <table style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Players</th>
              <th>Rounds</th>
              <th>Starts</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(tournaments ?? []).map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td className="muted small">{t.status}</td>
                <td className="small">{counts.get(t.id) ?? 0}</td>
                <td className="small">{t.rounds}</td>
                <td className="small muted">
                  {t.starts_at
                    ? new Date(t.starts_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short"
                      })
                    : "—"}
                </td>
                <td>
                  <Link href={`/admin/tournaments/${t.slug}/console`}>Console</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

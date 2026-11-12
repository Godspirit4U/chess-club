import type { Metadata } from "next";
import Link from "next/link";
import { createClient, getCurrentProfile, isConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Events",
  description: "Tournaments, training sessions and casual meets at the SaiU Chess Club."
};
export const dynamic = "force-dynamic";

type Event = {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  starts_at: string;
  location: string | null;
};

const kindLabel: Record<string, string> = {
  tournament: "Tournament",
  training: "Training",
  casual: "Casual meet",
  other: "Event"
};

export default async function EventsPage() {
  const profile = await getCurrentProfile();
  const isAdmin = Boolean(profile && profile.role !== "member");

  let events: Event[] = [];

  if (isConfigured) {
    const supabase = createClient();
    const { data } = await supabase
      .from("events")
      .select("id,title,description,kind,starts_at,location")
      .order("starts_at", { ascending: true });
    events = data ?? [];
  }

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.starts_at).getTime() >= now);
  const past = events
    .filter((e) => new Date(e.starts_at).getTime() < now)
    .reverse();

  const render = (list: Event[]) =>
    list.map((e) => (
      <div key={e.id} className="card" style={{ marginBottom: 12 }}>
        <p className="muted small" style={{ margin: 0 }}>
          {new Date(e.starts_at).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short"
          })}
          {e.location ? ` · ${e.location}` : ""}
        </p>
        <h3 style={{ margin: "4px 0" }}>{e.title}</h3>
        <p className="muted small" style={{ margin: 0 }}>
          {kindLabel[e.kind] ?? "Event"}
          {e.description ? ` · ${e.description}` : ""}
        </p>
      </div>
    ));

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
        <h1 style={{ margin: 0 }}>Events</h1>
        {isAdmin ? (
          <Link className="btn" href="/admin/events">
            Add an event
          </Link>
        ) : null}
      </div>
      <p className="muted">Everything the club is doing: tournaments, training and casual meets.</p>

      {events.length === 0 ? (
        <p className="empty">Nothing scheduled yet. Events appear here as the committee adds them.</p>
      ) : null}

      {upcoming.length > 0 ? (
        <section style={{ marginTop: 20 }}>
          <h2>Coming up</h2>
          {render(upcoming)}
        </section>
      ) : null}

      {past.length > 0 ? (
        <section style={{ marginTop: 24 }}>
          <h2>Past</h2>
          {render(past)}
        </section>
      ) : null}
    </>
  );
}

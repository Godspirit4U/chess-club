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
  slug: string;
  title: string;
  description: string | null;
  kind: string;
  format: string | null;
  starts_at: string;
  location: string | null;
  cover_path: string | null;
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
      .select("id,slug,title,description,kind,format,starts_at,location,cover_path")
      .order("starts_at", { ascending: true });
    events = data ?? [];
  }

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.starts_at).getTime() >= now);
  const past = events
    .filter((e) => new Date(e.starts_at).getTime() < now)
    .reverse();

  const render = (list: Event[]) =>
    list.map((e) => {
      const cover = e.cover_path
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers/${e.cover_path}`
        : null;

      return (
        <Link
          key={e.id}
          href={`/events/${e.slug}`}
          className="card"
          style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 12 }}
        >
          {cover ? (
            <img
              src={cover}
              alt=""
              width={88}
              height={88}
              style={{ width: 88, height: 88, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
            />
          ) : null}

          <span style={{ minWidth: 0 }}>
            <span className="muted small" style={{ display: "block" }}>
              {new Date(e.starts_at).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short"
              })}
              {e.location ? ` · ${e.location}` : ""}
            </span>
            <span style={{ display: "block", fontWeight: 600, marginTop: 2 }}>{e.title}</span>
            <span className="muted small" style={{ display: "block" }}>
              {kindLabel[e.kind] ?? "Event"}
              {e.format ? ` · ${e.format}` : ""}
            </span>
          </span>
        </Link>
      );
    });

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

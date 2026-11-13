import type { Metadata } from "next";
import Link from "next/link";
import { createClient, getCurrentProfile, isConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

type T = { slug: string; name: string; status: string; starts_at: string | null };
type E = { id: string; title: string; starts_at: string; kind: string };
type F = { id: string; name: string; body: string; kind: string; created_at: string };

const kindLabel: Record<string, string> = {
  problem: "Problem",
  bug: "Bug",
  feedback: "Feedback",
  other: "Other"
};

function Panel({
  title,
  count,
  href,
  hrefLabel,
  children
}: {
  title: string;
  count: number;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 8
        }}
      >
        <h2 style={{ margin: 0, fontSize: 17 }}>
          {title} <span className="muted" style={{ fontWeight: 400 }}>({count})</span>
        </h2>
        {href ? (
          <Link href={href} className="small">
            {hrefLabel ?? "View"}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default async function AdminPage() {
  const profile = await getCurrentProfile();

  let tournaments: T[] = [];
  let events: E[] = [];
  let feedback: F[] = [];
  let members = 0;

  if (isConfigured) {
    const supabase = createClient();

    const [{ data: t }, { data: e }, { data: f }, { count }] = await Promise.all([
      supabase
        .from("tournaments")
        .select("slug,name,status,starts_at")
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("events")
        .select("id,title,starts_at,kind")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(5),
      supabase
        .from("contact_messages")
        .select("id,name,body,kind,created_at")
        .order("created_at", { ascending: false })
        .limit(3),
      supabase.from("profiles").select("id", { count: "exact", head: true })
    ]);

    tournaments = (t as T[]) ?? [];
    events = (e as E[]) ?? [];
    feedback = (f as F[]) ?? [];
    members = count ?? 0;
  }

  const running = tournaments.filter((x) => x.status === "running");
  const open = tournaments.filter((x) => x.status === "open");
  const drafts = tournaments.filter((x) => x.status === "draft");
  const completed = tournaments.filter((x) => x.status === "completed");

  const row = (label: string, meta: string, href: string, linkLabel = "Open") => (
    <div
      key={href}
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        alignItems: "baseline",
        borderTop: "1px solid var(--border)",
        paddingTop: 8
      }}
    >
      <span>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <br />
        <span className="muted small">{meta}</span>
      </span>
      <Link href={href} className="small">
        {linkLabel}
      </Link>
    </div>
  );

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>


      <div className="grid two" style={{ marginTop: 20 }}>
        <Panel
          title="Running now"
          count={running.length}
          href="/tournaments"
          hrefLabel="Public list"
        >
          {(
            running.slice(0, 4).map((t) =>
              row(t.name, "In progress", `/tournaments/${t.slug}/console`, "Console")
            )
          )}
        </Panel>

        <Panel title="Open for registration" count={open.length} href="/admin/tournaments/new" hrefLabel="New">
          {(
            open.slice(0, 4).map((t) =>
              row(
                t.name,
                t.starts_at
                  ? `Starts ${new Date(t.starts_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short"
                    })}`
                  : "No start date",
                `/tournaments/${t.slug}/console`,
                "Console"
              )
            )
          )}
        </Panel>

        <Panel title="Upcoming events" count={events.length} href="/admin/events" hrefLabel="Add">
          {(
            events.map((e) =>
              row(
                e.title,
                new Date(e.starts_at).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short"
                }),
                "/admin/events",
                "Manage"
              )
            )
          )}
        </Panel>

        <Panel title="Recent feedback" count={feedback.length} href="/admin/feedback" hrefLabel="All">
          {(
            feedback.map((f) =>
              row(
                `${kindLabel[f.kind] ?? "Other"} from ${f.name}`,
                f.body.slice(0, 70) + (f.body.length > 70 ? "…" : ""),
                "/admin/feedback",
                "Read"
              )
            )
          )}
        </Panel>

        <Panel title="Drafts" count={drafts.length} href="/admin/tournaments/new" hrefLabel="New">
          {(
            drafts.slice(0, 4).map((t) =>
              row(t.name, "Not published", `/tournaments/${t.slug}/console`, "Console")
            )
          )}
        </Panel>

        <Panel title="Members" count={members} href="/admin/people" hrefLabel="Manage">
          <p className="muted small" style={{ margin: 0 }}>
            {completed.length} completed{" "}
            {completed.length === 1 ? "tournament" : "tournaments"} on record. Add or remove
            members, and change roles, from People.
          </p>
        </Panel>
      </div>
    </>
  );
}

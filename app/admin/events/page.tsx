import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createEvent } from "./actions";

export const metadata: Metadata = { title: "Events" };
export const dynamic = "force-dynamic";

type Props = { searchParams: { error?: string } };

export default async function AdminEventsPage({ searchParams }: Props) {
  const supabase = createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id,title,starts_at,kind")
    .order("starts_at", { ascending: false })
    .limit(30);

  return (
    <>
      <h1>Events</h1>

      {searchParams.error ? (
        <p role="alert" style={{ color: "var(--danger)", fontSize: 14 }}>
          {searchParams.error}
        </p>
      ) : null}

      <form action={createEvent} className="card stack" style={{ marginTop: 16 }}>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" required placeholder="Beginners session" />
        </div>
        <div className="field">
          <label htmlFor="kind">Kind</label>
          <select id="kind" name="kind" defaultValue="training">
            <option value="tournament">Tournament</option>
            <option value="training">Training session</option>
            <option value="casual">Casual meet</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="starts_at">Starts</label>
          <input id="starts_at" name="starts_at" type="datetime-local" required />
        </div>
        <div className="field">
          <label htmlFor="location">Venue</label>
          <input id="location" name="location" />
        </div>
        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={3} />
        </div>
        <button className="btn" type="submit">
          Add event
        </button>
      </form>

      <section style={{ marginTop: 28 }}>
        <h2>All events</h2>
        {(events ?? []).length === 0 ? (
          <p className="empty">No events yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Kind</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {(events ?? []).map((e) => (
                <tr key={e.id}>
                  <td>{e.title}</td>
                  <td className="muted small">{e.kind}</td>
                  <td className="muted small">
                    {new Date(e.starts_at).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short"
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const supabase = createClient();
  const { data: messages } = await supabase
    .from("contact_messages")
    .select("id,name,email,body,created_at,handled_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <h1>Messages</h1>
      <p className="muted">Sent through the contact form on the site.</p>

      {(messages ?? []).length === 0 ? (
        <p className="empty">Nothing yet. Messages from the contact form land here.</p>
      ) : (
        <div className="stack" style={{ marginTop: 16 }}>
          {(messages ?? []).map((m) => (
            <article key={m.id} className="card">
              <p className="small muted" style={{ margin: 0 }}>
                {new Date(m.created_at).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short"
                })}
                {" · "}
                <a href={`mailto:${m.email}`}>{m.name}</a>
              </p>
              <p style={{ whiteSpace: "pre-wrap", margin: "8px 0 0" }}>{m.body}</p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

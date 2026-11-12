import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Feedback" };
export const dynamic = "force-dynamic";

const kindLabel: Record<string, string> = {
  problem: "Problem",
  bug: "Bug",
  feedback: "Feedback",
  other: "Other"
};

export default async function FeedbackPage() {
  const supabase = createClient();
  const { data: messages } = await supabase
    .from("contact_messages")
    .select("id,name,email,body,kind,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <h1>Feedback</h1>
      <p className="muted">
        Everything sent through the contact form: problems, bugs and suggestions.
      </p>

      {(messages ?? []).length === 0 ? (
        <p className="empty">
          Nothing yet. When a member reports a problem or sends an idea, it appears here.
        </p>
      ) : (
        <div className="stack" style={{ marginTop: 16 }}>
          {(messages ?? []).map((m) => (
            <article key={m.id} className="card">
              <p className="small" style={{ margin: 0 }}>
                <span className="badge">{kindLabel[m.kind] ?? "Other"}</span>{" "}
                <span className="muted">
                  {new Date(m.created_at).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short"
                  })}
                </span>
              </p>
              <p className="small" style={{ margin: "6px 0 0" }}>
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

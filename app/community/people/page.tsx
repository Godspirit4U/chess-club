import type { Metadata } from "next";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { removeConnection, respondRequest, sendRequest } from "../actions";

export const metadata: Metadata = { title: "Find people" };
export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const profile = await getCurrentProfile();
  const supabase = createClient();

  const [{ data: members }, { data: links }] = await Promise.all([
    supabase.from("profiles").select("id,full_name,chess_username,role").order("full_name"),
    supabase
      .from("connections")
      .select("id,requester_id,addressee_id,status")
      .or(`requester_id.eq.${profile!.id},addressee_id.eq.${profile!.id}`)
  ]);

  const byOther = new Map<string, { id: string; status: string; incoming: boolean }>();
  for (const c of links ?? []) {
    const other = c.requester_id === profile!.id ? c.addressee_id : c.requester_id;
    byOther.set(other, {
      id: c.id,
      status: c.status,
      incoming: c.addressee_id === profile!.id
    });
  }

  const incoming = (links ?? []).filter(
    (c) => c.status === "pending" && c.addressee_id === profile!.id
  );
  const nameOf = new Map((members ?? []).map((m) => [m.id, m.full_name]));

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Find people</h2>
      <p className="muted small">
        Send a request to anyone. Once they accept, a private chat appears in your sidebar.
      </p>

      {incoming.length > 0 ? (
        <section style={{ marginTop: 20 }}>
          <h3>Requests waiting for you ({incoming.length})</h3>
          {incoming.map((c) => (
            <div key={c.id} className="card" style={{ marginBottom: 8 }}>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap"
                }}
              >
                <span>{nameOf.get(c.requester_id) ?? "Member"}</span>
                <span style={{ display: "flex", gap: 8 }}>
                  <form action={respondRequest}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="decision" value="accepted" />
                    <button className="btn" type="submit" style={{ minHeight: 36 }}>
                      Accept
                    </button>
                  </form>
                  <form action={respondRequest}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="decision" value="declined" />
                    <button className="btn secondary" type="submit" style={{ minHeight: 36 }}>
                      Decline
                    </button>
                  </form>
                </span>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      <section style={{ marginTop: 24 }}>
        <h3>Everyone ({(members ?? []).length})</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Chess username</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(members ?? []).map((m) => {
              const link = byOther.get(m.id);
              return (
                <tr key={m.id}>
                  <td>
                    {m.full_name}
                    {m.id === profile!.id ? <span className="muted small"> (you)</span> : null}
                    {m.role !== "member" ? (
                      <span className="badge" style={{ marginLeft: 8 }}>
                        {m.role.replace("_", " ")}
                      </span>
                    ) : null}
                  </td>
                  <td className="small muted">{m.chess_username ?? "—"}</td>
                  <td>
                    {m.id === profile!.id ? null : !link ? (
                      <form action={sendRequest}>
                        <input type="hidden" name="addressee_id" value={m.id} />
                        <button className="btn secondary" type="submit" style={{ minHeight: 36 }}>
                          Send request
                        </button>
                      </form>
                    ) : link.status === "accepted" ? (
                      <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <a href={`/community/${m.id}`}>Message</a>
                        <form action={removeConnection}>
                          <input type="hidden" name="id" value={link.id} />
                          <button
                            className="btn secondary"
                            type="submit"
                            style={{ minHeight: 32, fontSize: 13 }}
                          >
                            Remove
                          </button>
                        </form>
                      </span>
                    ) : link.status === "pending" ? (
                      <span className="muted small">
                        {link.incoming ? "Wants to connect" : "Request sent"}
                      </span>
                    ) : (
                      <span className="muted small">Declined</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}

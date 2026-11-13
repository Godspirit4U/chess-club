import type { Metadata } from "next";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { removeConnection, respondRequest, sendRequest } from "../actions";
import Avatar from "@/components/Avatar";
import SubmitButton from "@/components/SubmitButton";

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
                    <SubmitButton style={{ minHeight: 36 }}>
                      Accept
                    </SubmitButton>
                  </form>
                  <form action={respondRequest}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="decision" value="declined" />
                    <SubmitButton className="btn secondary" style={{ minHeight: 36 }}>
                      Decline
                    </SubmitButton>
                  </form>
                </span>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      <section style={{ marginTop: 24 }}>
        <h3>Everyone ({(members ?? []).length})</h3>

        {(members ?? []).map((m) => {
          const link = byOther.get(m.id);
          return (
            <div key={m.id} className="person-row">
              <Avatar name={m.full_name} />

              <div style={{ minWidth: 0 }}>
                <div className="person-name">
                  {m.full_name}
                  {m.id === profile!.id ? <span className="person-meta"> (you)</span> : null}
                </div>
                <div className="person-meta">
                  {m.chess_username ?? m.role.replace("_", " ")}
                </div>
              </div>

              <div className="person-actions">
                {m.id === profile!.id ? null : !link ? (
                  <form action={sendRequest}>
                    <input type="hidden" name="addressee_id" value={m.id} />
                    <SubmitButton className="btn secondary" style={{ minHeight: 36 }}>
                      Connect
                    </SubmitButton>
                  </form>
                ) : link.status === "accepted" ? (
                  <>
                    <a href={`/community/${m.id}`}>Message</a>
                    <form action={removeConnection}>
                      <input type="hidden" name="id" value={link.id} />
                      <SubmitButton
                        className="btn secondary"
                        style={{ minHeight: 32, fontSize: 13 }}
                      >
                        Remove
                      </SubmitButton>
                    </form>
                  </>
                ) : link.status === "pending" ? (
                  link.incoming ? (
                    <span className="person-meta">Wants to connect</span>
                  ) : (
                    <>
                      <span className="person-meta">Requested</span>
                      <form action={removeConnection}>
                        <input type="hidden" name="id" value={link.id} />
                        <SubmitButton
                          className="btn secondary"
                          style={{ minHeight: 32, fontSize: 13 }}
                        >
                          Cancel
                        </SubmitButton>
                      </form>
                    </>
                  )
                ) : (
                  <span className="person-meta">Declined</span>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}

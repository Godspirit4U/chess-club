import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { setRole } from "./actions";

export const metadata: Metadata = { title: "People" };
export const dynamic = "force-dynamic";

type Props = { searchParams: { error?: string } };

export default async function PeoplePage({ searchParams }: Props) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "super_admin") redirect("/admin");

  const supabase = createClient();
  const { data: people } = await supabase
    .from("profiles")
    .select("id,full_name,email,role")
    .order("role", { ascending: true })
    .order("full_name", { ascending: true });

  return (
    <>
      <h1>People</h1>
      <p className="muted">
        Promote someone by their email address. They must have signed up already.
      </p>

      {searchParams.error ? (
        <p role="alert" style={{ color: "var(--danger)", fontSize: 14 }}>
          {searchParams.error}
        </p>
      ) : null}

      <form action={setRole} className="card stack" style={{ marginTop: 16, maxWidth: 520 }}>
        <div className="field">
          <label htmlFor="email">Email address</label>
          <input id="email" name="email" type="email" required placeholder="name@scds.saiuniversity.edu.in" />
        </div>
        <div className="field">
          <label htmlFor="role">Role</label>
          <select id="role" name="role" defaultValue="admin">
            <option value="admin">Admin</option>
            <option value="super_admin">Super admin</option>
            <option value="member">Member</option>
          </select>
        </div>
        <button className="btn" type="submit">
          Save role
        </button>
      </form>

      <section style={{ marginTop: 28 }}>
        <h2>Everyone ({(people ?? []).length})</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {(people ?? []).map((p) => (
              <tr key={p.id}>
                <td>{p.full_name}</td>
                <td className="small muted">{p.email}</td>
                <td className="small">{p.role.replace("_", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

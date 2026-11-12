import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { hasServiceRole } from "@/lib/supabase/admin";
import PeopleTable from "@/components/PeopleTable";
import { addMember } from "./actions";

export const metadata: Metadata = { title: "People" };
export const dynamic = "force-dynamic";

type Props = { searchParams: { error?: string; done?: string } };

export default async function PeoplePage({ searchParams }: Props) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "member") redirect("/admin");

  const supabase = createClient();
  const { data: people } = await supabase
    .from("profiles")
    .select("id,full_name,email,role")
    .order("full_name", { ascending: true });

  return (
    <>
      <h1>People</h1>
      <p className="muted">Search for anyone in the club, change their role, or remove them.</p>

      {searchParams.error ? (
        <p role="alert" style={{ color: "var(--danger)", fontSize: 14 }}>
          {searchParams.error}
        </p>
      ) : null}

      {searchParams.done ? (
        <p role="status" style={{ color: "var(--accent)", fontSize: 14 }}>
          {searchParams.done}.
        </p>
      ) : null}

      <PeopleTable people={(people ?? []) as any} myId={profile.id} myRole={profile.role} />

      <section style={{ marginTop: 36 }}>
        <h2>Add someone who could not register</h2>
        <p className="muted small">
          Creates an account with a password you choose. Tell them the password; they can
          change it once password settings are added.
        </p>

        {hasServiceRole ? (
          <form action={addMember} className="card stack" style={{ maxWidth: 480 }}>
            <div className="field">
              <label htmlFor="full_name">Full name</label>
              <input id="full_name" name="full_name" required />
            </div>
            <div className="field">
              <label htmlFor="email">College email</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div className="field">
              <label htmlFor="password">Temporary password</label>
              <input id="password" name="password" type="text" minLength={8} required />
            </div>
            <button className="btn" type="submit">
              Add member
            </button>
          </form>
        ) : (
          <p className="empty">
            Adding or removing members needs the service role key. Add
            SUPABASE_SERVICE_ROLE_KEY to the Vercel environment variables and redeploy, and
            this form appears.
          </p>
        )}
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { updateTournament } from "@/lib/tournament-actions";
import SubmitButton from "@/components/SubmitButton";

export const metadata: Metadata = { title: "Edit tournament" };
export const dynamic = "force-dynamic";

type Props = { params: { slug: string }; searchParams: { error?: string } };

function localInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditTournamentPage({ params, searchParams }: Props) {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  if (me.role === "member") redirect(`/tournaments/${params.slug}`);

  const supabase = createClient();
  const { data: t } = await supabase
    .from("tournaments")
    .select(
      "id,slug,name,description,format,rounds,time_control,rules,structure,starts_at,registration_deadline,status"
    )
    .eq("slug", params.slug)
    .single();

  if (!t) notFound();

  return (
    <>
      <p className="small">
        <Link href={`/tournaments/${t.slug}`}>{t.name}</Link>
      </p>
      <h1>Edit tournament</h1>

      {searchParams.error ? (
        <p role="alert" style={{ color: "var(--danger)", fontSize: 14 }}>
          {searchParams.error}
        </p>
      ) : null}

      <form action={updateTournament} className="card stack" style={{ marginTop: 16, maxWidth: 680 }}>
        <input type="hidden" name="id" value={t.id} />
        <input type="hidden" name="slug" value={t.slug} />

        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" defaultValue={t.name} required />
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={3} defaultValue={t.description ?? ""} />
        </div>

        <div className="grid two" style={{ gap: 16 }}>
          <div className="field">
            <label htmlFor="format">Format</label>
            <select id="format" name="format" defaultValue={t.format}>
              <option value="swiss">Swiss</option>
              <option value="round_robin">Round robin</option>
              <option value="knockout">Knockout</option>
              <option value="groups_knockout">Groups then knockout</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="rounds">Rounds</label>
            <input id="rounds" name="rounds" type="number" min={1} max={15} defaultValue={t.rounds} />
          </div>
        </div>

        <div className="grid two" style={{ gap: 16 }}>
          <div className="field">
            <label htmlFor="starts_at">Starts</label>
            <input
              id="starts_at"
              name="starts_at"
              type="datetime-local"
              defaultValue={localInput(t.starts_at)}
            />
          </div>

          <div className="field">
            <label htmlFor="registration_deadline">Registration closes</label>
            <input
              id="registration_deadline"
              name="registration_deadline"
              type="datetime-local"
              defaultValue={localInput(t.registration_deadline)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="time_control">Time control</label>
          <input id="time_control" name="time_control" defaultValue={t.time_control ?? ""} />
        </div>

        <div className="field">
          <label htmlFor="rules">Rules</label>
          <textarea id="rules" name="rules" rows={4} defaultValue={t.rules ?? ""} />
        </div>

        <div className="field">
          <label htmlFor="structure">Structure</label>
          <textarea id="structure" name="structure" rows={4} defaultValue={t.structure ?? ""} />
        </div>

        <SubmitButton>Save changes</SubmitButton>
      </form>
    </>
  );
}

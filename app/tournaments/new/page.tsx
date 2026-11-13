import type { Metadata } from "next";
import { createClient, getCurrentProfile, isConfigured } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createTournament } from "@/app/admin/tournaments/actions";

export const metadata: Metadata = { title: "New tournament" };
export const dynamic = "force-dynamic";

type Props = { searchParams: { error?: string } };

const formats = [
  { value: "swiss", label: "Swiss: everyone plays every round, similar scores meet" },
  { value: "round_robin", label: "Round robin: everyone plays everyone once" },
  { value: "knockout", label: "Knockout: a bracket, lose and you are out" },
  { value: "groups_knockout", label: "Groups then knockout" },
  { value: "custom", label: "Custom: you set every board by hand" }
];

async function lastTournament() {
  if (!isConfigured) return null;
  const supabase = createClient();
  const { data } = await supabase
    .from("tournaments")
    .select("rules,structure,rounds,time_control,format")
    .order("created_at", { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

export default async function NewTournamentPage({ searchParams }: Props) {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  if (me.role === "member") redirect("/tournaments");

  const last = await lastTournament();

  return (
    <>
      <h1>Create a tournament</h1>
      <p className="muted">
        The rules and structure default to your last tournament. Change what is different and
        leave the rest.
      </p>

      {searchParams.error ? (
        <p
          role="alert"
          style={{
            border: "1px solid #e3c9c9",
            background: "#fbf1f1",
            color: "#a32b2b",
            borderRadius: 6,
            padding: "10px 12px",
            fontSize: 14
          }}
        >
          {searchParams.error}
        </p>
      ) : null}

      <form action={createTournament} className="card stack" style={{ marginTop: 16 }}>
        <div className="field">
          <label htmlFor="name">Tournament name</label>
          <input id="name" name="name" required placeholder="Winter Rapid Open" />
        </div>

        <div className="field">
          <label htmlFor="description">Short description</label>
          <textarea id="description" name="description" rows={2} />
        </div>

        <div className="grid two" style={{ gap: 16 }}>
          <div className="field">
            <label htmlFor="format">Format</label>
            <select id="format" name="format" defaultValue={last?.format ?? "swiss"}>
              {formats.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="rounds">Rounds</label>
            <input
              id="rounds"
              name="rounds"
              type="number"
              min={1}
              max={15}
              defaultValue={last?.rounds ?? 5}
            />
          </div>
        </div>

        <div className="grid two" style={{ gap: 16 }}>
          <div className="field">
            <label htmlFor="starts_at">Starts</label>
            <input id="starts_at" name="starts_at" type="datetime-local" />
          </div>

          <div className="field">
            <label htmlFor="registration_deadline">Registration closes</label>
            <input id="registration_deadline" name="registration_deadline" type="datetime-local" />
          </div>
        </div>

        <div className="field">
          <label htmlFor="time_control">Time control</label>
          <input
            id="time_control"
            name="time_control"
            defaultValue={last?.time_control ?? "10+5"}
            placeholder="10+5"
          />
        </div>

        <div className="field">
          <label htmlFor="rules">Rules</label>
          <textarea id="rules" name="rules" rows={5} defaultValue={last?.rules ?? ""} />
        </div>

        <div className="field">
          <label htmlFor="structure">Structure</label>
          <textarea
            id="structure"
            name="structure"
            rows={4}
            defaultValue={last?.structure ?? ""}
            placeholder="How the event runs, round by round."
          />
        </div>

        <label style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 400 }}>
          <input
            type="checkbox"
            name="publish"
            style={{ width: 18, minHeight: 18 }}
            defaultChecked
          />
          Publish immediately and open registration
        </label>

        <button className="btn" type="submit">
          Create tournament
        </button>
      </form>
    </>
  );
}

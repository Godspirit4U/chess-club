import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateEvent, deleteEvent } from "../actions";
import ImageUpload from "@/components/ImageUpload";
import SubmitButton from "@/components/SubmitButton";
import ConfirmButton from "@/components/ConfirmButton";

export const metadata: Metadata = { title: "Edit event" };
export const dynamic = "force-dynamic";

type Props = { params: { id: string }; searchParams: { error?: string } };

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditEventPage({ params, searchParams }: Props) {
  const supabase = createClient();
  const { data: event } = await supabase
    .from("events")
    .select("id,slug,title,description,kind,format,starts_at,location,cover_path")
    .eq("id", params.id)
    .single();

  if (!event) notFound();

  return (
    <>
      <p className="small">
        <Link href="/admin/events">Events</Link>
      </p>
      <h1>Edit event</h1>

      {searchParams.error ? (
        <p role="alert" style={{ color: "var(--danger)", fontSize: 14 }}>
          {searchParams.error}
        </p>
      ) : null}

      <form action={updateEvent} className="card stack" style={{ marginTop: 16, maxWidth: 620 }}>
        <input type="hidden" name="id" value={event.id} />

        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" defaultValue={event.title} required />
        </div>

        <div className="grid two" style={{ gap: 16 }}>
          <div className="field">
            <label htmlFor="kind">Kind</label>
            <select id="kind" name="kind" defaultValue={event.kind}>
              <option value="tournament">Tournament</option>
              <option value="training">Training session</option>
              <option value="casual">Casual meet</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="format">Format</label>
            <input
              id="format"
              name="format"
              defaultValue={event.format ?? ""}
              placeholder="Swiss, Blitz, Beginner session"
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="starts_at">Starts</label>
          <input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            defaultValue={toLocalInput(event.starts_at)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="location">Venue</label>
          <input id="location" name="location" defaultValue={event.location ?? ""} />
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={4} defaultValue={event.description ?? ""} />
        </div>

        <ImageUpload initial={event.cover_path} />

        <SubmitButton>Save changes</SubmitButton>
      </form>

      <form action={deleteEvent} style={{ marginTop: 20 }}>
        <input type="hidden" name="id" value={event.id} />
        <ConfirmButton message="Delete this event?" style={{ color: "var(--danger)" }}>
          Delete this event
        </ConfirmButton>
      </form>
    </>
  );
}

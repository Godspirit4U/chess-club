import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/server";
import { createEvent } from "@/app/admin/events/actions";
import ImageUpload from "@/components/ImageUpload";
import SubmitButton from "@/components/SubmitButton";

export const metadata: Metadata = { title: "New event" };
export const dynamic = "force-dynamic";

type Props = { searchParams: { error?: string } };

export default async function NewEventPage({ searchParams }: Props) {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  if (me.role === "member") redirect("/events");

  return (
    <>
      <p className="small">
        <Link href="/events">Events</Link>
      </p>
      <h1>New event</h1>

      {searchParams.error ? (
        <p role="alert" style={{ color: "var(--danger)", fontSize: 14 }}>
          {searchParams.error}
        </p>
      ) : null}

      <form action={createEvent} className="card stack" style={{ marginTop: 16, maxWidth: 620 }}>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" required />
        </div>

        <div className="grid two" style={{ gap: 16 }}>
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
            <label htmlFor="format">Format</label>
            <input id="format" name="format" placeholder="Swiss, Blitz, Beginner session" />
          </div>
        </div>

        <div className="field">
          <label htmlFor="starts_at">Starts</label>
          <input id="starts_at" name="starts_at" type="datetime-local" required />
        </div>

        <div className="grid two" style={{ gap: 16 }}>
          <div className="field">
            <label htmlFor="location">Venue</label>
            <input id="location" name="location" />
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <input id="description" name="description" />
          </div>
        </div>

        <ImageUpload />
        <SubmitButton>Create event</SubmitButton>
      </form>
    </>
  );
}

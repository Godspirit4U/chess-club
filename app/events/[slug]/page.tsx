import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient, isConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

const kindLabel: Record<string, string> = {
  tournament: "Tournament",
  training: "Training session",
  casual: "Casual meet",
  other: "Event"
};

async function load(slug: string) {
  if (!isConfigured) return null;
  const supabase = createClient();
  const { data } = await supabase
    .from("events")
    .select("id,slug,title,description,kind,format,starts_at,location,cover_path")
    .eq("slug", slug)
    .single();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await load(params.slug);
  return { title: event?.title ?? "Event", description: event?.description ?? undefined };
}

export default async function EventPage({ params }: Props) {
  const event = await load(params.slug);
  if (!event) notFound();

  const cover = event.cover_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers/${event.cover_path}`
    : null;

  return (
    <article style={{ maxWidth: 720 }}>
      <p className="small">
        <Link href="/events">Events</Link>
      </p>

      <h1>{event.title}</h1>
      <p className="muted small">
        {kindLabel[event.kind] ?? "Event"}
        {event.format ? ` · ${event.format}` : ""} ·{" "}
        {new Date(event.starts_at).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short"
        })}
        {event.location ? ` · ${event.location}` : ""}
      </p>

      {cover ? (
        <div style={{ marginTop: 16, borderRadius: 6, overflow: "hidden" }}>
          <Image
            src={cover}
            alt=""
            width={1600}
            height={900}
            style={{ width: "100%", height: "auto", display: "block" }}
            priority
          />
        </div>
      ) : null}

      {event.description ? (
        <p style={{ whiteSpace: "pre-wrap", marginTop: 16 }}>{event.description}</p>
      ) : null}
    </article>
  );
}

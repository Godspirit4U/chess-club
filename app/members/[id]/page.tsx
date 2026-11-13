import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", params.id)
    .single();
  return { title: data?.full_name ?? "Member" };
}

export default async function MemberPage({ params }: Props) {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");

  const supabase = createClient();
  const { data: person } = await supabase
    .from("profiles")
    .select("id,full_name,avatar_path,role,chesscom_username,lichess_username,phone")
    .eq("id", params.id)
    .single();

  if (!person) notFound();

  return (
    <>
      <p className="small">
        <Link href="/community/people">People</Link>
      </p>

      <div className="card" style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <Avatar name={person.full_name} path={person.avatar_path} size={64} />
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 22 }}>{person.full_name}</h1>
          <p className="muted small" style={{ margin: "2px 0 0" }}>
            {person.role === "member" ? "Member" : person.role.replace("_", " ")}
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 16 }}>Where they play</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {person.chesscom_username ? (
            <a
              className="site-link"
              href={`https://www.chess.com/member/${person.chesscom_username}`}
              target="_blank"
              rel="noreferrer"
            >
              <span aria-hidden="true" className="site-mark">♟</span>
              <span>
                <strong>Chess.com</strong>{" "}
                <span className="site-user">{person.chesscom_username}</span>
              </span>
            </a>
          ) : null}

          {person.lichess_username ? (
            <a
              className="site-link"
              href={`https://lichess.org/@/${person.lichess_username}`}
              target="_blank"
              rel="noreferrer"
            >
              <span aria-hidden="true" className="site-mark">♞</span>
              <span>
                <strong>Lichess</strong>{" "}
                <span className="site-user">@{person.lichess_username}</span>
              </span>
            </a>
          ) : null}

          {!person.chesscom_username && !person.lichess_username ? (
            <p className="muted small" style={{ margin: 0 }}>
              No online accounts listed.
            </p>
          ) : null}
        </div>

        {person.id !== me.id ? (
          <p style={{ marginTop: 14, marginBottom: 0 }}>
            <Link className="btn" href={`/community/${person.id}`}>
              Message
            </Link>
          </p>
        ) : null}
      </div>
    </>
  );
}

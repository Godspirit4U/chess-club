"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
  room?: string;
  conversation_id?: string | null;
  profiles?: { full_name: string } | null;
};

export default function ChatRoom({
  room,
  conversationId,
  currentUserId,
  initialMessages,
  title,
  canModerate = false
}: {
  room: "general" | "admin" | "dm";
  conversationId?: string;
  currentUserId: string;
  initialMessages: Message[];
  title: string;
  canModerate?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`room-${room}-${conversationId ?? "main"}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: conversationId
            ? `conversation_id=eq.${conversationId}`
            : `room=eq.${room}`
        },
        async (payload) => {
          const row = payload.new as Message;
          if (!conversationId && row.room !== room) return;

          const { data: sender } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", row.sender_id)
            .single();

          setMessages((prev) =>
            prev.some((m) => m.id === row.id)
              ? prev
              : [...prev, { ...row, profiles: sender ?? null }]
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages" },
        (payload) => {
          const gone = (payload.old as { id?: string })?.id;
          if (gone) setMessages((prev) => prev.filter((m) => m.id !== gone));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room, conversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;

    setSending(true);
    const supabase = createClient();
    await supabase.from("messages").insert({
      room,
      conversation_id: conversationId ?? null,
      sender_id: currentUserId,
      body
    });
    setDraft("");
    setSending(false);
  }

  async function remove(id: string) {
    const supabase = createClient();
    await supabase.from("messages").delete().eq("id", id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
        <strong>{title}</strong>
      </div>

      <div style={{ maxHeight: 420, overflowY: "auto", padding: "12px 16px" }}>
        {messages.length === 0 ? null : (
          messages.map((m) => (
            <div key={m.id} style={{ marginBottom: 10 }}>
              <div className="small muted">
                {m.profiles?.full_name ?? "Member"} ·{" "}
                {new Date(m.created_at).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ whiteSpace: "pre-wrap", flex: 1 }}>{m.body}</div>
                {m.sender_id === currentUserId || canModerate ? (
                  <button
                    type="button"
                    onClick={() => remove(m.id)}
                    className="small"
                    style={{
                      background: "none",
                      border: 0,
                      color: "var(--muted)",
                      cursor: "pointer",
                      padding: 0,
                      textDecoration: "underline"
                    }}
                    aria-label="Delete message"
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={send}
        style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid var(--border)" }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message"
          maxLength={2000}
          aria-label="Message"
        />
        <button className="btn" type="submit" disabled={sending}>
          Send
        </button>
      </form>
    </div>
  );
}

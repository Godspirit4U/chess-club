"use client";

import { useMemo, useState } from "react";
import { changeRole, removeMember } from "@/app/admin/people/actions";

type Person = {
  id: string;
  full_name: string;
  email: string;
  role: "member" | "admin" | "super_admin";
};

export default function PeopleTable({
  people,
  myId,
  myRole
}: {
  people: Person[];
  myId: string;
  myRole: "member" | "admin" | "super_admin";
}) {
  const isSuper = myRole === "super_admin";
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    );
  }, [people, query]);

  return (
    <div className="stack">
      <div>
        <label htmlFor="search">Search by name or email</label>
        <input
          id="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Start typing a name"
          autoComplete="off"
        />
      </div>

      <p className="muted small" style={{ margin: 0 }}>
        {filtered.length} of {people.length}{" "}
        {people.length === 1 ? "person" : "people"}
      </p>

      {filtered.length === 0 ? (
        <p className="empty">Nobody matches that search.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.full_name}
                  {p.id === myId ? <span className="muted small"> (you)</span> : null}
                </td>
                <td className="small muted">{p.email}</td>
                <td>
                  {p.id === myId ? (
                    <span className="muted small">You</span>
                  ) : isSuper ? (
                    <form action={changeRole} style={{ display: "flex", gap: 6 }}>
                      <input type="hidden" name="id" value={p.id} />
                      <select
                        name="role"
                        defaultValue={p.role}
                        style={{ minHeight: 36, fontSize: 14, minWidth: 130 }}
                        aria-label={`Role for ${p.full_name}`}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super admin</option>
                      </select>
                      <button className="btn secondary" type="submit" style={{ minHeight: 36 }}>
                        Save
                      </button>
                    </form>
                  ) : (
                    <span className="muted small">
                      {p.role === "super_admin" ? "Super admin" : "Admin"}
                    </span>
                  )}
                </td>
                <td>
                  {p.id !== myId && (isSuper || p.role === "member") ? (
                    <form
                      action={removeMember}
                      onSubmit={(e) => {
                        const ok = window.confirm(
                          `Remove ${p.full_name} from the club? This deletes their account, registrations and messages, and cannot be undone.`
                        );
                        if (!ok) e.preventDefault();
                      }}
                    >
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="email" value={p.email} />
                      <button
                        className="btn secondary"
                        type="submit"
                        style={{ minHeight: 36, color: "var(--danger)" }}
                      >
                        Remove
                      </button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

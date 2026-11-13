"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const groups: { label: string; links: { href: string; label: string; exact?: boolean }[] }[] = [
  {
    label: "Overview",
    links: [{ href: "/admin", label: "Dashboard", exact: true }]
  },
  {
    label: "Tournaments",
    links: [
      { href: "/admin/tournaments", label: "All tournaments", exact: true },
      { href: "/admin/tournaments/new", label: "Create one" }
    ]
  },
  {
    label: "Add to the site",
    links: [
      { href: "/admin/blog", label: "Write a post" },
      { href: "/admin/puzzles", label: "Add a puzzle" },
      { href: "/admin/events", label: "Add an event" }
    ]
  },
  {
    label: "The club",
    links: [
      { href: "/admin/people", label: "People" },
      { href: "/admin/feedback", label: "Feedback" }
    ]
  }
];

export default function AdminSidebar({ name }: { name: string }) {
  const pathname = usePathname();

  return (
    <aside className="admin-side">
      <div className="side-block">
        <p className="side-label">Signed in</p>
        <p style={{ margin: 0, fontWeight: 600 }}>{name}</p>
      </div>

      {groups.map((group) => (
        <nav key={group.label} className="side-block" aria-label={group.label}>
          <p className="side-label">{group.label}</p>
          {group.links.map((link) => {
            const active = link.exact
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--accent)" : "var(--ink)"
                }}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      ))}
    </aside>
  );
}

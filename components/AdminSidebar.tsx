"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const groups: { label: string; links: { href: string; label: string }[] }[] = [
  {
    label: "Overview",
    links: [{ href: "/admin", label: "Dashboard" }]
  },
  {
    label: "Tournaments",
    links: [
      { href: "/admin/tournaments/new", label: "Create a tournament" },
      { href: "/tournaments", label: "View public list" }
    ]
  },
  {
    label: "Content",
    links: [
      { href: "/admin/blog", label: "Blog" },
      { href: "/admin/puzzles", label: "Puzzles" },
      { href: "/admin/events", label: "Events" }
    ]
  },
  {
    label: "Club",
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
        <p className="side-label">Admin</p>
        <p style={{ margin: 0, fontWeight: 600 }}>{name}</p>
      </div>

      {groups.map((group) => (
        <nav key={group.label} className="side-block" aria-label={group.label}>
          <p className="side-label">{group.label}</p>
          {group.links.map((link) => {
            const active =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href);
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

      <div className="side-block">
        <p className="side-label">Leave</p>
        <Link href="/">Back to the site</Link>
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";

const links = [
  { href: "/tournaments", label: "Tournaments" },
  { href: "/puzzles", label: "Puzzles" },
  { href: "/blog", label: "Blog" },
  { href: "/events", label: "Events" },
  { href: "/community", label: "Community" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

export default function SiteHeader({
  signedIn,
  isAdmin,
  name
}: {
  signedIn: boolean;
  isAdmin: boolean;
  name?: string;
}) {
  const [open, setOpen] = useState(false);

  const all = [
    ...links,
    ...(signedIn ? [{ href: "/profile", label: "Profile" }] : [])
  ];

  return (
    <header className="site-header">
      <div className="container">
        <div className="bar">
          <Link href="/" className="brand">
            <img
              src="/logo-64.png"
              alt=""
              width={32}
              height={32}
              style={{ borderRadius: "50%", display: "block" }}
            />
            <span>SaiU Chess Club</span>
          </Link>

          <nav className="nav-links" aria-label="Main">
            {links.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}

            {isAdmin ? (
              <Link href="/admin" style={{ fontWeight: 600 }}>
                Admin
              </Link>
            ) : null}

            {signedIn ? (
              <Link href="/profile">Profile</Link>
            ) : (
              <Link href="/login">Sign in</Link>
            )}
          </nav>

          <button
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>

        {open && (
          <nav id="mobile-nav" className="mobile-nav" aria-label="Main">
            {all.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            {isAdmin ? (
              <Link href="/admin" onClick={() => setOpen(false)}>
                Admin
              </Link>
            ) : null}
            {!signedIn ? (
              <Link href="/login" onClick={() => setOpen(false)}>
                Sign in
              </Link>
            ) : null}
          </nav>
        )}
      </div>
    </header>
  );
}

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

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container">
        <div className="bar">
          <Link href="/" className="brand">
            SaiU Chess Club
          </Link>

          <nav className="nav-links" aria-label="Main">
            {links.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
            <Link href="/profile">Profile</Link>
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
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <Link href="/profile" onClick={() => setOpen(false)}>
              Profile
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

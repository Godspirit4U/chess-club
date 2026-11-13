import Link from "next/link";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <p>
          <Link href="/about">About</Link> · <Link href="/contact">Contact</Link> ·{" "}
          <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link>
        </p>
        <p className="small">
          SaiU Chess Club, {year}. Developed and maintained by the Chess Club.
        </p>
      </div>
    </footer>
  );
}

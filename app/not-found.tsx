import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <h1>That page does not exist</h1>
      <p className="muted">
        The link may be old, or the tournament may have been removed. Nothing is broken on
        your side.
      </p>
      <p>
        <Link className="btn" href="/">
          Back to the home page
        </Link>
      </p>
    </>
  );
}

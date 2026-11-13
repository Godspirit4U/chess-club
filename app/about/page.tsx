import type { Metadata } from "next";
import Link from "next/link";
import { club, committee } from "@/lib/club";

export const metadata: Metadata = {
  title: "About",
  description: club.tagline
};

export default function AboutPage() {
  return (
    <>
      <h1>About the club</h1>
      <p className="muted">{club.tagline}</p>

      <p style={{ marginTop: 16 }}>{club.summary}</p>
      <p className="muted small">
        Founded {club.founded}. Part of the Cultural Society at {club.university}.
      </p>

      <section style={{ marginTop: 28 }}>
        <h2>Vision</h2>
        <p>{club.vision}</p>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>What we set out to do</h2>
        <div className="grid two" style={{ marginTop: 12 }}>
          {club.objectives.map((o) => (
            <div key={o.title} className="card">
              <h3 style={{ marginTop: 0, fontSize: 16 }}>{o.title}</h3>
              <p className="muted small" style={{ margin: 0 }}>
                {o.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>How often we meet</h2>
        <table style={{ marginTop: 8 }}>
          <tbody>
            {club.activities.map((a) => (
              <tr key={a.name}>
                <th scope="row" style={{ width: "55%" }}>
                  {a.name}
                </th>
                <td>{a.frequency}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small" style={{ marginTop: 8 }}>
          Individual sessions and tournaments are listed on the{" "}
          <Link href="/events">events page</Link>.
        </p>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>Membership</h2>
        <table style={{ marginTop: 8 }}>
          <tbody>
            <tr>
              <th scope="row" style={{ width: "40%" }}>
                Who can join
              </th>
              <td>{club.membership.eligibility}</td>
            </tr>
            <tr>
              <th scope="row">Size</th>
              <td>{club.membership.capacity}</td>
            </tr>
            <tr>
              <th scope="row">How long</th>
              <td>{club.membership.term}</td>
            </tr>
            <tr>
              <th scope="row">How to join</th>
              <td>{club.membership.joining}</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: 12 }}>
          <Link className="btn" href="/login?mode=signup">
            Create your account
          </Link>
        </p>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>The committee</h2>
        <table style={{ marginTop: 8 }}>
          <tbody>
            {committee.map((c) => (
              <tr key={c.role}>
                <th scope="row" style={{ width: "35%" }}>
                  {c.role}
                </th>
                <td>{c.name}</td>
                <td className="small">
                  <a href={`mailto:${c.email}`}>{c.email}</a>
                </td>
              </tr>
            ))}
            <tr>
              <th scope="row">Faculty advisor</th>
              <td>{club.facultyAdvisor}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import { club } from "@/lib/club";

export const metadata: Metadata = {
  title: "About",
  description: "Who the SaiU Chess Club is, when it meets, and how it is run."
};

export default function AboutPage() {
  const rows = [
    { label: "Meets", value: [club.meetingDay, club.meetingTime].filter(Boolean).join(", ") },
    { label: "Venue", value: club.venue }
  ].filter((r) => r.value);

  return (
    <>
      <h1>About {club.name}</h1>
      <p className="muted">
        The chess club of {club.university}, run by students. We play tournaments through the
        semester, run training sessions for anyone who wants to learn, and keep a club table
        that carries across the year.
      </p>

      {rows.length > 0 ? (
        <table style={{ marginTop: 20, maxWidth: 480 }}>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}</th>
                <td>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <h2 style={{ marginTop: 28 }}>How the club is run</h2>
      <p>
        The committee is the president, the vice president, the secretary and the media
        partner. They create tournaments, post announcements, and run the site. Any member
        can register for a tournament, follow the pairings and see the table.
      </p>

      <h2 style={{ marginTop: 28 }}>Who can join</h2>
      <p>
        Any student of {club.university} with a university email address. Create an account
        with that address and you are in; there is no approval step.
      </p>
    </>
  );
}

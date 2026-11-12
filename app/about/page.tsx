import type { Metadata } from "next";
import { club } from "@/lib/club";

export const metadata: Metadata = {
  title: "About",
  description: "Who the SaiU Chess Club is, and how the club is run."
};

export default function AboutPage() {
  return (
    <>
      <h1>About {club.name}</h1>
      <p className="muted">
        The chess club of {club.university}, run by students. We play tournaments through the
        semester, run training sessions for anyone who wants to learn, and keep a club table
        that carries across the year.
      </p>

      <h2 style={{ marginTop: 28 }}>How the club is run</h2>
      <p>
        The committee is the president, the vice president, the secretary and the media
        partner. They create tournaments, post announcements, and run the site. Any member can
        register for a tournament, follow the pairings and see the table.
      </p>

      <h2 style={{ marginTop: 28 }}>What happens at a tournament</h2>
      <p>
        Members register before the deadline. When the tournament starts, the committee
        publishes the pairings for each round. Results go in after every round, and the points
        table moves with them. Finished games can be replayed move by move, and opened in a
        full engine on Lichess.
      </p>

      <h2 style={{ marginTop: 28 }}>Who can join</h2>
      <p>
        Any student of {club.university} with a university email address. Create an account
        with that address and you are in; there is no approval step.
      </p>
    </>
  );
}

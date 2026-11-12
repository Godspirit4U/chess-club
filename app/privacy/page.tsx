import type { Metadata } from "next";
import { club } from "@/lib/club";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article style={{ maxWidth: 680 }}>
      <h1>Privacy</h1>

      <h2>What we collect</h2>
      <p>
        Your name, your university email address, and a password. If you add them, your
        chess username, year and department, and a profile photo. When you play, we store
        your tournament registrations, results and any games recorded.
      </p>

      <h2>Why</h2>
      <p>
        To run the club: to let you register for tournaments, show the points table, keep a
        record of results, and let other members recognise you in the community.
      </p>

      <h2>Who can see it</h2>
      <p>
        Your name, photo and chess username are visible to other signed-in members. Your
        email address is visible only to administrators. Messages in the general room are
        visible to all signed-in members. Direct messages are visible to the two people in
        the conversation, and technically to whoever administers the database — they are
        not end-to-end encrypted.
      </p>

      <h2>How long</h2>
      <p>
        For as long as you are a member. Ask the committee to delete your account and your
        profile, registrations and messages are removed with it.
      </p>

      <h2>Who to ask</h2>
      <p>
        The committee of {club.name}. Contact details are on the Contact page.
      </p>
    </article>
  );
}

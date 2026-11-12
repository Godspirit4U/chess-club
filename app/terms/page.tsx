import type { Metadata } from "next";
import { club } from "@/lib/club";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <article style={{ maxWidth: 680 }}>
      <h1>Terms of use</h1>

      <h2>Who may use the site</h2>
      <p>
        Students of {club.university} with a university email address. Accounts are personal
        and should not be shared.
      </p>

      <h2>Playing</h2>
      <p>
        Registering for a tournament is a commitment to play. Results are entered by the
        committee and are final once the tournament is marked complete.
      </p>

      <h2>Behaviour</h2>
      <p>
        Be civil in the general room and in direct messages. The committee can remove
        messages and can suspend an account that is used to harass others or to disrupt
        events.
      </p>

      <h2>Availability</h2>
      <p>
        The site is run by students and is provided as it is. It may be unavailable during
        maintenance or outages, and no data on it should be treated as a permanent record.
      </p>
    </article>
  );
}

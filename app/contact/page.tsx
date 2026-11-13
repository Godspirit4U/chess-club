import type { Metadata } from "next";
import { club, committee } from "@/lib/club";
import { sendMessage } from "./actions";
import SubmitButton from "@/components/SubmitButton";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach the SaiU Chess Club committee, or report a problem with the site."
};

type Props = { searchParams: { sent?: string; error?: string } };

export default function ContactPage({ searchParams }: Props) {
  const hasChannels = club.email || club.instagram || club.whatsapp;

  return (
    <>
      <h1>Contact</h1>

      {committee.length > 0 ? (
        <section style={{ marginTop: 20 }}>
          <h2>The committee</h2>
          <table>
            <tbody>
              {committee.map((c) => (
                <tr key={c.role}>
                  <th scope="row">{c.role}</th>
                  <td>{c.name}</td>
                  <td>
                    {c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : <span className="muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {hasChannels ? (
        <section style={{ marginTop: 24 }}>
          <h2>Where to find us</h2>
          <table style={{ maxWidth: 520 }}>
            <tbody>
              {club.email ? (
                <tr>
                  <th scope="row">Email</th>
                  <td>
                    <a href={`mailto:${club.email}`}>{club.email}</a>
                  </td>
                </tr>
              ) : null}
              {club.instagram ? (
                <tr>
                  <th scope="row">Instagram</th>
                  <td>
                    <a href={`https://instagram.com/${club.instagram}`}>@{club.instagram}</a>
                  </td>
                </tr>
              ) : null}
              {club.whatsapp ? (
                <tr>
                  <th scope="row">WhatsApp</th>
                  <td>
                    <a href={club.whatsapp}>Join the group</a>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      ) : null}

      <section style={{ marginTop: 28 }}>
        <h2>Report a problem or send feedback</h2>
        <p className="muted small">
          A wrong result, something broken on the site, or an idea for the club. Goes straight
          to the committee.
        </p>

        {searchParams.sent ? (
          <p
            role="status"
            style={{
              border: "1px solid #cfe0d3",
              background: "var(--tint)",
              color: "var(--accent-dark)",
              borderRadius: 6,
              padding: "10px 12px",
              fontSize: 14
            }}
          >
            Sent. The committee will see it.
          </p>
        ) : null}

        {searchParams.error ? (
          <p role="alert" style={{ color: "var(--danger)", fontSize: 14 }}>
            {searchParams.error}
          </p>
        ) : null}

        <form action={sendMessage} className="card stack" style={{ maxWidth: 520 }}>
          <div className="field">
            <label htmlFor="kind">What is this about</label>
            <select id="kind" name="kind" defaultValue="feedback">
              <option value="problem">A problem with a result or a tournament</option>
              <option value="bug">Something broken on the site</option>
              <option value="feedback">Feedback or an idea</option>
              <option value="other">Something else</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="name">Your name</label>
            <input id="name" name="name" required />
          </div>
          <div className="field">
            <label htmlFor="email">Your email</label>
            <input id="email" name="email" type="email" required />
          </div>
          <div className="field">
            <label htmlFor="body">Message</label>
            <textarea id="body" name="body" rows={5} maxLength={4000} required />
          </div>
          <SubmitButton pendingLabel="Sending…">Send</SubmitButton>
        </form>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import { club, committee } from "@/lib/club";
import { sendMessage } from "./actions";
import SubmitButton from "@/components/SubmitButton";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach the Sai University Chess Club committee."
};

type Props = { searchParams: { sent?: string; error?: string } };

export default function ContactPage({ searchParams }: Props) {
  return (
    <>
      <h1>Contact</h1>

      <section style={{ marginTop: 16 }}>
        <h2>Who to ask</h2>
        <table style={{ marginTop: 8 }}>
          <tbody>
            {committee.map((c) => (
              <tr key={c.role}>
                <th scope="row" style={{ width: "32%" }}>
                  {c.role}
                </th>
                <td>{c.name}</td>
                <td className="small">
                  <a href={`mailto:${c.email}`}>{c.email}</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small" style={{ marginTop: 8 }}>
          For general queries, write to{" "}
          <a href={`mailto:${club.email}`}>{club.email}</a>.
        </p>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>Report a problem or send feedback</h2>

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
            Sent.
          </p>
        ) : null}

        {searchParams.error ? (
          <p role="alert" style={{ color: "var(--danger)", fontSize: 14 }}>
            {searchParams.error}
          </p>
        ) : null}

        <form action={sendMessage} className="card stack" style={{ maxWidth: 540, marginTop: 12 }}>
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
          <SubmitButton>Send</SubmitButton>
        </form>
      </section>
    </>
  );
}

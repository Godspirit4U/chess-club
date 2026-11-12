import type { Metadata } from "next";
import { club } from "@/lib/club";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach the SaiU Chess Club committee."
};

export default function ContactPage() {
  const hasAny = club.email || club.instagram || club.whatsapp;

  return (
    <>
      <h1>Contact</h1>
      <p className="muted">Reach the committee directly, or ask in the general room.</p>

      {hasAny ? (
        <table style={{ marginTop: 20, maxWidth: 520 }}>
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
      ) : (
        <p className="empty">
          Contact details are being added. Until then, ask in the general room inside
          Community, or speak to any committee member at a session.
        </p>
      )}
    </>
  );
}

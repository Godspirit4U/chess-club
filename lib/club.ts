/**
 * Club details shown on the About and Contact pages.
 * Fill these in and the pages render them; leave a value empty and that row is hidden.
 * Meeting days and venues are not here: those belong to each event.
 */
export const club = {
  name: "SaiU Chess Club",
  university: "Sai University",
  email: "",          // e.g. "chessclub@saiuniversity.edu.in"
  instagram: "",      // e.g. "saiuchessclub"
  whatsapp: ""        // full invite link, e.g. "https://chat.whatsapp.com/..."
};

/** The committee, shown on the Contact page. Add or remove rows freely. */
export const committee: { role: string; name: string; email: string }[] = [
  // { role: "President", name: "Full Name", email: "name@scds.saiuniversity.edu.in" },
  // { role: "Vice President", name: "Full Name", email: "" },
  // { role: "Secretary", name: "Full Name", email: "" },
  // { role: "Media partner", name: "Full Name", email: "" }
];

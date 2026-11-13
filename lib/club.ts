/**
 * Club facts, taken from the Sai University Chess Club registration form (Academic Year 2026).
 * Meeting days and venues are not here: those belong to each event.
 */
export const club = {
  name: "Sai University Chess Club",
  shortName: "SaiU Chess Club",
  university: "Sai University",
  email: "sivaharsha.sottu@gmail.com",
  instagram: "saiuchessclub",
  whatsapp: "https://chat.whatsapp.com/EgUqiLPhitgL1TGOF3gUBc",
  founded: "15 August 2023",
  tagline:
    "A student-led community that promotes chess by developing strategic thinking, problem-solving and sportsmanship.",
  summary:
    "We run regular practice sessions, friendly matches, puzzle challenges and competitive tournaments. The club is open to beginners and experienced players alike, and we aim to build a team that represents Sai University in inter-college competitions.",
  vision:
    "A friendly and active chess community at Sai University where students of every skill level can learn and enjoy the game, and where chess becomes a popular activity on campus.",
  objectives: [
    {
      title: "Promote chess",
      body: "Encourage students to learn and play, whatever their experience."
    },
    {
      title: "Develop skill",
      body: "Sharpen logical reasoning, concentration and problem-solving through regular play."
    },
    {
      title: "Organise competition",
      body: "Run tournaments, friendly matches, puzzle challenges and inter-college events."
    },
    {
      title: "Build a community",
      body: "An inclusive room where beginners and experienced players learn from each other."
    }
  ],
  membership: {
    eligibility: "Open to all students of Sai University. No prior experience needed.",
    capacity: "Up to 100 members",
    term: "Membership runs until graduation",
    joining: "Register with your university email. There is no selection process."
  },
  activities: [
    { name: "Practice sessions", frequency: "Every two weeks" },
    { name: "Knowledge sessions", frequency: "Once a month" },
    { name: "Chess tournaments", frequency: "Every two months, each semester" },
    { name: "Inter-college events", frequency: "Every even semester" }
  ],
  facultyAdvisor: "Manoj Sir"
};

/** The committee, shown on the Contact page. Emails only: phone numbers stay off the public site. */
export const committee: { role: string; name: string; email: string }[] = [
  { role: "President", name: "Sai Kokkula", email: "sai.k-28@scds.saiuniversity.edu.in" },
  {
    role: "Vice President",
    name: "Sai Sadhvik Dasam",
    email: "saisadhvik.d-29@scds.saiuniversity.edu.in"
  },
  {
    role: "Secretary",
    name: "Siva Harsha Sottu",
    email: "sivaharsha.s-29@scds.saiuniversity.edu.in"
  },
  {
    role: "Social media handler",
    name: "Chagam Riteeswar Reddy",
    email: "riteeswar.c-29@scds.saiuniversity.edu.in"
  }
];

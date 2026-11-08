export type PastEvent = {
  date: string;
  title: string;
  body?: string;
  facebook?: string;
  note?: boolean;
};

/** Full historical list (Facebook / manual archive). */
export const pastEvents: PastEvent[] = [
  { date: 'Sat, Dec 13, 2025', title: 'Unity Fusion Skating' },
  { date: 'Sat, Nov 1, 2025', title: 'Unity Fusion Grateful Dance' },
  { date: 'Sat, Oct 4, 2025', title: 'Unity Fusion: Rocky Fusion Picture Show' },
  { date: 'Sat, Sep 6, 2025', title: 'Unity Fusion: Dancing in the Dark' },
  { date: 'Sat, Aug 23, 2025', title: 'Fusion Float' },
  { date: 'Sat, Aug 2, 2025', title: 'Unity Fusion: Monochrome Madness Late Night!!' },
  {
    date: 'Sat, Aug 2, 2025',
    title: 'Make Every Dance Amazing – A Fusion Weekender Intensive',
  },
  { date: 'Sat, Jul 5, 2025', title: 'Unity Fusion: Summer Dance and Potluck' },
  { date: 'Sat, Jun 7, 2025', title: "Unity Fusion: There's No Place Like Dance" },
  { date: 'Sat, May 3, 2025', title: 'What the Fusion we Doin?' },
  { date: 'Sat, Apr 5, 2025', title: 'Unity Fusion: Fusing With Nature Dance' },
  {
    date: 'Sat, Mar 8, 2025',
    title: 'Eugene to Corvallis Fusion School-Bus Field Trip!',
  },
  { date: 'Sat, Mar 1, 2025', title: "Unity Fusion's Beyond the Beat Charity Dance" },
  { date: 'Sat, Feb 1, 2025', title: "Unity Fusion's Valentine Dance Card Night" },
  {
    date: 'January 2025',
    title: 'No January Dance',
    note: true,
  },
  { date: 'Sun, Dec 15, 2024', title: 'Unity Fusion Ice Skating' },
  { date: 'Sat, Nov 2, 2024', title: 'The Grateful Dance' },
  { date: 'Sat, Oct 5, 2024', title: "Unity Fusion's Boo-gie Night" },
  { date: 'Sat, Sep 7, 2024', title: 'Unity Fusion: Harvest Fusion Potluck!' },
  {
    date: 'Sat, Aug 3, 2024',
    title: 'Unity Fusion: Dancing in the Dark (The Blindfold Dance)',
  },
  {
    date: 'Sat, Jul 6, 2024',
    title: "Unity Fusion's: Pirates! Steal Dat Booty...With LAUGHING MATTERS LIVE MUSIC!!",
  },
  {
    date: 'Sat, Jun 1, 2024',
    title: 'Unity Fusion\'s "Role-Play" House Party (No, not like THAT!)',
  },
  {
    date: 'Sat, May 11, 2024',
    title: 'The Unity Bus Trip To Corvallis Fusion',
  },
  {
    date: 'Sat, May 4, 2024',
    title: "What the Fusion we Doin' Anniversary",
  },
  { date: 'Sat, Apr 20, 2024', title: 'Unity Fusion: Dancers In Wonderland' },
  { date: 'Sat, Mar 23, 2024', title: 'Unity Fusion: A Night at the Cinema Dance' },
  {
    date: 'Sat, Feb 17, 2024',
    title: 'Unity Fusion\'s Valentine\'s "Dance Card" Dance',
  },
  { date: 'Sat, Jan 20, 2024', title: "Unity Fusion's 2024 Launch Party" },
  { date: 'Sat, Nov 18, 2023', title: 'Unity Fusion: The Grateful Dance!' },
  { date: 'Wed, Oct 25, 2023', title: 'Unity DJ Workshop Part 2!' },
  { date: 'Sun, Oct 15, 2023', title: 'Unity DJ Workshop Part 1' },
  { date: 'Sat, Oct 14, 2023', title: 'Unity Fusion: Eclipse Night' },
  {
    date: 'Sat, Sep 16, 2023',
    title: 'Unity Fusion: End-of-Summer Dancing Extravaganza',
  },
  { date: 'Sat, Aug 19, 2023', title: 'Unity Fusion — August Fusion Partner Dance' },
  { date: 'Sat, Jul 22, 2023', title: 'Save OG Studios Fusion Late-Night!' },
  { date: 'Sat, Jun 17, 2023', title: 'Unity Fusion: Fusion-Based Partner Dancing' },
  { date: 'Fri, May 26, 2023', title: 'What the Fusion We Doin?!' },
];

/** 2023–2024 archive shown after calendar pagination runs out. */
export const archivedPastEvents: PastEvent[] = pastEvents.filter((event) =>
  /,\s*202[34]\b/.test(event.date),
);

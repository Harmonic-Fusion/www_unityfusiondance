export type PastEvent = {
  date: string;
  title: string;
  body?: string;
  facebook?: string;
  note?: boolean;
};

export const pastEvents: PastEvent[] = [
  { date: 'Sat Nov 1st, 2025', title: 'Grateful Dance' },
  { date: 'Sat Oct 4th, 2025', title: 'Rocky Horror Picture Show' },
  { date: 'Sat Sept 6th, 2025', title: 'Dancing in the Dark' },
  {
    date: 'Sat Aug 2nd–3rd, 2025',
    title: 'Amazing Weekender',
    body: 'Saturday Night — Black & White',
  },
  { date: 'Sat July 5th, 2025', title: 'Summer Vibes Potluck' },
  { date: 'Sat June 7th, 2025', title: 'Wizard of Oz' },
  { date: 'Sat May 3rd, 2025', title: "What the Fusion We Doin'?" },
  {
    date: 'Sat April 5th, 2025',
    title: 'Fusing with Nature',
    body: `Now more than ever, our connection to the earth matters. Join us as we explore fusion dance through the lens of nature in this Earth Day themed Fusion Dance evening. Bring your favorite plant to dance for this one, or better yet… BE your favorite plant to dance! Or both! We are going to immerse ourselves in nature through music, dance, connection, and an incredible lesson, leaving more rooted in our love for each other and the planet.

Where: Xcape Dance Academy (1416 W 7th Ave, Eugene OR 97402). Do not park at the convenience store.

When: Saturday April 5th — 7–8 pm lesson/workshop, 8–10:30 pm dancing.

Cost: Sliding scale $7–$28. Your contribution goes directly to paying DJs, teachers, and the venue.`,
  },
  { date: 'Sat March 8th, 2025', title: 'Eugene & Corvallis Unity' },
  { date: 'Sat March 1st, 2025', title: 'Community Fuse' },
  {
    date: 'Sat Feb 1st, 2025',
    title: "Valentine's Dance Card Dance",
    body: `Welcome back to our first dance of the year! Come join us in an early celebration of Valentine’s day with our fusion twist on dance cards.

Dance cards have been a part of dance since the 18th century. Come fill up your card by completing dance challenges and dancing with new people. There may even be a tasty treat if you do.

Where: Xcape Dance Academy, 1416 W 7th Ave, Eugene OR 97402. Do not park at the convenience store.

When: 7–8 pm lesson/workshop, 8–10:30 pm social dancing.`,
  },
  {
    date: 'January 2025',
    title: 'No January Dance',
    note: true,
    body: `Welcome to 2025! We’re incredibly thankful for our Unity Fusion community here in Eugene. The organizers took a break over the holidays—January included—to regroup and plan an exciting year ahead.

We’d love to hear your ideas for 2025. Please reach out and let us know what you’d like to see happen.

In the meantime, check out Corvallis Fusion, and we’ll be back in full swing on the first Saturday of each month starting in February.`,
    facebook: 'https://www.facebook.com/events/886047626714623',
  },
  {
    date: 'December 2024',
    title: 'No December Dance',
    note: true,
    body: 'We take a break in December. Happy holidays!',
  },
  { date: 'Sat Nov 2nd, 2024', title: 'Gratitude Dance' },
  {
    date: 'Sat Oct 5th, 2024',
    title: 'Boo-gie Night!',
    facebook: 'https://www.facebook.com/events/1940609503126025',
    body: 'A chill comes over the air as we enter October, the spookiest month of them all. Come dance with ghosts, monsters, and ghouls or become one yourself. Costumes encouraged!',
  },
  { date: 'Sat Sept 7th, 2024', title: 'Harvest Dance' },
  {
    date: 'Sat August 3rd, 2024',
    title: 'Dancing in the Dark',
    facebook: 'https://www.facebook.com/events/906293274640284',
  },
  {
    date: 'Sat July 6th, 2024',
    title: 'Pirates! Steal that Booty!',
    body: 'Ahoy me Mateys! Come aboard and join us for a pirate themed dance. Along with bringing fellow crew members, you are encouraged to bring a small treasure to share with your fellow pirates. Throw on your best pirate attire as we set sail for an amazing night of social partner dancing.',
    facebook: 'https://www.facebook.com/events/948494453405824',
  },
  {
    date: 'Sat June 1st, 2024',
    title: 'House Par-tay!',
    body: "It's a House Party!!!! Karsten's House — email unityfusiondance@gmail.com if we forget to update the address here.",
  },
  {
    date: 'Sat May 4th, 2024',
    title: 'Anniversary!',
    body: "Join us in celebrating our one year anniversary! We've lined up some special lessons to bring us back into the elements of fusion. Bring yourself and your passion for dance and prepare for a great night.",
  },
  {
    date: 'Sat April 20th, 2024',
    title: 'Dancers In Wonderland',
    body: "Fall down the rabbit hole and join us for a mystical night of exploring the unknown. Along with our monthly dance, the Mad Hatter has also arranged a tea party for us. Bring your favorite mug and enjoy some tea and conversation with other dancers. Theme dress encouraged!",
    facebook: 'https://www.facebook.com/events/1850418248797394',
  },
  {
    date: 'Sat March 23rd, 2024',
    title: 'A Night at the Cinema Dance',
    body: 'Ever heard a great song in a movie and wished you could dance to it? Dress up as a movie character and dance the night away. Find your perfect movie character combinations and bring them to life on our movie-mashup photo booth!',
    facebook: 'https://www.facebook.com/events/1425701941699959',
  },
  {
    date: 'Sat Feb 17th, 2024',
    title: "Valentine's Dance Card Dance",
    body: "Come celebrate Valentine's Day with a new twist on a classic dance tradition! Will you be able to have a full dance card by the end of the evening? Venue: The Garden Club, 1645 High St.",
    facebook: 'https://www.facebook.com/events/1066191254495752',
  },
  {
    date: 'Sat Jan 20th, 2024',
    title: "Unity Fusion's 2024 Launch Party",
    body: "New year, new dances! Let's celebrate the launch of Unity Fusion's 2024 season. Venue: OG Studio, 129 14th St, Springfield, OR 97477.",
  },
];

export type FaqItem = {
  question: string;
  answerHtml: string;
};

export const faqItems: FaqItem[] = [
  {
    question: 'What is fusion dance?',
    answerHtml: `Fusion Partner Dancing is an ever-evolving dance style that pulls from various dance styles, cultures, and techniques. This creates a unique dance with each partner as you fuse your styles with your partner and the music. Never danced before? No worries — <strong>all skill levels are welcome</strong>.`,
  },
  {
    question: 'What kind of music do you play?',
    answerHtml: `We play a mix of modern, emotive, electronic, and pop music — lots of strong beats and dynamic melodies which are fun to dance to. Tunes by the likes of Marian Hill, Glass Animals, Beyoncé, Massive Attack, and so many others. You can listen to some examples on <a href="https://open.spotify.com/playlist/4jT2a2PsbmLKhFhlBz3nda" target="_blank" rel="noopener noreferrer">this playlist</a>.`,
  },
  {
    question: 'How much do events cost?',
    answerHtml: `We want everyone, regardless of socioeconomic position, to be able to participate! Around <strong>$14 per person</strong> covers our typical event costs. <a href="/contribute/">See more details on how to contribute</a>.`,
  },
  {
    question: 'What are the legal terms and liability release for attending?',
    answerHtml: `To participate in Unity Fusion events we require all attendees to agree to these <a href="/terms/">Terms and Liability Release</a>. These terms help us maintain a safe container for all participants. Agreement to the terms is done in the sign-in form. For any questions reach out to <a href="mailto:unityfusiondance@gmail.com">unityfusiondance@gmail.com</a>.`,
  },
  {
    question: 'Where is the sign-in form for events?',
    answerHtml: `The sign-in form is located <a href="https://docs.google.com/forms/d/e/1FAIpQLSegCMUC1hiYxSjFa5CcVC-rdMq55TC2W8-1WAFNEd30mF9Q3A/viewform" target="_blank" rel="noopener noreferrer">here</a>.`,
  },
  {
    question: 'How do I get involved to teach, DJ, or help in other ways?',
    answerHtml: `Check out our <a href="/get-involved/">Get Involved</a> page for details.`,
  },
];

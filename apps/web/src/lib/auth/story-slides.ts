export type StorySlide = {
  id: string;
  kicker: string;
  headline: string;
  body: string;
  /** Image slot — replace with owned/licensed WebP later. */
  imageSrc?: string;
  imageAlt: string;
};

export const AUTH_STORY_SLIDES: StorySlide[] = [
  {
    id: 'ask',
    kicker: 'Ask',
    headline: 'Tell AskAlert what you need.',
    body: 'Shortlets, events, home care and more, in Lekki.',
    imageAlt: 'Lekki waterfront at dusk',
  },
  {
    id: 'alert',
    kicker: 'Alert',
    headline: 'We ask verified vendors. You get alerted.',
    body: 'Compare real offers without chasing anyone.',
    imageAlt: 'Bright shortlet living room ready for guests',
  },
  {
    id: 'delivered',
    kicker: 'Delivered',
    headline: 'Pick the best. Pay safely. Done.',
    body: 'Your money, your rules — with staged payouts.',
    imageAlt: 'Event table setup for a Lagos celebration',
  },
  {
    id: 'control',
    kicker: 'In control',
    headline: 'You decide payout timing.',
    body: 'Release more to vendors you trust. Hold more back until you confirm the job.',
    imageAlt: 'Driver opening a car door for a passenger',
  },
  {
    id: 'vendors',
    kicker: 'For vendors',
    headline: 'Get customers who are ready to book.',
    body: 'Join free. Be found by people with real requests.',
    imageAlt: 'Caterer or photographer at work',
  },
];

export type StorySlide = {
  id: string;
  kicker: string;
  headline: string;
  body: string;
  /** Preferred lightweight image. */
  imageSrc?: string;
  /** Optional WebP for browsers that support it. */
  imageWebpSrc?: string;
  imageAlt: string;
};

export const AUTH_STORY_SLIDES: StorySlide[] = [
  {
    id: 'ask',
    kicker: 'Ask',
    headline: 'Tell AskAlert what you need.',
    body: 'Shortlets, events, home care and more, in Lekki.',
    imageSrc: '/brand/askalert-images-1.jpg',
    imageAlt: 'AskAlert marketplace scene',
  },
  {
    id: 'alert',
    kicker: 'Alert',
    headline: 'We ask verified vendors. You get alerted.',
    body: 'Compare real offers without chasing anyone.',
    imageSrc: '/brand/askalert-images-2.jpg',
    imageAlt: 'Vendors responding to a request',
  },
  {
    id: 'delivered',
    kicker: 'Delivered',
    headline: 'Pick the best. Pay safely. Done.',
    body: 'Your money, your rules — with staged payouts.',
    imageSrc: '/brand/askalert-images-3.jpg',
    imageAlt: 'Booking confirmed with staged payout',
  },
  {
    id: 'control',
    kicker: 'In control',
    headline: 'You decide payout timing.',
    body: 'Release more to vendors you trust. Hold more back until you confirm the job.',
    imageSrc: '/brand/askalert-images-4.jpg',
    imageWebpSrc: '/brand/askalert-images-4.webp',
    imageAlt: 'Buyer reviewing offers and payout timing',
  },
  {
    id: 'vendors',
    kicker: 'For vendors',
    headline: 'Get customers who are ready to book.',
    body: 'Join free. Be found by people with real requests.',
    imageSrc: '/brand/admin-login-bg.jpg',
    imageAlt: 'Lagos vendor ready for customers',
  },
];

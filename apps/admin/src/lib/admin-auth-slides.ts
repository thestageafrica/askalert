export type AdminAuthSlide = {
  id: string;
  kicker: string;
  headline: string;
  body: string;
  imageSrc: string;
  imageWebpSrc?: string;
  imageAlt: string;
};

export const ADMIN_AUTH_SLIDES: AdminAuthSlide[] = [
  {
    id: 'ops',
    kicker: 'Ops',
    headline: 'Run AskAlert from one calm desk.',
    body: 'Categories, vendors, plans and payouts — without the noise.',
    imageSrc: '/brand/admin-login-bg.jpg',
    imageAlt: 'AskAlert operations workspace mood',
  },
  {
    id: 'trust',
    kicker: 'Trust',
    headline: 'Verify vendors. Protect buyers.',
    body: 'Keep Lagos quality high with clear checks and staged payouts.',
    imageSrc: '/brand/askalert-images-1.jpg',
    imageAlt: 'Verified marketplace activity',
  },
  {
    id: 'plans',
    kicker: 'Plans',
    headline: 'Prices in Naira. Costs under control.',
    body: 'Publish plans, watch usage, and keep unit costs honest.',
    imageSrc: '/brand/askalert-images-2.jpg',
    imageAlt: 'Plans and usage overview mood',
  },
  {
    id: 'alerts',
    kicker: 'Alerts',
    headline: 'See what needs you next.',
    body: 'Requests, disputes and payouts surface here first.',
    imageSrc: '/brand/askalert-images-3.jpg',
    imageAlt: 'Team reviewing live requests',
  },
  {
    id: 'secure',
    kicker: 'Secure',
    headline: 'Invitation-only access.',
    body: 'No public sign-up. Email, password and TOTP keep the console locked down.',
    imageSrc: '/brand/askalert-images-4.jpg',
    imageWebpSrc: '/brand/askalert-images-4.webp',
    imageAlt: 'Secure admin access',
  },
];

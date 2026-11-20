import type { MetadataRoute } from 'next';

/** Bump when swapping approved artwork so browsers drop the old install icon. */
const ICON_VERSION = '3';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AskAlert',
    short_name: 'AskAlert',
    description:
      'Tell AskAlert what you need in Lagos. We ask verified vendors, compare offers, and bring you the best ones.',
    start_url: '/app',
    display: 'standalone',
    background_color: '#0F1545',
    theme_color: '#0F1545',
    orientation: 'portrait-primary',
    icons: [
      {
        src: `/icons/icon-192.png?v=${ICON_VERSION}`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/icons/icon-512.png?v=${ICON_VERSION}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/icons/icon-maskable-512.png?v=${ICON_VERSION}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Providers } from '../components/providers';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
  fallback: ['system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
});

const APP_NAME = 'AskAlert';
const APP_DESCRIPTION =
  'Tell AskAlert what you need in Lagos. We ask verified vendors, compare offers, and bring you the best ones.';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  applicationName: APP_NAME,
  title: {
    default: 'AskAlert | Ask. Alert. Delivered.',
    template: '%s | AskAlert',
  },
  description: APP_DESCRIPTION,
  keywords: ['AskAlert', 'Lagos', 'vendors', 'shortlets', 'events', 'home care', 'escrow'],
  authors: [{ name: 'AskAlert Technologies Limited' }],
  creator: 'AskAlert Technologies Limited',
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    siteName: APP_NAME,
    title: 'AskAlert | Ask. Alert. Delivered.',
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AskAlert | Ask. Alert. Delivered.',
    description: APP_DESCRIPTION,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#0F1545',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={plusJakarta.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

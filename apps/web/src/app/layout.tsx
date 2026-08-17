import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AppChrome } from '@/components/app-chrome';
import { appUrl } from '@/lib/urls';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Inter({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const siteName = 'BuddyAds.ai';
const title = 'BuddyAds.ai — AI Visibility & LLM Optimization';
const description =
  'Become the brand AI recommends. Monitor, optimize, and grow your visibility across ChatGPT, Gemini, Claude, Perplexity, Copilot, Grok, and the next generation of AI assistants.';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: title,
    template: `%s · ${siteName}`,
  },
  description,
  applicationName: siteName,
  keywords: [
    'AI visibility',
    'LLM optimization',
    'LLMO',
    'GEO',
    'generative engine optimization',
    'AI search',
    'ChatGPT brand monitoring',
    'BuddyAds',
  ],
  authors: [{ name: 'BuddyAds.ai' }],
  creator: 'BuddyAds.ai',
  publisher: 'BuddyAds.ai',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: appUrl,
    siteName,
    title,
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'BuddyAds.ai',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Check AI visibility',
  },
  url: appUrl,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${display.variable} font-sans`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:text-background"
          >
            Skip to content
          </a>
          <AppChrome>{children}</AppChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}

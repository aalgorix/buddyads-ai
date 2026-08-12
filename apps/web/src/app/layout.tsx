import type { Metadata } from 'next';
import './globals.css';

const siteName = 'BuddyAds';
const title = 'BuddyAds — Be the brand AI recommends';
const description =
  'Track how ChatGPT, Perplexity, Gemini & Claude cite your brand. Analyze coverage gaps, optimize content, and improve your AI search visibility.';

export const metadata: Metadata = {
  title: { default: title, template: `%s · ${siteName}` },
  description,
  applicationName: siteName,
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="page-glow min-h-screen font-sans text-ink antialiased">{children}</body>
    </html>
  );
}

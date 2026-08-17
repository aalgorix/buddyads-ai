import type { MetadataRoute } from 'next';
import { appUrl } from '@/lib/urls';

const routes = [
  '',
  '/check',
  '/features',
  '/solutions',
  '/pricing',
  '/resources',
  '/about',
  '/contact',
  '/docs',
  '/support',
  '/privacy',
  '/terms',
  '/security',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return routes.map((path) => ({
    url: `${appUrl}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : 0.7,
  }));
}

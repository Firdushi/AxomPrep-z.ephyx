import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const routes = ['', '/notes', '/tests', '/gk', '/current-affairs', '/about', '/mission', '/vision', '/contact', '/privacy', '/terms', '/disclaimer'];
  return routes.map(path => ({ url: `${base}${path}`, changeFrequency: path === '' ? 'weekly' : 'monthly', priority: path === '' ? 1 : 0.6 }));
}

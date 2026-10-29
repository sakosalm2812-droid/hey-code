import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hey.ai';
  
  const staticRoutes = [
    '',
    '/signin',
    '/signup',
    '/forgot-password',
    '/pricing',
    '/about',
    '/privacy',
    '/terms',
    '/cookies',
    '/dpa',
    '/contact',
    '/status',
    '/docs',
    '/changelog',
    '/roadmap',
  ];

  const routes = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}

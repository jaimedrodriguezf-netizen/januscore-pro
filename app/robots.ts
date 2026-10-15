import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://januscore.pro';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/signin',
        ],
        disallow: [
          '/api/*',
          '/receipts/*',
          '/upload/*',
          '/portal/*',
          '/settings/*',
          '/tenants/*',
          '/support/*',
          '/metrics/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

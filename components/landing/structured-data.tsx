import React from 'react';
import { B2B_PRODUCTS } from '@/lib/catalog/products';

export function StructuredData() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://januscore.pro/#organization',
        name: 'JanusCore Technologies',
        url: 'https://januscore.pro',
        description:
          'Estudio de ingeniería de inteligencia artificial, automatización de procesos empresariales y plataforma de software B2B de misión crítica.',
        email: 'jaimedrodriguezf@gmail.com',
        contactPoint: [
          {
            '@type': 'ContactPoint',
            telephone: '+593-983-144-424',
            contactType: 'sales',
            areaServed: ['EC', 'LATAM', 'Worldwide'],
            availableLanguage: ['Spanish', 'English'],
          },
        ],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://januscore.pro/#website',
        url: 'https://januscore.pro',
        name: 'JanusCore Technologies',
        publisher: {
          '@id': 'https://januscore.pro/#organization',
        },
      },
      ...B2B_PRODUCTS.map((prod) => ({
        '@type': 'SoftwareApplication',
        '@id': `https://januscore.pro/#software-${prod.id}`,
        name: prod.name,
        headline: prod.tagline,
        description: prod.description,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All modern browsers, Cloud, Linux VPS',
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          description: prod.priceModel,
          availability: 'https://schema.org/InStock',
        },
        author: {
          '@id': 'https://januscore.pro/#organization',
        },
      })),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

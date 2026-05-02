import type { SiteConfig, SocialLink } from '../types';

export const socialLinks: SocialLink[] = [
  {
    label: 'GitHub',
    href: 'https://github.com/janus-core',
    icon: 'github',
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/company/janus-core',
    icon: 'linkedin',
  },
  {
    label: 'Twitter / X',
    href: 'https://x.com/januscore',
    icon: 'twitter',
  },
];

export const siteData: SiteConfig = {
  name: 'Janus Core',
  tagline: 'Bits, Átomos e Inteligencia',
  description:
    'Conectamos tus activos físicos con inteligencia artificial. IoT industrial, visión artificial y software a medida para transformar tu negocio.',
  url: 'https://januscore.com',
  ogImage: '/og-image.jpg',
  language: 'es',
  navLinks: [
    { label: 'Inicio', href: '#inicio' },
    { label: 'Servicios', href: '#servicios' },
    { label: 'Cómo Funciona', href: '#como-funciona' },
    { label: 'Casos', href: '#casos' },
    { label: 'Contacto', href: '#contacto' },
  ],
  footerLinks: [
    { label: 'Inicio', href: '#inicio' },
    { label: 'Servicios', href: '#servicios' },
    { label: 'Cómo Funciona', href: '#como-funciona' },
    { label: 'Casos de Uso', href: '#casos' },
    { label: 'Contacto', href: '#contacto' },
  ],
  contactEmail: 'jaimedrodriguezf@gmail.com',
  contactPhone: '+593 98 314 4424',
  socialLinks,
};

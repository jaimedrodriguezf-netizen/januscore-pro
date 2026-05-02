export interface NavLink {
  label: string;
  href: string;
}

export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  url: string;
  ogImage: string;
  language: string;
  navLinks: NavLink[];
  footerLinks: NavLink[];
  socialLinks: SocialLink[];
  contactEmail: string;
  contactPhone: string;
}

export interface SocialLink {
  label: string;
  href: string;
  icon: string;
}

export interface BusinessUnit {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
  tags: string[];
  color: 'primary' | 'secondary' | 'accent';
}

export interface UseCase {
  id: string;
  title: string;
  description: string;
  icon: string;
  industry: string;
  result: string;
}

export interface Differentiator {
  id: string;
  title: string;
  description: string;
  icon: string;
  highlight?: boolean;
}

export interface Stat {
  id: string;
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
}

export interface ProcessStep {
  id: string;
  number: number;
  title: string;
  description: string;
  icon: string;
}

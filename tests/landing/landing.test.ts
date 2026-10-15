import { describe, it, expect } from 'vitest';
import { B2B_PRODUCTS, AI_SERVICES } from '@/lib/catalog/products';

import robots from '@/app/robots';
import sitemap from '@/app/sitemap';

describe('Process Automation & AI Engineering Hub', () => {
  it('contains core value propositions for business automation and AI engineering', () => {
    const valueProps = [
      'Ingeniería de Inteligencia Artificial',
      'Automatización de Procesos Críticos',
      'Catálogo Comercial de Software B2B',
      'Verificación Financiera & Antifraude Ed25519',
      'Arquitectura Multi-Tenant Segura RLS',
    ];

    valueProps.forEach((prop) => {
      expect(prop.length).toBeGreaterThan(10);
    });
  });

  it('defines the 4 key B2B commercial products without deprecated repositories', () => {
    expect(B2B_PRODUCTS).toHaveLength(4);
    const productIds = B2B_PRODUCTS.map((p) => p.id);
    expect(productIds).toEqual(['januscore-verify', 'dentiapp-online', 'kattxo', 'tenddy-shop']);
    expect(productIds).not.toContain('tuchamba-ec');

    B2B_PRODUCTS.forEach((prod) => {
      expect(prod.name).toBeTruthy();
      expect(prod.description).toBeTruthy();
      expect(prod.highlights.length).toBeGreaterThanOrEqual(4);
      expect(prod.stack.length).toBeGreaterThanOrEqual(3);
      expect(prod.repoUrl).toMatch(/^https:\/\/github\.com\//);
    });
  });

  it('defines custom AI engineering and automation services', () => {
    expect(AI_SERVICES.length).toBeGreaterThanOrEqual(4);
    const serviceIds = AI_SERVICES.map((s) => s.id);
    expect(serviceIds).toContain('vision-ocr');
    expect(serviceIds).toContain('llm-agents');
    expect(serviceIds).toContain('erp-automations');
    expect(serviceIds).toContain('enterprise-security');
  });

  it('defines structured navigation and CTA anchors', () => {
    const navItems = [
      { name: 'Productos B2B', href: '#productos' },
      { name: 'Servicios IA', href: '#servicios-ia' },
      { name: 'Soluciones', href: '#soluciones' },
      { name: 'Seguridad', href: '#seguridad' },
      { name: 'Ingresar', href: '/signin' },
    ];

    expect(navItems).toHaveLength(5);
    expect(navItems.find((n) => n.name === 'Ingresar')?.href).toBe('/signin');
  });

  it('validates SEO robots configuration protecting private routes', () => {
    const config = robots();
    expect(config.sitemap).toBe('https://januscore.pro/sitemap.xml');
    const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules;
    expect(rules).toBeDefined();

    // Must allow public routes
    const allowed = Array.isArray(rules?.allow) ? rules?.allow : [rules?.allow];
    expect(allowed).toContain('/');
    expect(allowed).toContain('/signin');

    // Must disallow private operator/tenant routes
    const disallowed = Array.isArray(rules?.allow) ? rules?.allow : [rules?.disallow];
    const flatDisallowed = Array.isArray(rules?.disallow) ? rules?.disallow : [rules?.disallow];
    expect(flatDisallowed).toContain('/api/*');
    expect(flatDisallowed).toContain('/receipts/*');
    expect(flatDisallowed).toContain('/portal/*');
    expect(flatDisallowed).toContain('/tenants/*');
  });

  it('validates SEO sitemap configuration for Google indexing', () => {
    const items = sitemap();
    expect(items.length).toBeGreaterThanOrEqual(2);

    const home = items.find((i) => i.url === 'https://januscore.pro');
    expect(home).toBeDefined();
    expect(home?.priority).toBe(1.0);
    expect(home?.changeFrequency).toBe('weekly');

    const signin = items.find((i) => i.url === 'https://januscore.pro/signin');
    expect(signin).toBeDefined();
    expect(signin?.priority).toBe(0.5);
  });
});


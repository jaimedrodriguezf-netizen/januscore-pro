export interface CaseStudy {
  id: string;
  clientName: string;
  tagline: string;
  logoUrl?: string;
  industry: string;
  scale: string;
  liveUrl?: string;
  challenge: string;
  solution: string;
  metrics: { label: string; value: string }[];
  keyModules: string[];
  techStack: string[];
}

export const FEATURED_CASE_STUDIES: CaseStudy[] = [
  {
    id: 'gm-bruno',
    clientName: 'Importadora GM Bruño S.A.',
    tagline: 'Plataforma Integral de Operaciones, Logística & Sincronización ERP Contífico',
    logoUrl: '/clients/gm-bruno.png',
    industry: 'Importación, Distribución & Retail Mayorista',
    scale: '18 Sucursales a Nivel Nacional',
    liveUrl: 'https://app.gmbruno.com',
    challenge:
      'Cuellos de botella operativos en traslados de mercadería entre bodegas, control de asistencias disperso en sucursales físicas y falta de sincronización en tiempo real con su sistema contable y ERP Contífico.',
    solution:
      'Diseño e implementación de AppGm (app.gmbruno.com): arquitectura modular Cloud-Only que automatiza el flujo logístico de traslados con escaneo de código de barras móvil, control de asistencias por PIN y sincronización bidireccional instantánea de inventario con Contífico.',
    metrics: [
      { label: 'Sucursales Conectadas', value: '18 Sedes' },
      { label: 'Sincronización ERP', value: 'Tiempo Real' },
      { label: 'Trazabilidad de Traslados', value: '100% Digital' },
      { label: 'Disponibilidad Cloud', value: '99.9%' },
    ],
    keyModules: [
      'Logística de Traslados v2 con escaneo Barcode',
      'Pedidos Inter-Bodega y negociación de stock',
      'Integración desatendida con ERP Contífico',
      'Marcación y control de asistencias en kioscos',
      'Impresión térmica masiva de etiquetas de precios',
    ],
    techStack: ['React 19', 'Vite', 'TypeScript', 'Supabase RLS', 'Contífico ERP API', 'FSD Architecture'],
  },
];

export const TRUSTED_INDUSTRIES = [
  {
    name: 'Importadora GM Bruño S.A.',
    badge: '18 Sucursales',
    desc: 'Logística, inventarios y ERP Contífico en app.gmbruno.com',
    icon: '🏢',
    url: 'https://app.gmbruno.com',
  },
  {
    name: 'Red de Clínicas Odontológicas',
    badge: 'Formulario 033 MSP',
    desc: 'Historias clínicas y odontogramas digitales con DentiApp Online',
    icon: '🦷',
    url: 'https://github.com/jaimedrodriguezf-netizen/dentiapp-online',
  },
  {
    name: 'Estudios Contables & Tributarios',
    badge: 'Automatización SRI',
    desc: 'Extracción y procesamiento masivo de retenciones XML con Kattxo',
    icon: '🧾',
    url: 'https://github.com/jaimedrodriguezf-netizen/kattxo',
  },
  {
    name: 'Distribuidoras & Comercio B2B',
    badge: 'Catálogos Masivos',
    desc: 'Cotizaciones en tiempo real y sincronización Excel con Tenddy Shop',
    icon: '🛒',
    url: 'https://github.com/jaimedrodriguezf-netizen/tenddy-shop',
  },
];

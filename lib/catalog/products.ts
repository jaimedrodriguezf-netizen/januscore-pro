export interface B2BProduct {
  id: string;
  name: string;
  tagline: string;
  category: 'Fintech & Seguridad B2B' | 'SaaS Clínico' | 'Automatización Fiscal' | 'E-commerce B2B';
  badgeColor: string;
  icon: string;
  description: string;
  highlights: string[];
  features: string[];
  stack: string[];
  liveUrl?: string;
  repoUrl?: string;
  priceModel: string;
}

export interface AIService {
  id: string;
  title: string;
  shortDesc: string;
  icon: string;
  deliverables: string[];
  techStack: string[];
}

export const B2B_PRODUCTS: B2BProduct[] = [
  {
    id: 'januscore-verify',
    name: 'JanusCore Verify & Security',
    tagline: 'Verificación Financiera, Prevención Antifraude & Trazabilidad B2B',
    category: 'Fintech & Seguridad B2B',
    badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    icon: '🛡️',
    description:
      'Motor B2B de verificación de comprobantes y transferencias financieras con análisis OCR de imágenes, detección automática de recibos duplicados y trazabilidad mediante códigos QR interactivos con aislamiento multi-tenant RLS.',
    highlights: [
      'Validación y auditoría antifraude de comprobantes',
      'Detección automática de comprobantes duplicados o adulterados',
      'Auditoría y revisión a cuatro ojos para control de tesorería',
      'Extracción OCR de referencias, montos y fechas bancarias',
      'Aislamiento multi-tenant estricto con PostgreSQL RLS',
    ],
    features: [
      'Bandeja de auditoría con trazabilidad inmutable de estados',
      'Integración de webhooks para conciliación automática con ERPs',
      'Control de acceso granular por sucursales y roles RBAC',
      'Exportación estructurada de transacciones verificadas en CSV y JSON',
    ],
    stack: ['Next.js 16', 'TypeScript 5', 'OCR Vision', 'Supabase RLS', 'PostgreSQL', 'jsQR'],
    repoUrl: 'https://github.com/jaimedrodriguezf-netizen/januscore-pro',
    priceModel: 'Licencia SaaS por Volumen o Implementación On-Premise',
  },
  {
    id: 'dentiapp-online',
    name: 'DentiApp Online',
    tagline: 'SaaS Clínico Odontológico con Cumplimiento Oficial MSP 033',
    category: 'SaaS Clínico',
    badgeColor: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
    icon: '🦷',
    description:
      'Software administrativo y clínico multi-tenant para clínicas y consultorios odontológicos. Cuenta con odontograma interactivo, periodontograma digital y generación automática del Formulario Oficial 033 del Ministerio de Salud Pública del Ecuador.',
    highlights: [
      'Cumplimiento normativo Formulario 033 MSP',
      'Odontograma y periodontograma interactivo',
      'Aislamiento de historias clínicas por clínica',
      'Control de citas, diagnósticos y tratamientos',
    ],
    features: [
      'Gestión de doctores, asistentes y pacientes con roles RBAC',
      'Exportación en PDF lista para auditorías de salud',
      'Panel de ingresos y facturación de tratamientos',
      'Diseñado para desktop, tablets y consultorios',
    ],
    stack: ['Next.js App Router', 'TypeScript', 'Supabase PostgreSQL', 'Tailwind CSS', 'Vitest'],
    repoUrl: 'https://github.com/jaimedrodriguezf-netizen/dentiapp-online',
    priceModel: 'SaaS por Consultorio / Clínica o Código Fuente Llave en Mano',
  },
  {
    id: 'kattxo',
    name: 'Kattxo SRI Extension',
    tagline: 'Extensión y Motor de Extracción Masiva de Comprobantes XML del SRI',
    category: 'Automatización Fiscal',
    badgeColor: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400',
    icon: '🧾',
    description:
      'Herramienta de automatización y extensión de Google Chrome (Manifest V3) para descargar, validar y consolidar masivamente comprobantes tributarios (retenciones, facturas) desde el portal del SRI sin bloqueos ni caídas por sesión.',
    highlights: [
      'Cola de descargas con throttling inteligente anti-baneo',
      'Parseo y validación estricta de esquemas XML del SRI',
      'Generación de reportes tabulados para contabilidad',
      'Ahorro de hasta 90% del tiempo de descarga mensual',
    ],
    features: [
      'Descarga automática por rangos de fecha y tipo de comprobante',
      'Procesamiento en lote directamente en el navegador',
      'Resiliente a fallos de conexión del portal oficial',
      'Compatible con cualquier sistema contable o ERP',
    ],
    stack: ['TypeScript', 'Vite 6', 'Chrome Manifest V3', 'Vitest', 'XML DOM Parser'],
    repoUrl: 'https://github.com/jaimedrodriguezf-netizen/kattxo',
    priceModel: 'Suscripción por Empresa Contable o Licencia Perpetua',
  },
  {
    id: 'tenddy-shop',
    name: 'Tenddy Shop',
    tagline: 'E-commerce B2B/B2C Multi-Tenant con Cotizador Masivo Excel/CSV',
    category: 'E-commerce B2B',
    badgeColor: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
    icon: '🛒',
    description:
      'Plataforma moderna de comercio electrónico y cotizaciones comerciales en tiempo real. Soporta catálogos de miles de productos con carga masiva desde hojas de cálculo y canalización de órdenes cerradas directo a WhatsApp.',
    highlights: [
      'Multi-tienda con aislamiento independiente por negocio',
      'Carga y actualización masiva vía archivos Excel y CSV',
      'Cotizador en línea con cálculo de márgenes y descuentos',
      'Cierre de ventas instantáneo canalizado por WhatsApp',
    ],
    features: [
      'Carrito de compras persistente por tienda',
      'Búsqueda ultrarrápida y filtrado facetado de catálogo',
      'Panel de administración ligero sin sobrecarga técnica',
      'Optimizado para móviles y conexión rápida',
    ],
    stack: ['Next.js 16', 'React 19', 'Supabase RLS', 'PapaParse / SheetJS', 'Tailwind CSS'],
    repoUrl: 'https://github.com/jaimedrodriguezf-netizen/tenddy-shop',
    priceModel: 'Licencia Comercial por Tienda o Implementación a Medida',
  },
];

export const AI_SERVICES: AIService[] = [
  {
    id: 'vision-ocr',
    title: 'Visión Artificial & OCR para Documentos',
    shortDesc:
      'Pipelines automatizados de extracción y auditoría de comprobantes bancarios, facturas y firmas con validación criptográfica y detección de anomalías.',
    icon: '👁️',
    deliverables: [
      'Procesamiento y decodificación de códigos QR de alta densidad',
      'Extracción estructurada de montos, fechas, referencias bancarias',
      'Detección automática de comprobantes duplicados o adulterados',
      'Integración con webhooks o almacenamiento en base de datos',
    ],
    techStack: ['Python', 'Node.js', 'jsQR / OpenCV', 'OCR Pipeline', 'Cloud Vision'],
  },
  {
    id: 'llm-agents',
    title: 'Agentes de IA & Model Context Protocol (MCP)',
    shortDesc:
      'Diseño e integración de agentes autónomos y servidores MCP que conectan modelos de lenguaje de última generación con tus bases de datos y sistemas ERP.',
    icon: '🧠',
    deliverables: [
      'Servidores MCP para consulta segura de bases de datos operativas',
      'Agentes especializados para soporte, cotizaciones o inventario',
      'Orquestación con límites de contexto y control de costes',
      'Aislamiento de seguridad y políticas de acceso a nivel de fila',
    ],
    techStack: ['Model Context Protocol', 'OpenAI', 'Anthropic Claude', 'Supabase', 'TypeScript'],
  },
  {
    id: 'erp-automations',
    title: 'Automatización de Flujos & Sincronización ERP',
    shortDesc:
      'Conexión desatendida entre plataformas de facturación, portales tributarios (SRI) y sistemas empresariales para eliminar la carga operativa manual.',
    icon: '⚡',
    deliverables: [
      'Descarga e ingesta masiva de comprobantes tributarios',
      'Sincronización bidireccional entre sistemas legados y la nube',
      'Pipelines de notificación automática por WhatsApp y Telegram',
      'Alertas en tiempo real ante discrepancias de stock o cobros',
    ],
    techStack: ['Next.js Server Actions', 'Supabase Edge Functions', 'Webhooks', 'REST / GraphQL'],
  },
  {
    id: 'enterprise-security',
    title: 'Arquitectura Cloud & Seguridad Multi-Tenant',
    shortDesc:
      'Diseño e implementación de sistemas multi-inquilino con aislamiento criptográfico y políticas RLS estrictas en PostgreSQL para proteger la información de cada cliente.',
    icon: '🛡️',
    deliverables: [
      'Auditorías de aislamiento Row Level Security (RLS)',
      'Autenticación empresarial con OAuth, Magic Links y RBAC',
      'Despliegue serverless de alta disponibilidad y bajo costo',
      'Cumplimiento de estándares de trazabilidad y separación de funciones',
    ],
    techStack: ['PostgreSQL RLS', 'Supabase SSR', 'Docker', 'Next.js App Router'],
  },
];

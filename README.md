# JanusCore Pro - Plataforma B2B de Automatización de Operaciones & Verificación Financiera

> Ecosistema modular B2B para digitalización de operaciones de campo, trazabilidad automotriz y verificación antifraude de comprobantes financieros con firmas criptográficas Ed25519 y arquitectura multi-tenant sobre Next.js 16 y Supabase (PostgreSQL con Row Level Security).

Sitio en producción: [https://januscore.pro](https://januscore.pro)

---

## 🎯 Visión General

**JanusCore Pro** es una plataforma tecnológica diseñada para eliminar el uso de papel y los riesgos operativos en negocios tradicionales. Conecta operaciones físicas con el mundo digital mediante códigos QR interactivos, portales dedicados por marca (`/m/[slug]`), trazabilidad en tiempo real y conciliación bancaria automatizada.

---

## 🚀 Módulos y Capacidades Principales

### 1. Trazabilidad Automotriz & Talleres Mecánicos
- **Recepción Digital sin Papel:** Mapeo interactivo 2D de carrocería y registro de inventario al ingreso del vehículo.
- **Catálogo OEM Integrado:** Fichas técnicas preconfiguradas para más de 136 modelos de vehículos comerciales.
- **Stickers QR para Parabrisas:** Generación e impresión de planchas A4 de stickers con QR únicos para trazabilidad del cliente sin necesidad de instalar aplicaciones.
- **Portal de Autoservicio (`/m/[slug]`):** Espacio web donde los clientes consultan el estado de su vehículo, historial de servicios y kilometraje.

### 2. Verificación Financiera & Antifraude (Ed25519)
- **Validación Criptográfica:** Motor de verificación de comprobantes y transferencias mediante firmas asimétricas **Ed25519** (`@noble/ed25519`).
- **Procesamiento de Imágenes a Bajo Nivel:** Análisis de imágenes con `pngjs`, `jpeg-js` y decodificación de códigos QR con `jsqr`.
- **Detección de Recibos Reutilizados:** Prevención de fraudes por duplicación de comprobantes de pago.

### 3. Arquitectura Multi-Tenant & Seguridad
- Aislamiento total de datos por empresa cliente mediante políticas de **Row Level Security (RLS)** en PostgreSQL.
- Control de acceso basado en roles (Platform Admin, Tenant Owner, Operador, Cliente).
- Suite automatizada de pruebas específicas para validación de políticas RLS (`npm run test:rls`).

---

## 🛠️ Stack Tecnológico

- **Framework Web:** Next.js 16 (App Router / React Server Components) + React 19
- **Lenguaje:** TypeScript 5 (tipado estricto)
- **Persistencia & RLS:** Supabase (`@supabase/ssr`, `@supabase/supabase-js`, PostgreSQL)
- **Criptografía & QR:** `@noble/ed25519`, `qrcode`, `jsqr`, `jpeg-js`, `pngjs`
- **Estilos:** Tailwind CSS v4
- **Testing:** Vitest 4 + Playwright (E2E)

---

## 🧪 Pruebas Automatizadas

El proyecto cuenta con suites de pruebas unitarias, de integración y de seguridad RLS:

```bash
# Ejecutar suite de pruebas generales
npm test

# Ejecutar pruebas exclusivas de aislamiento Row Level Security (RLS)
npm run test:rls
```

---

## 📦 Configuración y Ejecución Local

### Requisitos
- Node.js >= 20.0.0
- pnpm >= 9 o npm >= 10
- Instancia activa de Supabase

### 1. Clonar e instalar
```bash
git clone https://github.com/jaimedrodriguezf-netizen/januscore-pro.git
cd januscore-pro
pnpm install
```

### 2. Variables de entorno (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### 3. Iniciar desarrollo
```bash
pnpm dev
```

---

## 🌐 Ecosistema de Plataformas Relacionadas

JanusCore Pro forma parte de un ecosistema de soluciones de software empresarial desarrolladas por el mismo autor:
- 🦷 **[DentiApp Online](https://github.com/jaimedrodriguezf-netizen/dentiapp-online):** SaaS clínico odontológico multi-tenant con cumplimiento oficial del Formulario 033 MSP (Ecuador).
- 🧾 **[Kattxo SRI Extension](https://github.com/jaimedrodriguezf-netizen/kattxo):** Extensión de Chrome en TypeScript para descarga masiva y análisis de comprobantes XML del SRI.
- 🛒 **[Tenddy Shop](https://github.com/jaimedrodriguezf-netizen/tenddy-shop):** E-commerce multi-tenant con cotizador en línea y procesamiento masivo con Excel/CSV.

---

## 📄 Licencia y Autor

Desarrollado y mantenido por **Ing. Jaime Daniel Rodríguez** ([jaimedrodriguezf@gmail.com](mailto:jaimedrodriguezf@gmail.com)).  
LinkedIn: [linkedin.com/in/jaime-rodriguez-981463262](https://linkedin.com/in/jaime-rodriguez-981463262) | Portafolio: [januscore.pro](https://januscore.pro)

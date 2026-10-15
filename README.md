# JanusCore Technologies — AI Engineering, Enterprise Automation & B2B Software Products

> Plataforma centralizada de ingeniería de inteligencia artificial aplicada, automatización de operaciones críticas y comercialización de software B2B de alto rendimiento. Arquitecturas multi-tenant sobre Next.js 16, Supabase (PostgreSQL con Row Level Security) y validación criptográfica asimétrica Ed25519.

Sitio en producción: [https://januscore.pro](https://januscore.pro)

---

## 🎯 Visión General

**JanusCore Technologies** es un estudio y plataforma tecnológica diseñada para eliminar el uso de papel, los cuellos de botella manuales y los riesgos de fraude en empresas tradicionales y operaciones de campo. 

Centraliza una suite de **4 productos B2B listos para producción** y ofrece **servicios de ingeniería de IA y automatización desatendida** a medida para empresas que buscan escalar su eficiencia operativa.

---

## 📦 Catálogo de Productos B2B Comercializados

### 1. 🛡️ JanusCore Verify & Security — Motor Antifraude & Verificación Criptográfica B2B
- **Validación Criptográfica Asimétrica:** Motor de verificación de comprobantes y transferencias mediante firmas **Ed25519** (`@noble/ed25519`).
- **Análisis de Imágenes & OCR a Bajo Nivel:** Procesamiento con `pngjs`, `jpeg-js` y decodificación de códigos QR de alta densidad con `jsqr`.
- **Detección de Recibos Reutilizados:** Prevención automática de fraudes por duplicación o adulteración de comprobantes de pago.
- **Auditoría & Revisión a Cuatro Ojos:** Flujo estricto de separación de funciones para autorización de fondos y conciliación con ERPs.
- **Aislamiento Multi-Tenant:** Políticas estrictas de Row Level Security (RLS) en PostgreSQL para proteger la información financiera de cada empresa.
- **Repositorio:** [github.com/jaimedrodriguezf-netizen/januscore-pro](https://github.com/jaimedrodriguezf-netizen/januscore-pro)

### 2. 🦷 DentiApp Online — SaaS Clínico Odontológico Multi-Tenant
- **Cumplimiento Oficial Formulario 033 MSP:** Generación automatizada de historias clínicas según la normativa del Ministerio de Salud Pública (Ecuador).
- **Odontograma & Periodontograma Interactivo:** Registro visual de piezas dentales, diagnósticos y tratamientos en tiempo real.
- **Gestión Multi-Clínica:** Aislamiento total de historiales clínicos y roles RBAC (doctores, asistentes, administración).
- **Repositorio:** [github.com/jaimedrodriguezf-netizen/dentiapp-online](https://github.com/jaimedrodriguezf-netizen/dentiapp-online)

### 3. 🧾 Kattxo SRI Extension — Automatización Fiscal & Extracción XML
- **Descarga Masiva sin Bloqueos:** Extensión de Google Chrome (Manifest V3) en TypeScript con cola de throttling inteligente anti-baneo para el portal del SRI.
- **Parseo y Validación Estricta:** Extracción y tabulación de datos de comprobantes electrónicos (retenciones, facturas).
- **Ahorro Operativo:** Reduce hasta un 90% el tiempo de descarga manual en departamentos contables y auditorías.
- **Repositorio:** [github.com/jaimedrodriguezf-netizen/kattxo](https://github.com/jaimedrodriguezf-netizen/kattxo)

### 4. 🛒 Tenddy Shop — E-commerce B2B/B2C con Cotizador Masivo
- **Aislamiento Multi-Tenant por Tienda:** Comercio electrónico moderno con carrito independiente y panel de control ágil.
- **Carga Masiva Excel/CSV:** Gestión de inventarios y catálogos de miles de productos mediante hojas de cálculo.
- **Cotizador en Tiempo Real & Cierre por WhatsApp:** Cálculo de márgenes y canalización instantánea de órdenes a chats comerciales.
- **Repositorio:** [github.com/jaimedrodriguezf-netizen/tenddy-shop](https://github.com/jaimedrodriguezf-netizen/tenddy-shop)

---

## ⚡ Servicios de Ingeniería de IA & Automatización a Medida

1. **Visión Artificial & OCR para Documentos:** Extracción estructurada y validación de comprobantes de pago, firmas y documentos no estructurados.
2. **Agentes de IA & Model Context Protocol (MCP):** Integración de LLMs (OpenAI, Claude, Gemini) con bases de datos transaccionales de forma segura.
3. **Automatización de Flujos & Sincronización ERP:** Integración desatendida entre plataformas de facturación, portales gubernamentales y sistemas ERP legacy.
4. **Arquitecturas Cloud & Seguridad RLS:** Diseño e implementación de sistemas multi-inquilino con políticas Row Level Security en PostgreSQL.

---

## 🛠️ Stack Tecnológico

- **Frontend & App:** Next.js 16 (App Router / React Server Components) + React 19 + Tailwind CSS v4
- **Lenguaje:** TypeScript 5 (tipado estricto)
- **Persistencia & Seguridad:** Supabase (`@supabase/ssr`, PostgreSQL con Row Level Security)
- **Criptografía & QR:** `@noble/ed25519`, `qrcode`, `jsqr`, `jpeg-js`, `pngjs`
- **Testing:** Vitest + Playwright

---

## 📦 Configuración y Ejecución Local

### Requisitos
- Node.js >= 20.0.0
- pnpm >= 9 o npm >= 10
- Instancia activa de Supabase

```bash
# Clonar repositorio
git clone https://github.com/jaimedrodriguezf-netizen/januscore-pro.git
cd januscore-pro

# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev
```

---

## 📄 Contacto & Licenciamiento

Para licencias comerciales, demostraciones ejecutivas o proyectos de ingeniería a medida:
- **Sitio Web:** [https://januscore.pro](https://januscore.pro)
- **WhatsApp / Teléfono:** [+593 98 314 4424](https://wa.me/593983144424)
- **Email Comercial:** [jaimedrodriguezf@gmail.com](mailto:jaimedrodriguezf@gmail.com)

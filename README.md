# 🌌 Janus Core Landing

**Bits, Átomos e Inteligencia**

Janus Core es la conexión definitiva entre el mundo físico y la inteligencia digital. Esta plataforma presenta soluciones de **IoT Industrial, Mantenimiento Predictivo y Automatización Inteligente**, diseñadas para transformar la operación de activos físicos mediante tecnología de vanguardia.

[![Live Site](https://img.shields.io/badge/Live-januscore.pro-00D4FF?style=for-the-badge)](https://januscore.pro)
[![Stack](https://img.shields.io/badge/Stack-Astro%20|%20React%20|%20Tailwind-7B61FF?style=for-the-badge)](#-tech-stack)

---

## ✨ Características Principales

- 🚀 **Performance Extrema**: Construido con **Astro 6** para una carga instantánea y SEO optimizado.
- 📱 **Mobile-First & Ultra-Compact**: Menú lateral tipo "Command Center" diseñado para eficiencia y estética técnica.
- 💎 **Diseño Premium**: Interfaz con efectos de _glassmorphism_, desenfoques en tiempo real y animaciones cinemáticas con **Framer Motion**.
- 🛠️ **Arquitectura de Islas**: Componentes interactivos de **React 19** hidratados solo donde es necesario.
- 📞 **Conversión Directa**: Flujo de contacto profesional integrado con WhatsApp y E-mail, sin formularios pesados.

---

## 🛠️ Tech Stack

El proyecto utiliza las herramientas más modernas del ecosistema frontend:

- **Framework**: [Astro 6.2](https://astro.build/) (Static Site Generation)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & [GSAP](https://gsap.com/)
- **Testing**: [Playwright](https://playwright.dev/) (E2E) & [Vitest](https://vitest.dev/) (Unit)
- **Validation**: [Zod](https://zod.dev/)

---

## 🚀 Desarrollo y despliegue

### Requisitos

- Node.js >= 22.12.0

### Instalación

```bash
npm install
```

### Comandos Locales

- `npm run dev`: Inicia el servidor de desarrollo en `localhost:3000`.
- `npm run build`: Genera los archivos estáticos en la carpeta `dist/`.
- `npm run preview`: Previsualiza el build de producción localmente.

### 🧪 Testing

Contamos con una suite de tests automatizados para asegurar la estabilidad visual:

```bash
npx playwright test
```

### 🚢 Despliegue (Hostinger)

El despliegue se realiza de forma quirúrgica vía SSH/Rsync para garantizar que los archivos se actualicen sin interrumpir el servicio:

```bash
# Ejemplo de despliegue a producción
rsync -avz --progress -e 'ssh -p <PORT>' dist/ <USER>@<HOST>:<PATH>
```

---

## 🏗️ Estructura del Proyecto

```text
/
├── src/
│   ├── components/       # Componentes Astro y React (Islas)
│   ├── data/             # Configuración centralizada (siteData.ts)
│   ├── layouts/          # Plantillas base
│   ├── pages/            # Rutas del sitio (Astro Router)
│   └── styles/           # Tokens de diseño y CSS global
├── public/               # Assets estáticos (SVGs, favicon)
└── tests/                # Suite de verificación Playwright
```

---

## 👨‍💻 Autor

**Jaime Rodriguez** - [jaimedrodriguezf@gmail.com](mailto:jaimedrodriguezf@gmail.com)

---

<p align="center">
  Hecho con ❤️ por Janus Core Team
</p>

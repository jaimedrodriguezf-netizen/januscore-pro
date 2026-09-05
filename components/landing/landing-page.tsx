import React from 'react';
import Link from 'next/link';
import { APP_VERSION } from '@/lib/version';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* 1. Glassmorphic Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-sm font-black text-white shadow-md shadow-indigo-600/30">
              J
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-tight text-white">
                  JanusCore Pro
                </span>
                <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.2 text-[9px] font-mono font-bold text-indigo-400">
                  {APP_VERSION}
                </span>
              </div>
              <span className="block text-[10px] text-slate-400">
                Soluciones Tecnológicas & Automatización
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <a href="#soluciones" className="hover:text-indigo-400 transition">Soluciones</a>
            <a href="#modulos" className="hover:text-indigo-400 transition">Módulos</a>
            <a href="#como-funciona" className="hover:text-indigo-400 transition">Cómo Funciona</a>
            <a href="#seguridad" className="hover:text-indigo-400 transition">Seguridad</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/auto"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition"
            >
              <span>🔍 Consultar QR</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition active:scale-95"
            >
              <span>Acceder al Sistema</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-[600px] rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 h-72 w-72 rounded-full bg-cyan-600/10 blur-[100px] pointer-events-none" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3.5 py-1.5 text-xs font-semibold text-indigo-300 shadow-inner">
            <span className="text-indigo-400">⚡</span>
            <span>Motor de Automatización de Procesos Empresariales</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
            Automatizamos y Digitalizamos las Operaciones Críticas de tu Negocio
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Elimina tareas manuales, desorden en papel y riesgos operativos. Una plataforma modular B2B diseñada para conectar a tu equipo y a tus clientes mediante trazabilidad digital, códigos QR interactivos, validación antifraude y notificaciones automáticas.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 hover:scale-[1.02] transition active:scale-95"
            >
              <span>🚀 Comenzar / Iniciar Sesión</span>
            </Link>
            <Link
              href="/auto"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/90 px-6 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition"
            >
              <span>🔍 Ver Ficha QR de Demostración</span>
            </Link>
          </div>

          {/* Core Guarantees Banner */}
          <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-800/80">
            <div className="p-3">
              <span className="block text-xl font-black text-indigo-400 font-mono">100%</span>
              <span className="text-xs text-slate-400">Cero Papel</span>
            </div>
            <div className="p-3">
              <span className="block text-xl font-black text-emerald-400 font-mono">Instantáneo</span>
              <span className="text-xs text-slate-400">Acceso QR sin Apps</span>
            </div>
            <div className="p-3">
              <span className="block text-xl font-black text-cyan-400 font-mono">Multi-Tenant</span>
              <span className="text-xs text-slate-400">Aislamiento Total</span>
            </div>
            <div className="p-3">
              <span className="block text-xl font-black text-purple-400 font-mono">Ed25519</span>
              <span className="text-xs text-slate-400">Firmas Criptográficas</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Problem vs Solution Section */}
      <section id="soluciones" className="border-t border-slate-800/80 bg-slate-900/40 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Transformación Digital
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              De la Fricción Manual a la Automatización Fluida
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Diseñamos tecnología para resolver problemas reales de control, tiempos y comunicación con el cliente.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Old Way */}
            <div className="rounded-3xl border border-rose-500/20 bg-gradient-to-b from-rose-950/20 to-slate-950 p-7 space-y-4">
              <div className="flex items-center gap-3 text-rose-400">
                <span className="text-2xl">⚠️</span>
                <h3 className="text-base font-bold">Operación Tradicional</h3>
              </div>
              <ul className="space-y-3 text-xs text-slate-400">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold shrink-0">✕</span>
                  <span>Registros en papel propensos a pérdidas, manchas y deterioro físico.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold shrink-0">✕</span>
                  <span>Falta de trazabilidad: el cliente no sabe qué se le hizo a su activo ni cuándo le toca el próximo servicio.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold shrink-0">✕</span>
                  <span>Comprobantes de pago recibidos por WhatsApp sin validar autenticidad ni detectar duplicados.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold shrink-0">✕</span>
                  <span>Sistemas monolíticos pesados que obligan a pagar por funciones que no se usan.</span>
                </li>
              </ul>
            </div>

            {/* The JanusCore Way */}
            <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-slate-950 p-7 space-y-4 shadow-lg shadow-emerald-950/20">
              <div className="flex items-center gap-3 text-emerald-400">
                <span className="text-2xl">✓</span>
                <h3 className="text-base font-bold">Con JanusCore Pro</h3>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span>Historial 100% digital en la nube, accesible al instante escaneando un código QR.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span>Portales de marca dedicados (<strong className="text-white">/m/[tu-empresa]</strong>) con agendamiento directo por WhatsApp.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span>Motor antifraude financiero con verificación criptográfica y conciliación automática.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span>Arquitectura modular plug & play: activas solo las soluciones específicas de tu industria.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Industry Vertical Modules Grid */}
      <section id="modulos" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Módulos Plug & Play
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Soluciones Especializadas por Industria
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Un ecosistema de módulos independientes diseñados para potenciar la productividad y el autoservicio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Module 1 */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-4 hover:border-indigo-500/50 hover:bg-slate-900 transition group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-2xl group-hover:scale-110 transition-transform">
                🚗
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition">
                Trazabilidad Automotriz & Talleres
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Recepción con mapa 2D de carrocería, órdenes de trabajo sin papel, catálogo OEM de 136+ modelos y generación de stickers QR para parabrisas.
              </p>
              <div className="pt-2 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">Stickers QR A4</span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">Mapa Daños 2D</span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">Portal /m/[slug]</span>
              </div>
            </div>

            {/* Module 2 */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-4 hover:border-emerald-500/50 hover:bg-slate-900 transition group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-2xl group-hover:scale-110 transition-transform">
                💳
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                Verificación Financiera & Antifraude
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Auditoría automática de comprobantes bancarios, extracción OCR, validación criptográfica de firmas QR y detección de recibos reutilizados.
              </p>
              <div className="pt-2 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">Extracción OCR</span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">Detección Fraude</span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">Exportación CSV</span>
              </div>
            </div>

            {/* Module 3 */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-4 hover:border-cyan-500/50 hover:bg-slate-900 transition group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600/10 border border-cyan-500/20 text-2xl group-hover:scale-110 transition-transform">
                🏢
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition">
                Arquitectura Multi-Tenant & Sedes
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Aislamiento estricto de base de datos para cada empresa cliente, gestión de sucursales físicas, asignación de roles y control granular.
              </p>
              <div className="pt-2 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">Seguridad RLS</span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">Sucursales</span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">Roles RBAC</span>
              </div>
            </div>

            {/* Module 4 */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-4 hover:border-purple-500/50 hover:bg-slate-900 transition group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600/10 border border-purple-500/20 text-2xl group-hover:scale-110 transition-transform">
                📲
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition">
                Conexión WhatsApp & Google Maps
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mensajes pre-estructurados con información del servicio y matrícula, además de navegación GPS en un solo clic hacia tu negocio.
              </p>
              <div className="pt-2 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">WhatsApp Direct</span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">Google Maps</span>
              </div>
            </div>

            {/* Module 5 */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-4 hover:border-amber-500/50 hover:bg-slate-900 transition group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600/10 border border-amber-500/20 text-2xl group-hover:scale-110 transition-transform">
                👤
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition">
                Portal de Autoservicio para Clientes
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Espacio digital donde tus clientes pueden verificar estados, actualizar odómetros de sus vehículos o consultar comprobantes en tiempo real.
              </p>
              <div className="pt-2 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">Autogestión</span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">Actualización Km</span>
              </div>
            </div>

            {/* Module 6 */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-4 hover:border-blue-500/50 hover:bg-slate-900 transition group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20 text-2xl group-hover:scale-110 transition-transform">
                🔑
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition">
                Autenticación Moderna con Google
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Acceso sin contraseñas engorrosas mediante Google OAuth o correo con estándares de seguridad avanzados y sesiones persistentes.
              </p>
              <div className="pt-2 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">Google OAuth</span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">Sesiones Seguras</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works (3 Simple Steps) */}
      <section id="como-funciona" className="border-t border-slate-800/80 bg-slate-900/40 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Puesta en Marcha
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Cómo Funciona la Automatización
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Implementación en tres simples pasos sin curvas de aprendizaje complejas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 space-y-3">
              <div className="font-mono text-3xl font-black text-indigo-500/40">01</div>
              <h3 className="text-base font-bold text-white">Elige tu Módulo</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Selecciona la vertical de negocio que necesitas (Mecánica Automotriz, Verificación Financiera o Suite Completa).
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 space-y-3">
              <div className="font-mono text-3xl font-black text-cyan-500/40">02</div>
              <h3 className="text-base font-bold text-white">Configura tu Marca</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingresa tu logo comercial, teléfono de WhatsApp, ubicación en Google Maps y crea tu enlace personalizado.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 space-y-3">
              <div className="font-mono text-3xl font-black text-emerald-500/40">03</div>
              <h3 className="text-base font-bold text-white">Conecta con tus Clientes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Genera stickers QR, comparte el portal de autoservicio y automatiza la trazabilidad en tiempo real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Security & Engineering Architecture */}
      <section id="seguridad" className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-8 sm:p-12 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Infraestructura & Seguridad
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Ingeniería Sólida Diseñada para Escalar
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Construido sobre Next.js Server Components, PostgreSQL con Row Level Security (RLS) estricto y estándares criptográficos que garantizan la integridad de cada transacción.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                  <strong className="block text-indigo-400 font-mono">Row Level Security</strong>
                  <span className="text-slate-400 mt-1 block">Aislamiento criptográfico por inquilino a nivel de base de datos.</span>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                  <strong className="block text-emerald-400 font-mono">Firmas Ed25519</strong>
                  <span className="text-slate-400 mt-1 block">Validación asimétrica de autenticidad en códigos QR bancarios.</span>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                  <strong className="block text-cyan-400 font-mono">Serverless & SSR</strong>
                  <span className="text-slate-400 mt-1 block">Tiempos de carga instantáneos y renderizado optimizado en borde.</span>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                  <strong className="block text-purple-400 font-mono">99.9% Uptime</strong>
                  <span className="text-slate-400 mt-1 block">Arquitectura resiliente con despliegue continuo y alta disponibilidad.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Final Call to Action */}
      <section className="border-t border-slate-800/80 bg-slate-900/60 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            ¿Listo para Transformar los Procesos de tu Empresa?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Ingresa a la plataforma, configura tu espacio de trabajo y comienza a automatizar tus operaciones hoy mismo.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 hover:scale-105 transition active:scale-95"
            >
              <span>Ingresar a JanusCore Pro</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-300">JanusCore Pro</span>
            <span>•</span>
            <span>Plataforma de Automatización de Procesos</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/auto" className="hover:text-slate-400 transition">Buscador QR</Link>
            <Link href="/login" className="hover:text-slate-400 transition">Iniciar Sesión</Link>
            <span className="font-mono text-[10px] text-slate-600">{APP_VERSION}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

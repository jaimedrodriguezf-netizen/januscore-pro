'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { APP_VERSION } from '@/lib/version';
import { B2B_PRODUCTS, AI_SERVICES } from '@/lib/catalog/products';
import { LeadModal } from './lead-modal';
import { StructuredData } from './structured-data';

export function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState<string>('januscore-verify');

  const openLeadModal = (interestId: string = 'januscore-verify') => {
    setSelectedInterest(interestId);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Schema.org Structured Data for Search Engines */}
      <StructuredData />

      {/* Lead Generation Modal */}
      <LeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialInterest={selectedInterest}
      />

      {/* 1. Glassmorphic Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-sm font-black text-white shadow-md shadow-indigo-600/30">
              J
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-tight text-white">
                  JanusCore
                </span>
                <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.2 text-[9px] font-mono font-bold text-indigo-400">
                  {APP_VERSION}
                </span>
              </div>
              <span className="block text-[10px] text-slate-400">
                AI Engineering & Enterprise Automation Studio
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <a href="#productos" className="hover:text-indigo-400 transition">Productos B2B</a>
            <a href="#servicios-ia" className="hover:text-indigo-400 transition">Servicios de IA & Automatización</a>
            <a href="#soluciones" className="hover:text-indigo-400 transition">Soluciones</a>
            <a href="#seguridad" className="hover:text-indigo-400 transition">Seguridad & RLS</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => openLeadModal('custom')}
              className="hidden lg:inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-950/30 px-3.5 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/50 hover:text-white transition"
            >
              <span>💼 Solicitar Cotización</span>
            </button>
            <a
              href="#productos"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition"
            >
              <span>🚀 Ver Catálogo</span>
            </a>
            <Link
              href="/signin"
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
            <span>Estudio Centralizado de Soluciones de Software B2B & Automatización</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
            Ingeniería de Inteligencia Artificial & Automatización de Operaciones Críticas
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Comercializamos software empresarial listo para producción y desarrollamos pipelines de automatización con IA a medida. Eliminamos el papel, blindamos la tesorería contra fraudes y conectamos tus sistemas con visión artificial y agentes autónomos.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href="#productos"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 hover:scale-[1.02] transition active:scale-95"
            >
              <span>🚀 Explorar Productos B2B en Venta</span>
            </a>
            <button
              onClick={() => openLeadModal('custom')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-500/30 bg-slate-900/90 px-6 py-3.5 text-sm font-semibold text-indigo-300 hover:bg-slate-800 hover:text-white transition"
            >
              <span>💬 Agendar Diagnóstico de Automatización</span>
            </button>
          </div>

          {/* Core Guarantees Banner */}
          <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-800/80">
            <div className="p-3">
              <span className="block text-xl font-black text-indigo-400 font-mono">100%</span>
              <span className="text-xs text-slate-400">Cero Papel Operativo</span>
            </div>
            <div className="p-3">
              <span className="block text-xl font-black text-emerald-400 font-mono">Ed25519</span>
              <span className="text-xs text-slate-400">Firmas Antifraude</span>
            </div>
            <div className="p-3">
              <span className="block text-xl font-black text-cyan-400 font-mono">Multi-Tenant</span>
              <span className="text-xs text-slate-400">Aislamiento RLS Estricto</span>
            </div>
            <div className="p-3">
              <span className="block text-xl font-black text-purple-400 font-mono">IA & MCP</span>
              <span className="text-xs text-slate-400">Agentes y Visión OCR</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. B2B Products Catalog Section (Licensing / Sales) */}
      <section id="productos" className="border-t border-slate-800/80 bg-slate-900/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Catálogo Comercial B2B
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Software Listo para Implementar y Licenciar
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Plataformas completas con código auditado, arquitectura escalable y listas para desplegarse como SaaS o licencia on-premise en tu infraestructura.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {B2B_PRODUCTS.map((product) => (
              <div
                key={product.id}
                className="rounded-3xl border border-slate-800 bg-slate-950 p-7 flex flex-col justify-between space-y-6 hover:border-indigo-500/50 hover:bg-slate-900/90 transition shadow-xl group"
              >
                <div className="space-y-4">
                  {/* Header Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-2xl group-hover:scale-110 transition-transform">
                        {product.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition">
                          {product.name}
                        </h3>
                        <span className="text-[11px] text-slate-400 block font-medium">
                          {product.tagline}
                        </span>
                      </div>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-mono font-bold shrink-0 ${product.badgeColor}`}>
                      {product.category}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {product.description}
                  </p>

                  {/* Highlights Bullet points */}
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Capacidades Clave
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                      {product.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-indigo-400 font-bold shrink-0">✓</span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tech stack badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {product.stack.map((item, idx) => (
                      <span
                        key={idx}
                        className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-0.5 text-[10px] font-mono text-slate-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  {/* Price Model Tag */}
                  <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 pt-1">
                    <span className="text-emerald-400 font-bold">💳 Modalidad:</span>
                    <span>{product.priceModel}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {product.liveUrl && (
                      <Link
                        href={product.liveUrl}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition"
                      >
                        <span>👁️ Ver Demo</span>
                      </Link>
                    )}
                    {product.repoUrl && (
                      <a
                        href={product.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:border-slate-700 transition"
                      >
                        <span>Código & Doc</span>
                        <span>↗</span>
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => openLeadModal(product.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition active:scale-95"
                  >
                    <span>💼 Cotizar Licencia / Demo</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. AI Engineering & Custom Automation Services */}
      <section id="servicios-ia" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Servicios de Ingeniería Especializada
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Automatización con IA & Desarrollo a Medida
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Resolvemos problemas de escala, extracción de datos y flujos desatendidos conectando modelos de inteligencia artificial con sistemas legacy y bases de datos transaccionales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {AI_SERVICES.map((service) => (
              <div
                key={service.id}
                className="rounded-3xl border border-slate-800 bg-slate-900/60 p-7 flex flex-col justify-between space-y-6 hover:border-indigo-500/50 hover:bg-slate-900 transition group"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-2xl group-hover:scale-110 transition-transform">
                      {service.icon}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-300 transition">
                        {service.title}
                      </h3>
                      <span className="text-xs text-slate-400">Ingeniería & Despliegue</span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {service.shortDesc}
                  </p>

                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Entregables Técnicos
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-400">
                      {service.deliverables.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold shrink-0">⚡</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {service.techStack.map((tech, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80">
                  <button
                    onClick={() => openLeadModal(service.id)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-indigo-500/60 transition"
                  >
                    <span>💬 Consultar Factibilidad de este Servicio</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Problem vs Solution Section */}
      <section id="soluciones" className="border-t border-slate-800/80 bg-slate-900/30 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Transformación Digital Comprobada
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              De la Fricción Manual a la Automatización Fluida
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Eliminamos pérdidas de tiempo, errores humanos y riesgos de fraude en procesos comerciales y financieros.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Old Way */}
            <div className="rounded-3xl border border-rose-500/20 bg-gradient-to-b from-rose-950/20 to-slate-950 p-7 space-y-4">
              <div className="flex items-center gap-3 text-rose-400">
                <span className="text-2xl">⚠️</span>
                <h3 className="text-base font-bold">Operación Tradicional / Manual</h3>
              </div>
              <ul className="space-y-3 text-xs text-slate-400">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold shrink-0">✕</span>
                  <span>Registros físicos en papel propensos a extravíos, manchas y falta de respaldo.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold shrink-0">✕</span>
                  <span>Falta de trazabilidad: el cliente no sabe el estado de su orden ni el historial de mantenimientos.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold shrink-0">✕</span>
                  <span>Comprobantes bancarios recibidos por chat sin validación criptográfica ni detección de duplicados.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold shrink-0">✕</span>
                  <span>Descargas manuales y repetitivas de comprobantes tributarios que consumen decenas de horas al mes.</span>
                </li>
              </ul>
            </div>

            {/* The JanusCore Way */}
            <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-slate-950 p-7 space-y-4 shadow-lg shadow-emerald-950/20">
              <div className="flex items-center gap-3 text-emerald-400">
                <span className="text-2xl">✓</span>
                <h3 className="text-base font-bold">Con el Ecosistema JanusCore</h3>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span>Historial 100% digital en la nube, accesible escaneando códigos QR interactivos o comprobantes verificados.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span>Portales dedicados de autoservicio y trazabilidad en tiempo real para clientes corporativos.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span>Motor antifraude financiero con verificación de firmas Ed25519 y auditoría a cuatro ojos.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span>Pipelines y extensiones para ingesta desatendida de documentos fiscales y bases de datos.</span>
                </li>
              </ul>
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
                  Construido sobre Next.js Server Components, PostgreSQL con Row Level Security (RLS) estricto y estándares criptográficos que garantizan la integridad y confidencialidad de cada operación.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                  <strong className="block text-indigo-400 font-mono">Row Level Security</strong>
                  <span className="text-slate-400 mt-1 block">Aislamiento total por empresa cliente a nivel de motor de base de datos.</span>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                  <strong className="block text-emerald-400 font-mono">Firmas Ed25519</strong>
                  <span className="text-slate-400 mt-1 block">Validación asimétrica de autenticidad para comprobantes y transferencias.</span>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                  <strong className="block text-cyan-400 font-mono">Model Context Protocol</strong>
                  <span className="text-slate-400 mt-1 block">Conectores de contexto seguro para modelos LLM y agentes de IA.</span>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                  <strong className="block text-purple-400 font-mono">Alta Disponibilidad</strong>
                  <span className="text-slate-400 mt-1 block">Arquitectura resiliente con despliegue continuo y tiempos de carga instantáneos.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Lead Capture & Direct Conversion Banner */}
      <section className="border-t border-slate-800/80 bg-slate-900/60 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3.5 py-1.5 text-xs font-semibold text-indigo-300 shadow-inner">
            <span>🤝 Consultoría & Licenciamiento B2B</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            ¿Listo para Automatizar las Operaciones de tu Empresa?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Hablemos directamente sobre tu proceso actual. Te presentamos una demostración funcional o una cotización técnica personalizada en menos de 24 horas.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => openLeadModal('custom')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 hover:scale-105 transition active:scale-95"
            >
              <span>💼 Solicitar Cotización / Demo</span>
              <span>→</span>
            </button>
            <a
              href="https://api.whatsapp.com/send?phone=593984606775&text=Hola%20JanusCore!%20Me%20interesa%20conocer%20m%C3%A1s%20sobre%20sus%20soluciones%20de%20software%20y%20automatizaci%C3%B3n."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 px-6 py-4 text-sm font-semibold text-emerald-300 hover:bg-emerald-900/40 hover:text-white transition"
            >
              <span>📲 Chat Directo por WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      {/* 8. Corporate Footer (Strictly B2B / No personal CV) */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-sm">JanusCore Technologies</span>
                <span className="rounded-full border border-slate-800 bg-slate-900 px-2 py-0.5 text-[9px] font-mono text-slate-400">
                  {APP_VERSION}
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-md">
                Plataforma de Ingeniería de Inteligencia Artificial, Automatización de Procesos y Software B2B de Misión Crítica.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400">
              <a href="#productos" className="hover:text-white transition">Productos B2B</a>
              <a href="#servicios-ia" className="hover:text-white transition">Servicios IA</a>
              <a href="#soluciones" className="hover:text-white transition">Soluciones</a>
              <Link href="/signin" className="hover:text-white transition">Acceso Clientes</Link>
              <button
                onClick={() => openLeadModal('custom')}
                className="text-indigo-400 hover:underline"
              >
                Contacto Comercial
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-600">
            <span>© {new Date().getFullYear()} JanusCore Technologies. Todos los derechos reservados.</span>
            <div className="flex items-center gap-4">
              <span>Next.js 16 • Supabase RLS • Ed25519</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

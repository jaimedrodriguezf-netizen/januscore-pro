import React from 'react';
import Image from 'next/image';
import { FEATURED_CASE_STUDIES, TRUSTED_INDUSTRIES } from '@/lib/catalog/clients';

export function CaseStudiesSection() {
  return (
    <section id="casos-de-exito" className="border-t border-slate-800/80 bg-slate-950 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 shadow-inner">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Casos de Éxito & Software en Producción Real</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Tecnología Probada a Escala Empresarial
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            No vendemos maquetas ni prototipos teóricos. Nuestras plataformas automatizan operaciones críticas de inventario, facturación, salud y logística en empresas que facturan millones.
          </p>
        </div>

        {/* Featured Case Study: GM Bruño */}
        {FEATURED_CASE_STUDIES.map((study) => (
          <div
            key={study.id}
            className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 sm:p-10 shadow-2xl relative overflow-hidden"
          >
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-indigo-600/10 blur-[90px] pointer-events-none" />

            <div className="space-y-8">
              {/* Top Bar with Client Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
                <div className="flex items-center gap-4">
                  {study.logoUrl && (
                    <div className="h-16 w-16 rounded-2xl bg-white p-2.5 flex items-center justify-center shrink-0 shadow-md">
                      <img
                        src={study.logoUrl}
                        alt={study.clientName}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-xl sm:text-2xl font-black text-white">
                        {study.clientName}
                      </h3>
                      <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        En Producción 24/7
                      </span>
                    </div>
                    <span className="text-xs text-indigo-400 font-medium block mt-0.5">
                      {study.scale} • {study.industry}
                    </span>
                  </div>
                </div>

                {study.liveUrl && (
                  <a
                    href={study.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:border-emerald-500 hover:bg-slate-850 transition"
                  >
                    <span>🌐 Visitar app.gmbruno.com</span>
                    <span>↗</span>
                  </a>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {study.metrics.map((metric, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 text-center sm:text-left space-y-1"
                  >
                    <span className="block text-2xl sm:text-3xl font-black text-white font-mono">
                      {metric.value}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {metric.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Challenge vs Solution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="rounded-2xl border border-rose-500/20 bg-rose-950/10 p-5 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <span>⚠️</span> El Cuello de Botella Operativo
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {study.challenge}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-5 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <span>⚡</span> La Solución de Ingeniería Desarrollada
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {study.solution}
                  </p>
                </div>
              </div>

              {/* Modules & Stack */}
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Módulos de Negocio Implementados en AppGm
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {study.keyModules.map((mod, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs text-slate-200 flex items-center gap-2"
                    >
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>{mod}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Multi-Sector Trust Bar */}
        <div className="space-y-6 pt-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ecosistema Multisectorial Desplegado
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TRUSTED_INDUSTRIES.map((industry, idx) => (
              <a
                key={idx}
                href={industry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 space-y-3 hover:border-indigo-500/50 hover:bg-slate-900 transition block group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{industry.icon}</span>
                  <span className="rounded-full border border-slate-800 bg-slate-950 px-2.5 py-0.5 text-[10px] font-mono text-slate-300">
                    {industry.badge}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
                    {industry.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {industry.desc}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

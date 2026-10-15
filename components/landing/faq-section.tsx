'use client';

import React, { useState } from 'react';

export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: '¿Qué soluciones de software y servicios ofrece JanusCore Technologies?',
    answer:
      'JanusCore Technologies es un estudio de ingeniería de software especializado en el desarrollo y licenciamiento de plataformas B2B listas para producción (JanusCore Verify, DentiApp Online, Kattxo SRI, Tenddy Shop) y servicios de automatización con Inteligencia Artificial aplicada (visión artificial OCR, agentes autónomos con Model Context Protocol - MCP e integraciones ERP).',
  },
  {
    question: '¿Cómo funciona la verificación criptográfica Ed25519 para comprobantes bancarios?',
    answer:
      'Implementamos un motor de validación matemática asimétrica mediante curvas elípticas Ed25519 (@noble/ed25519). Al recibir un comprobante o transferencia, el sistema decodifica el código QR, extrae montos y referencias por OCR, verifica la firma digital del banco emisor y detecta de inmediato comprobantes duplicados o adulterados, eliminando el riesgo de fraude en tesorería.',
  },
  {
    question: '¿Qué ventajas normativas ofrece DentiApp Online para clínicas odontológicas?',
    answer:
      'DentiApp Online es un SaaS clínico multi-tenant diseñado con estricto apego al Formulario Oficial 033 del Ministerio de Salud Pública del Ecuador (MSP). Incluye odontograma interactivo en tiempo real, periodontograma digital y exportación de historias clínicas completas listas para auditorías de salud pública y aseguradoras.',
  },
  {
    question: '¿Cómo reduce Kattxo SRI Extension el tiempo operativo contable?',
    answer:
      'Kattxo es una extensión en TypeScript (Chrome Manifest V3) que automatiza la descarga y el parseo masivo de comprobantes tributarios electrónicos (facturas, retenciones) desde el portal oficial del SRI. Integra una cola de peticiones con throttling inteligente anti-baneo que evita caídas de sesión y reduce hasta un 90% el tiempo de procesamiento mensual.',
  },
  {
    question: '¿Cómo funciona el proceso de Demo / Prueba de Concepto (PoC) gratuita para empresas?',
    answer:
      'Evaluamos el cuello de botella operativo de tu negocio en una sesión técnica de 20 minutos. Con una muestra real de tus datos (comprobantes, catálogos o flujos repetitivos), construimos un prototipo funcional en menos de 48 horas sin costo para demostrar la viabilidad técnica antes de acordar la implementación comercial completa.',
  },
  {
    question: '¿Cómo garantizan la seguridad y el aislamiento de datos entre empresas?',
    answer:
      'La arquitectura opera sobre PostgreSQL con políticas estrictas de Row Level Security (RLS) en Supabase. Cada empresa o inquilino comercial tiene sus datos aislados a nivel de motor de base de datos, con control de acceso basado en roles (RBAC) y esquemas de revisión a cuatro ojos para transacciones críticas.',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="border-t border-slate-800/80 bg-slate-900/30 py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Preguntas Frecuentes & Arquitectura
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Resolución de Dudas Técnicas & Comerciales
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Todo lo que necesitas saber sobre licenciamiento, tiempos de despliegue y estándares de seguridad.
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-white hover:text-indigo-300 transition"
                >
                  <span className="pr-4">{item.question}</span>
                  <span className="text-indigo-400 text-lg font-mono shrink-0">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/50">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

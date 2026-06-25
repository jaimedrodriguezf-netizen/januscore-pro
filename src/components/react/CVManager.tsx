import { useState, useEffect } from "react";
import QRGenerator from "./QRGenerator";
import type { CVProfileType } from "../../data/cvProfiles";

const profiles = [
  { id: "ai-engineer", label: "AI Engineer / Applied AI" },
  { id: "fullstack", label: "Fullstack Developer" },
  { id: "ti-soporte", label: "Ingeniero de Soporte TI" },
  { id: "data-automation", label: "Data & Automation Engineer" },
  { id: "kam", label: "Consultor Técnico / KAM" },
  { id: "integral", label: "Ingeniero Integral (Tech & Ops)" }
];

export default function CVManager() {
  const [selectedRole, setSelectedRole] = useState<CVProfileType>("ai-engineer");
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    // Solo en el cliente obtenemos el origin real
    setBaseUrl(window.location.origin);
  }, []);

  const token = "januscore2026"; // Esto podría inyectarse desde env
  const qrUrl = baseUrl ? `${baseUrl}/cv/${selectedRole}?token=${token}` : "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
      <div className="bg-surface/50 border border-white/5 rounded-3xl p-8 shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-text">Generador de QR</h2>
        
        <div className="mb-8">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Selecciona el Perfil Profesional
          </label>
          <div className="relative">
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as CVProfileType)}
              className="w-full appearance-none bg-bg border border-white/10 rounded-xl px-4 py-3 text-text font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">¿Qué es esto?</h3>
          <p className="text-text-secondary leading-relaxed text-sm">
            Al escanear este código QR, los reclutadores podrán ver una versión de tu CV optimizada exactamente para el rol de <strong>{profiles.find(p => p.id === selectedRole)?.label}</strong>.
          </p>
          <p className="text-text-secondary leading-relaxed text-sm">
            El código incluye una contraseña segura embebida en la URL. Si alguien intenta entrar a tu CV adivinando el link sin el código, el sistema le bloqueará el acceso.
          </p>
          <div className="mt-4">
            <a 
              href={qrUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm transition-colors"
            >
              Previsualizar este CV <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          </div>
        </div>
      </div>

      <div className="bg-surface/30 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center">
        {qrUrl ? (
          <QRGenerator url={qrUrl} />
        ) : (
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-64 h-64 bg-bg rounded-3xl"></div>
            <div className="w-48 h-10 bg-bg rounded-xl"></div>
          </div>
        )}
      </div>
    </div>
  );
}

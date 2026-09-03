export type DamageType = 'A' | 'B' | 'C' | 'O';

export interface DamageMarker {
  id: string;
  x?: number; // relative percentage 0-100 on diagram
  y?: number; // relative percentage 0-100 on diagram
  zone: string;
  damageType: DamageType;
  label?: string;
}

export const DAMAGE_TYPES: Record<DamageType, { code: DamageType; name: string; color: string; badge: string }> = {
  A: { code: 'A', name: 'Abolladura', color: '#ef4444', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  B: { code: 'B', name: 'Golpe', color: '#f59e0b', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  C: { code: 'C', name: 'Rayadura', color: '#3b82f6', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  O: { code: 'O', name: 'Otro Detalle', color: '#10b981', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
};

export const CAR_BODY_ZONES = [
  { id: 'frente_parachoques', name: 'Parachoques Delantero', view: 'frente' },
  { id: 'capo', name: 'Capó', view: 'frente' },
  { id: 'parabrisas_delantero', name: 'Parabrisas Delantero', view: 'frente' },
  { id: 'lat_izq_delantero', name: 'Tapabarro Delantero Izquierdo', view: 'izq' },
  { id: 'lat_izq_puerta_del', name: 'Puerta Delantera Izquierda', view: 'izq' },
  { id: 'lat_izq_puerta_post', name: 'Puerta Trasera Izquierda', view: 'izq' },
  { id: 'lat_izq_posterior', name: 'Tapabarro Trasero Izquierdo', view: 'izq' },
  { id: 'lat_der_delantero', name: 'Tapabarro Delantero Derecho', view: 'der' },
  { id: 'lat_der_puerta_del', name: 'Puerta Delantera Derecha', view: 'der' },
  { id: 'lat_der_puerta_post', name: 'Puerta Trasera Derecha', view: 'der' },
  { id: 'lat_der_posterior', name: 'Tapabarro Trasero Derecho', view: 'der' },
  { id: 'techo', name: 'Techo', view: 'superior' },
  { id: 'maletero', name: 'Compuerta / Maletero', view: 'posterior' },
  { id: 'parachoques_post', name: 'Parachoques Posterior', view: 'posterior' },
];

/**
 * Format damage markers into a clear, structured summary for the work order.
 */
export function formatDamageMarkersSummary(markers: DamageMarker[]): string {
  if (!markers || markers.length === 0) {
    return 'Sin novedades de carrocería (Vehículo en buen estado exterior).';
  }

  return markers
    .map((m) => {
      const typeInfo = DAMAGE_TYPES[m.damageType] || DAMAGE_TYPES.A;
      const detail = m.label ? `: ${m.label}` : '';
      return `[${typeInfo.code}. ${typeInfo.name}] ${m.zone}${detail}`;
    })
    .join('\n');
}

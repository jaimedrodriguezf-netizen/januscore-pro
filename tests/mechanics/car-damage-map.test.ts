import { describe, it, expect } from 'vitest';
import {
  formatDamageMarkersSummary,
  type DamageMarker,
} from '@/lib/mechanics/damage-map';

describe('Vehicle Body Damage Map (SDD/TDD)', () => {
  it('formats damage markers into structured inspection report', () => {
    const markers: DamageMarker[] = [
      { id: '1', zone: 'Puerta Delantera Derecha', damageType: 'C', label: 'Rayadura superficial' },
      { id: '2', zone: 'Parachoques Posterior', damageType: 'B', label: 'Golpe de parqueo' },
      { id: '3', zone: 'Capó', damageType: 'A', label: 'Abolladura leve' },
    ];

    const summary = formatDamageMarkersSummary(markers);
    expect(summary).toContain('[A. Abolladura] Capó: Abolladura leve');
    expect(summary).toContain('[B. Golpe] Parachoques Posterior: Golpe de parqueo');
    expect(summary).toContain('[C. Rayadura] Puerta Delantera Derecha: Rayadura superficial');
  });

  it('handles empty damage markers cleanly', () => {
    const summary = formatDamageMarkersSummary([]);
    expect(summary).toBe('Sin novedades de carrocería (Vehículo en buen estado exterior).');
  });
});

import { describe, expect, it } from 'vitest';
import {
  transformOemPlanToWorkOrderItems,
  determineIntakeStep,
  formatHandoverWhatsAppMessage,
  type IntakeFlowState,
} from '@/lib/mechanics/intake-flow';
import type { NextServicePlan } from '@/lib/mechanics/service';

describe('Workshop Intake Flow Domain & Transformers (TDD)', () => {
  describe('transformOemPlanToWorkOrderItems', () => {
    it('converts OEM recommendations into structured WorkOrderItems', () => {
      const mockPlan: NextServicePlan = {
        title: 'Mantenimiento Preventivo (50,000 km)',
        milestoneKm: 50000,
        remainingKm: 2000,
        isOverdue: false,
        typeBadge: 'Preventivo Regular',
        items: [
          'Cambio de aceite de motor sintético',
          'Reemplazo de filtro de aceite de motor genuino',
          'Rotación de neumáticos',
        ],
        fluidSpecs: [
          'Aceite: Sintético 5W-30 (dexos1 Gen3)',
          'Fluidos: Revisión de nivel de refrigerante',
        ],
        recommendation: 'Servicio regular cada 5.000 km.',
      };

      const result = transformOemPlanToWorkOrderItems(mockPlan);

      expect(result.length).toBe(4);
      expect(result[0].name).toBe('Cambio de aceite de motor sintético');
      expect(result[0].spec).toBe('Aceite: Sintético 5W-30 (dexos1 Gen3)');
      expect(result[1].name).toBe('Reemplazo de filtro de aceite de motor genuino');
      expect(result[2].name).toBe('Rotación de neumáticos');
      expect(result[3].name).toBe('Fluidos: Revisión de nivel de refrigerante');
      expect(result.every((item) => typeof item.cost === 'number')).toBe(true);
    });

    it('handles empty plan recommendations without throwing', () => {
      const emptyPlan: NextServicePlan = {
        title: 'General',
        milestoneKm: 10000,
        remainingKm: 5000,
        isOverdue: false,
        typeBadge: 'General',
        items: [],
        fluidSpecs: [],
        recommendation: '',
      };

      const result = transformOemPlanToWorkOrderItems(emptyPlan);
      expect(result).toEqual([]);
    });
  });

  describe('determineIntakeStep', () => {
    it('returns search when no vehicle is selected', () => {
      const state: IntakeFlowState = {
        selectedVehicle: null,
        currentStep: 'search',
        completedOrderId: null,
      };
      expect(determineIntakeStep(state)).toBe('search');
    });

    it('returns diagnosis when vehicle is selected but order not started', () => {
      const state: IntakeFlowState = {
        selectedVehicle: { id: 'v1', plate: 'PBX-1234' } as any,
        currentStep: 'diagnosis',
        completedOrderId: null,
      };
      expect(determineIntakeStep(state)).toBe('diagnosis');
    });

    it('returns handover when work order is completed', () => {
      const state: IntakeFlowState = {
        selectedVehicle: { id: 'v1', plate: 'PBX-1234' } as any,
        currentStep: 'handover',
        completedOrderId: 'order-999',
      };
      expect(determineIntakeStep(state)).toBe('handover');
    });
  });

  describe('formatHandoverWhatsAppMessage', () => {
    it('formats a warm WhatsApp notification with vehicle plate and public tracking link', () => {
      const msg = formatHandoverWhatsAppMessage({
        clientName: 'Jaime Rodríguez',
        plate: 'PBX-1234',
        workshopName: 'Taller Pilozo',
        orderNumber: '01128',
      });

      expect(msg).toContain('Jaime Rodríguez');
      expect(msg).toContain('PBX-1234');
      expect(msg).toContain('Taller Pilozo');
      expect(msg).toContain('https://januscore.pro/auto/PBX-1234');
      expect(msg).toContain('01128');
    });

    it('handles missing orderNumber gracefully', () => {
      const msg = formatHandoverWhatsAppMessage({
        clientName: 'Carlos Vera',
        plate: 'GS-100',
        workshopName: 'AutoTech',
      });

      expect(msg).toContain('Carlos Vera');
      expect(msg).toContain('GS-100');
      expect(msg).toContain('https://januscore.pro/auto/GS-100');
    });
  });
});

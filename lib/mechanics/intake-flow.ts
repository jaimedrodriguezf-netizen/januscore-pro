import type { Vehicle } from './types';
import type { WorkOrderItem } from './work-order';
import type { NextServicePlan } from './service';

export type IntakeStep = 'search' | 'diagnosis' | 'order' | 'handover';

export interface IntakeFlowState {
  selectedVehicle: Vehicle | null;
  currentStep: IntakeStep;
  completedOrderId?: string | null;
  orderMode?: 'express' | 'full';
}

export interface HandoverMessageParams {
  clientName: string;
  plate: string;
  workshopName: string;
  orderNumber?: string;
  customNotes?: string;
}

/**
 * Transforms an OEM factory service plan into prefilled WorkOrderItems.
 * Associates fluid specifications to relevant service operations, or appends them.
 */
export function transformOemPlanToWorkOrderItems(plan: NextServicePlan): WorkOrderItem[] {
  if (!plan) return [];

  const rawItems = plan.items || [];
  const rawSpecs = plan.fluidSpecs || [];

  const workOrderItems: WorkOrderItem[] = rawItems.map((item) => ({
    name: item,
    cost: 0,
    quantity: 1,
  }));

  for (const spec of rawSpecs) {
    const specLower = spec.toLowerCase();
    const subject = spec.includes(':') ? spec.split(':')[0].toLowerCase().trim() : '';

    let matchedItem: WorkOrderItem | undefined;

    if (subject.includes('aceite') || specLower.includes('aceite')) {
      matchedItem = workOrderItems.find(
        (i) => !i.spec && i.name.toLowerCase().includes('aceite')
      );
    } else if (subject.includes('freno') || specLower.includes('freno')) {
      matchedItem = workOrderItems.find(
        (i) => !i.spec && i.name.toLowerCase().includes('freno')
      );
    } else if (subject.includes('refrigerante') || specLower.includes('refrigerante')) {
      matchedItem = workOrderItems.find(
        (i) => !i.spec && i.name.toLowerCase().includes('refrigerante')
      );
    }

    if (matchedItem) {
      matchedItem.spec = spec;
    } else {
      workOrderItems.push({
        name: spec,
        cost: 0,
        quantity: 1,
      });
    }
  }

  return workOrderItems;
}

/**
 * Evaluates current intake flow state to determine the active step.
 */
export function determineIntakeStep(state: IntakeFlowState): IntakeStep {
  if (state.completedOrderId) {
    return 'handover';
  }
  if (!state.selectedVehicle) {
    return 'search';
  }
  return state.currentStep || 'diagnosis';
}

/**
 * Formats a clear, personalized WhatsApp message with vehicle digital tracking link.
 */
export function formatHandoverWhatsAppMessage(params: HandoverMessageParams): string {
  const { clientName, plate, workshopName, orderNumber, customNotes } = params;
  const trackingUrl = `https://januscore.pro/auto/${encodeURIComponent(plate.toUpperCase())}`;

  const lines = [
    `Hola ${clientName.trim()}! 👋 Te saludamos de *${workshopName.trim()}*.`,
    orderNumber
      ? `Tu orden de trabajo *#${orderNumber.trim()}* para el vehículo con placa *${plate.toUpperCase()}* ha sido registrada exitosamente.`
      : `Tu orden de trabajo para el vehículo con placa *${plate.toUpperCase()}* ha sido registrada exitosamente.`,
    '',
    `📱 Puedes seguir el avance del servicio y consultar tu historial digital en tiempo real aquí:`,
    trackingUrl,
  ];

  if (customNotes && customNotes.trim().length > 0) {
    lines.push('', customNotes.trim());
  }

  lines.push('', '¡Gracias por confiar en nosotros!');

  return lines.join('\n');
}

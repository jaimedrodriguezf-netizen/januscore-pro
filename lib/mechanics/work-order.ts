export interface WorkOrderItem {
  id?: string;
  name: string;
  spec?: string;
  quantity?: number;
  cost: number;
}

export interface WorkOrderInventory {
  matricula?: boolean;
  radio?: boolean;
  moquetas?: boolean;
  llantaEmergencia?: boolean;
  gata?: boolean;
  palanca?: boolean;
  llaveRueda?: boolean;
  herramientas?: boolean;
  triangulo?: boolean;
  botiquin?: boolean;
  extintor?: boolean;
  tapaGasolina?: boolean;
  otros?: string;
  bodyDamageNotes?: string;
}

export interface WorkOrderPayload {
  orderNumber: string;
  technicianName: string;
  serviceDate: string;
  mileage: number;
  fuelLevel?: 'E' | '1/4' | '1/2' | '3/4' | 'F';
  paymentMethod?: string;
  selectedOperations: string[];
  items: WorkOrderItem[];
  recommendations?: string;
  nextServiceMileage?: number;
  nextServiceDate?: string;
}

export const WORKSHOP_OPERATIONS_CATALOG = {
  motor: [
    'Cambio de aceite de motor',
    'Afinamiento de motor',
    'ABC de motor',
    'Calibración de válvulas',
    'Limpieza de inyectores por ultrasonido',
    'Revisión de niveles / fluidos',
    'Cambio de filtro de aire',
    'Cambio de filtro de cabina (A/C)',
    'Cambio de filtro de combustible',
  ],
  frenos: [
    'ABC de frenos completo',
    'Regulación de frenos (Del / Post)',
    'Cambio de pastillas de freno (Del / Post)',
    'Purga y cambio de líquido de frenos',
  ],
  cajaTransmision: [
    'Cambio de aceite de transmisión / caja',
    'Revisión de niveles de aceite de caja',
    'Reparación de transmisión / embrague',
    'Cambio de retenedores',
  ],
  suspensionDireccion: [
    'Revisión y reajuste de suspensión',
    'Revisión / Cambio de amortiguadores',
    'Revisión de rótulas de suspensión',
    'Cambio de mesas de suspensión',
    'Regulación de dirección',
    'Revisión / Cambio de terminales de dirección',
    'Revisión / Cambio de brazos de dirección',
  ],
  ruedas: [
    'Calibración de presión neumática',
    'Rotación de 4 ruedas',
    'Alineación computarizada',
    'Balanceo computarizado',
  ],
  sistemaElectrico: [
    'Diagnóstico computarizado (Scanner OBD2)',
    'Revisión / Cambio de bujías de encendido',
    'Revisión de luces y faros',
    'Revisión de luces del tablero',
    'Revisión / Reparación de alternador',
    'Revisión / Reparación de motor de arranque',
    'Cambio de propulsores / supresores de bobinas',
  ],
};

export const RECEPTION_INVENTORY_ITEMS = [
  { id: 'matricula', label: 'Matrícula' },
  { id: 'radio', label: 'Radio' },
  { id: 'moquetas', label: 'Moquetas' },
  { id: 'llantaEmergencia', label: 'Llanta de Emergencia' },
  { id: 'gata', label: 'Gata' },
  { id: 'palanca', label: 'Palanca' },
  { id: 'llaveRueda', label: 'Llave de Rueda' },
  { id: 'herramientas', label: 'Herramientas' },
  { id: 'triangulo', label: 'Triángulo de Seguridad' },
  { id: 'botiquin', label: 'Botiquín' },
  { id: 'extintor', label: 'Extintor' },
  { id: 'tapaGasolina', label: 'Tapa de Gasolina' },
];

/**
 * Calculate subtotal, taxes, and total for work order items.
 */
export function calculateWorkOrderTotals(items: WorkOrderItem[]): {
  subtotal: number;
  total: number;
} {
  const subtotal = items.reduce((acc, item) => {
    const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
    const itemCost = (item.cost || 0) * qty;
    return acc + itemCost;
  }, 0);

  const rounded = Math.round(subtotal * 100) / 100;

  return {
    subtotal: rounded,
    total: rounded,
  };
}

/**
 * Format structured maintenance description from work order details.
 */
export function formatWorkOrderDescription(payload: Partial<WorkOrderPayload>): string {
  const parts: string[] = [];

  if (payload.orderNumber) {
    parts.push(`Orden N: ${payload.orderNumber}`);
  }

  if (payload.technicianName) {
    parts.push(`Asesor/Técnico: ${payload.technicianName}`);
  }

  if (payload.selectedOperations && payload.selectedOperations.length > 0) {
    parts.push(`Operaciones: ${payload.selectedOperations.join(', ')}`);
  }

  if (payload.items && payload.items.length > 0) {
    const itemDetails = payload.items.map((it) => {
      const specText = it.spec ? ` (${it.spec})` : '';
      const costText = it.cost ? ` - $${it.cost.toFixed(2)}` : '';
      return `${it.name}${specText}${costText}`;
    });
    parts.push(`Detalle: ${itemDetails.join(' | ')}`);
  }

  if (payload.recommendations) {
    parts.push(`Recomendaciones: ${payload.recommendations}`);
  }

  return parts.join('\n\n');
}

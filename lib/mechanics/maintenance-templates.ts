export type FuelType = 'gasoline' | 'diesel' | 'hybrid' | 'electric';

export interface MaintenanceIntervalStep {
  mileageKm: number;
  months?: number;
  title: string;
  operations: string[];
  mandatoryParts: string[];
  fluidAction?: 'replace' | 'inspect' | 'top_up';
  estimatedCostUsd?: number;
}

export interface EngineOilSpec {
  viscosity: string;
  spec: string;
  capacityLiters: number;
}

export interface SparkPlugSpec {
  type: string;
  spec: string;
  intervalKm: number;
}

export interface MaintenanceTemplate {
  id: string;
  brand: string;
  model: string;
  generationYears: string;
  engineDisplacement: string;
  fuelType: FuelType;
  imageUrl?: string;
  engineOil: EngineOilSpec;
  sparkPlugs?: SparkPlugSpec;
  brakeFluid: string;
  coolant: string;
  transmissionFluid?: string;
  intervals: MaintenanceIntervalStep[];
  isCustom?: boolean;
  notes?: string;
}

/**
 * Generate standard 10,000 km to 100,000 km maintenance intervals for a vehicle.
 */
export function generateStandardIntervals(
  oilViscosity: string,
  sparkPlugSpec: string = 'Iridio / Platino'
): MaintenanceIntervalStep[] {
  const steps: MaintenanceIntervalStep[] = [
    {
      mileageKm: 5000,
      months: 3,
      title: 'Servicio Preventivo 5.000 km',
      operations: [
        `Cambio de aceite de motor (${oilViscosity})`,
        'Cambio de filtro de aceite',
        'Revisión de niveles de fluidos',
        'Calibración de presión de neumáticos',
      ],
      mandatoryParts: ['Aceite sintético', 'Filtro de aceite'],
      fluidAction: 'replace',
      estimatedCostUsd: 45,
    },
    {
      mileageKm: 10000,
      months: 6,
      title: 'Mantenimiento Periódico 10.000 km',
      operations: [
        `Cambio de aceite (${oilViscosity}) y filtro`,
        'Cambio de filtro de aire de motor',
        'Cambio de filtro de cabina (A/C)',
        'Rotación de neumáticos y balanceo',
        'Revisión y regulación de frenos',
      ],
      mandatoryParts: ['Aceite', 'Filtro aceite', 'Filtro aire', 'Filtro cabina'],
      fluidAction: 'replace',
      estimatedCostUsd: 75,
    },
    {
      mileageKm: 20000,
      months: 12,
      title: 'Mantenimiento Intermedio 20.000 km',
      operations: [
        `Cambio de aceite (${oilViscosity}) y filtro`,
        'Cambio de filtro de aire y cabina',
        'Cambio de filtro de combustible',
        'ABC de frenos (limpieza y regulación)',
        'Diagnóstico computarizado (Scanner OBD2)',
        'Alineación y balanceo computarizado',
      ],
      mandatoryParts: ['Aceite', 'Filtro aceite', 'Filtro aire', 'Filtro cabina', 'Filtro combustible'],
      fluidAction: 'replace',
      estimatedCostUsd: 110,
    },
    {
      mileageKm: 30000,
      months: 18,
      title: 'Mantenimiento Periódico 30.000 km',
      operations: [
        `Cambio de aceite (${oilViscosity}) y filtro`,
        'Cambio de filtro de aire y cabina',
        'Revisión y calibración de bujías',
        'Revisión de suspensión y terminales',
        'Inspección de batería y sistema de carga',
      ],
      mandatoryParts: ['Aceite', 'Filtro aceite', 'Filtro aire', 'Filtro cabina'],
      fluidAction: 'replace',
      estimatedCostUsd: 85,
    },
    {
      mileageKm: 40000,
      months: 24,
      title: 'Mantenimiento Mayor 40.000 km',
      operations: [
        `Cambio de aceite (${oilViscosity}) y filtro`,
        'Cambio de filtro de aire, cabina y combustible',
        `Cambio de bujías de encendido (${sparkPlugSpec})`,
        'Purga y cambio de líquido de frenos (DOT 4)',
        'Limpieza de inyectores por ultrasonido',
        'ABC de frenos completo con revisión de pastillas',
        'Alineación y balanceo de 4 ruedas',
      ],
      mandatoryParts: ['Aceite', 'Filtros (3)', `Bujías (${sparkPlugSpec})`, 'Líquido de frenos DOT 4'],
      fluidAction: 'replace',
      estimatedCostUsd: 165,
    },
    {
      mileageKm: 50000,
      months: 30,
      title: 'Mantenimiento Periódico 50.000 km',
      operations: [
        `Cambio de aceite (${oilViscosity}) y filtro`,
        'Cambio de filtro de aire y cabina',
        'Revisión de correas y tensores',
        'Rotación e inspección de desgaste de llantas',
        'Chequeo de amortiguadores y rótulas',
      ],
      mandatoryParts: ['Aceite', 'Filtro aceite', 'Filtro aire', 'Filtro cabina'],
      fluidAction: 'replace',
      estimatedCostUsd: 80,
    },
    {
      mileageKm: 60000,
      months: 36,
      title: 'Mantenimiento Integral 60.000 km (Gran Servicio)',
      operations: [
        `Cambio de aceite (${oilViscosity}) y filtro`,
        'Cambio de filtros (aire, cabina, combustible)',
        `Cambio de bujías (${sparkPlugSpec})`,
        'Reemplazo de supresores/propulsores de bobina',
        'Cambio de líquido refrigerante (OAT Long Life)',
        'Cambio de aceite de caja de cambios / transmisión',
        'ABC de frenos y revisión de discos',
        'Diagnóstico computarizado completo',
      ],
      mandatoryParts: [
        'Aceite',
        'Filtros (3)',
        `Bujías (${sparkPlugSpec})`,
        'Supresores de bobina',
        'Refrigerante',
        'Aceite de transmisión',
      ],
      fluidAction: 'replace',
      estimatedCostUsd: 195,
    },
    {
      mileageKm: 70000,
      months: 42,
      title: 'Mantenimiento Preventivo 70.000 km',
      operations: [
        `Cambio de aceite (${oilViscosity}) y filtro`,
        'Cambio de filtro de aire y cabina',
        'Reajuste y torque de suspensión delantera/trasera',
        'Revisión de pastillas y tambores de freno',
      ],
      mandatoryParts: ['Aceite', 'Filtro aceite', 'Filtro aire', 'Filtro cabina'],
      fluidAction: 'replace',
      estimatedCostUsd: 85,
    },
    {
      mileageKm: 80000,
      months: 48,
      title: 'Mantenimiento Mayor 80.000 km (Distribución / Correas)',
      operations: [
        `Cambio de aceite (${oilViscosity}) y filtro`,
        'Cambio de kit de distribución (banda/cadena y tensores)',
        'Cambio de banda de accesorios (alternador/bomba)',
        'Cambio de bomba de agua y refrigerante',
        'Cambio de bujías, filtros y líquido de frenos',
        'Limpieza de cuerpo de aceleración e inyectores',
      ],
      mandatoryParts: [
        'Aceite',
        'Filtros (3)',
        'Kit de distribución',
        'Banda de accesorios',
        'Bujías',
        'Líquido de frenos',
      ],
      fluidAction: 'replace',
      estimatedCostUsd: 280,
    },
    {
      mileageKm: 100000,
      months: 60,
      title: 'Mantenimiento Centenario 100.000 km',
      operations: [
        `Cambio de aceite (${oilViscosity}) y filtro`,
        'Cambio total de fluidos (frenos, caja, refrigerante, dirección)',
        'Cambio completo de filtros y bujías',
        'Inspección de catalizador y sensores de oxígeno',
        'Revisión y prueba de compresión de motor',
        'Diagnóstico computarizado profundo',
      ],
      mandatoryParts: ['Aceite', 'Filtros (3)', 'Bujías', 'Fluidos completos'],
      fluidAction: 'replace',
      estimatedCostUsd: 220,
    },
  ];

  return steps;
}

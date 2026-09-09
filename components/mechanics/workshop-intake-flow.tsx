'use client';

import { useState } from 'react';
import type { Vehicle } from '@/lib/mechanics/types';
import type { WorkOrderItem } from '@/lib/mechanics/work-order';
import type { IntakeStep } from '@/lib/mechanics/intake-flow';
import { IntakeHeroSearch } from './intake-hero-search';
import { OemDiagnosisCard } from './oem-diagnosis-card';
import { UnifiedWorkOrderForm } from './unified-work-order-form';

interface WorkshopIntakeFlowProps {
  vehicles: Vehicle[];
  activeTenantId: string;
  createVehicleAction: (formData: FormData) => Promise<void>;
  saveWorkOrderAction: (formData: FormData) => Promise<void>;
}

export function WorkshopIntakeFlow({
  vehicles,
  activeTenantId,
  createVehicleAction,
  saveWorkOrderAction,
}: WorkshopIntakeFlowProps) {
  const [step, setStep] = useState<IntakeStep>('search');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [prefilledItems, setPrefilledItems] = useState<WorkOrderItem[]>([]);
  const [prefilledRecommendations, setPrefilledRecommendations] = useState<string>('');

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setStep('diagnosis');
  };

  const handleApplyPlanToOrder = (items: WorkOrderItem[], notes?: string) => {
    setPrefilledItems(items);
    if (notes) setPrefilledRecommendations(notes);
    setStep('order');
  };

  const handleProceedToOrder = () => {
    setStep('order');
  };

  const handleResetVehicle = () => {
    setSelectedVehicle(null);
    setPrefilledItems([]);
    setPrefilledRecommendations('');
    setStep('search');
  };

  return (
    <div className="space-y-6">
      {/* Visual Stepper Indicator */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
        <button
          type="button"
          onClick={() => step !== 'search' && setStep('search')}
          className={`rounded-xl border p-2.5 sm:p-3 transition ${
            step === 'search'
              ? 'border-indigo-500/60 bg-indigo-950/40 text-indigo-300 shadow-sm'
              : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
          }`}
        >
          <span className="block text-[10px] font-bold uppercase tracking-wider">Paso 1</span>
          <span className="text-xs sm:text-sm font-bold flex items-center justify-center gap-1">
            <span>🔍</span> <span className="hidden sm:inline">Búsqueda &</span> Recepción
          </span>
        </button>

        <button
          type="button"
          disabled={!selectedVehicle}
          onClick={() => selectedVehicle && setStep('diagnosis')}
          className={`rounded-xl border p-2.5 sm:p-3 transition ${
            !selectedVehicle
              ? 'opacity-50 cursor-not-allowed border-slate-800 bg-slate-900/30 text-slate-500'
              : step === 'diagnosis'
              ? 'border-indigo-500/60 bg-indigo-950/40 text-indigo-300 shadow-sm'
              : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
          }`}
        >
          <span className="block text-[10px] font-bold uppercase tracking-wider">Paso 2</span>
          <span className="text-xs sm:text-sm font-bold flex items-center justify-center gap-1">
            <span>📋</span> Diagnóstico <span className="hidden sm:inline">OEM</span>
          </span>
        </button>

        <button
          type="button"
          disabled={!selectedVehicle}
          onClick={() => selectedVehicle && setStep('order')}
          className={`rounded-xl border p-2.5 sm:p-3 transition ${
            !selectedVehicle
              ? 'opacity-50 cursor-not-allowed border-slate-800 bg-slate-900/30 text-slate-500'
              : step === 'order'
              ? 'border-indigo-500/60 bg-indigo-950/40 text-indigo-300 shadow-sm'
              : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
          }`}
        >
          <span className="block text-[10px] font-bold uppercase tracking-wider">Paso 3</span>
          <span className="text-xs sm:text-sm font-bold flex items-center justify-center gap-1">
            <span>🛠️</span> Orden <span className="hidden sm:inline">de Trabajo</span>
          </span>
        </button>
      </div>

      {/* Step Renderers */}
      {step === 'search' && (
        <IntakeHeroSearch
          vehicles={vehicles}
          activeTenantId={activeTenantId}
          onSelectVehicle={handleSelectVehicle}
          createVehicleAction={createVehicleAction}
        />
      )}

      {step === 'diagnosis' && selectedVehicle && (
        <OemDiagnosisCard
          vehicle={selectedVehicle}
          onApplyPlanToOrder={handleApplyPlanToOrder}
          onProceedToOrder={handleProceedToOrder}
          onResetVehicle={handleResetVehicle}
        />
      )}

      {step === 'order' && (
        <UnifiedWorkOrderForm
          vehicles={vehicles}
          activeTenantId={activeTenantId}
          selectedVehicle={selectedVehicle}
          initialItems={prefilledItems}
          initialRecommendations={prefilledRecommendations}
          onSaveWorkOrderAction={saveWorkOrderAction}
          onBackToDiagnosis={() => setStep('diagnosis')}
        />
      )}
    </div>
  );
}

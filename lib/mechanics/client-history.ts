import type { Vehicle, MaintenanceRecord, ServiceType } from './types';
import type { ClientVehicleItem } from './client-directory';

export interface VehicleWithFullRecords extends Vehicle {
  maintenance_records?: MaintenanceRecord[];
}

export interface ClientWorkOrderItem {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  serviceDate: string;
  mileage: number;
  serviceType: ServiceType;
  description: string;
  technicianName?: string;
  cost: number;
  status: 'completed' | 'in_progress';
  nextServiceDate?: string;
  nextServiceMileage?: number;
}

export interface ClientDetailedProfile {
  clientKey: string;
  name: string;
  identification?: string;
  phone?: string;
  email?: string;
  vehicles: ClientVehicleItem[];
  workOrders: ClientWorkOrderItem[];
  totalSpent: number;
  totalServices: number;
  firstVisitDate: string | null;
  lastVisitDate: string | null;
}

/**
 * Computes a standardized client key from identification or name.
 */
export function computeClientKey(v: {
  owner_identification?: string | null;
  owner_name?: string | null;
}): string | null {
  const rawId = (v.owner_identification || '').trim().replace(/\D/g, '');
  const rawName = (v.owner_name || '').trim();

  if (!rawId && !rawName) return null;
  return rawId ? `id:${rawId}` : `name:${rawName.toLowerCase()}`;
}

/**
 * Aggregates all vehicles and maintenance records for a given clientKey into a consolidated commercial profile.
 */
export function buildClientDetailedProfile(
  clientKey: string,
  vehicles: VehicleWithFullRecords[]
): ClientDetailedProfile | null {
  const matchingVehicles = vehicles.filter((v) => computeClientKey(v) === clientKey);
  if (matchingVehicles.length === 0) {
    return null;
  }

  const primary = matchingVehicles[0];
  const name = primary.owner_name?.trim() || 'Cliente Sin Nombre';
  const identification = primary.owner_identification?.trim() || undefined;
  const phone = primary.owner_phone?.trim() || undefined;
  const email = primary.owner_email?.trim() || undefined;

  const clientVehicles: ClientVehicleItem[] = matchingVehicles.map((v) => ({
    id: v.id,
    plate: v.plate,
    brand: v.brand,
    model: v.model,
    year: v.year,
    current_mileage: v.current_mileage,
  }));

  const workOrders: ClientWorkOrderItem[] = [];

  for (const v of matchingVehicles) {
    if (v.maintenance_records && Array.isArray(v.maintenance_records)) {
      for (const rec of v.maintenance_records) {
        workOrders.push({
          id: rec.id,
          vehicleId: v.id,
          vehiclePlate: v.plate,
          vehicleBrand: v.brand,
          vehicleModel: v.model,
          serviceDate: rec.service_date,
          mileage: rec.mileage,
          serviceType: rec.service_type,
          description: rec.description,
          technicianName: rec.technician_name,
          cost: Number(rec.cost) || 0,
          status: rec.status,
          nextServiceDate: rec.next_service_date,
          nextServiceMileage: rec.next_service_mileage,
        });
      }
    }
  }

  // Sort descending by serviceDate (newest first)
  workOrders.sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());

  const totalSpent = workOrders.reduce((acc, order) => acc + order.cost, 0);
  const totalServices = workOrders.length;

  let firstVisitDate: string | null = null;
  let lastVisitDate: string | null = null;

  if (workOrders.length > 0) {
    lastVisitDate = workOrders[0].serviceDate;
    firstVisitDate = workOrders[workOrders.length - 1].serviceDate;
  }

  return {
    clientKey,
    name,
    identification,
    phone,
    email,
    vehicles: clientVehicles,
    workOrders,
    totalSpent,
    totalServices,
    firstVisitDate,
    lastVisitDate,
  };
}

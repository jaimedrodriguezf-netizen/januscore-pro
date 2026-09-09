import type { Vehicle } from './types';

export interface VehicleMaintenanceSummary {
  id: string;
  service_date: string;
}

export interface VehicleWithRecords extends Vehicle {
  maintenance_records?: VehicleMaintenanceSummary[];
}

export interface ClientVehicleItem {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year?: number;
  current_mileage: number;
}

export interface WorkshopClientAggregate {
  clientKey: string;
  name: string;
  identification?: string;
  phone?: string;
  email?: string;
  vehicles: ClientVehicleItem[];
  totalServices: number;
  lastServiceDate: string | null;
  isFleetOwner: boolean;
}

export interface ClientDirectoryKPIs {
  totalClients: number;
  fleetClientsCount: number;
  totalVehicles: number;
  totalServices: number;
}

/**
 * Aggregates a list of workshop vehicles with maintenance records into unique client profiles.
 * Groups by `owner_identification` (cédula/RUC) if available, or falls back to normalized `owner_name`.
 */
export function aggregateWorkshopClients(vehicles: VehicleWithRecords[]): WorkshopClientAggregate[] {
  const map = new Map<string, WorkshopClientAggregate>();

  for (const v of vehicles) {
    const rawId = (v.owner_identification || '').trim().replace(/\D/g, '');
    const rawName = (v.owner_name || '').trim();

    if (!rawId && !rawName) {
      continue;
    }

    const clientKey = rawId ? `id:${rawId}` : `name:${rawName.toLowerCase()}`;

    let client = map.get(clientKey);
    if (!client) {
      client = {
        clientKey,
        name: rawName || (rawId ? `Cliente ${rawId}` : 'Sin nombre'),
        identification: rawId || undefined,
        phone: v.owner_phone || undefined,
        email: v.owner_email || undefined,
        vehicles: [],
        totalServices: 0,
        lastServiceDate: null,
        isFleetOwner: false,
      };
      map.set(clientKey, client);
    } else {
      // Update contact info with latest available values
      if (rawName && (!client.name || client.name.length < rawName.length)) {
        client.name = rawName;
      }
      if (v.owner_phone && !client.phone) client.phone = v.owner_phone;
      if (v.owner_email && !client.email) client.email = v.owner_email;
      if (rawId && !client.identification) client.identification = rawId;
    }

    // Add vehicle to client
    client.vehicles.push({
      id: v.id,
      plate: v.plate,
      brand: v.brand,
      model: v.model,
      year: v.year,
      current_mileage: v.current_mileage,
    });

    // Tally maintenance records
    const records = v.maintenance_records || [];
    client.totalServices += records.length;

    for (const rec of records) {
      if (rec.service_date) {
        if (!client.lastServiceDate || new Date(rec.service_date) > new Date(client.lastServiceDate)) {
          client.lastServiceDate = rec.service_date;
        }
      }
    }
  }

  // Set isFleetOwner and convert to array
  const result: WorkshopClientAggregate[] = [];
  for (const client of map.values()) {
    client.isFleetOwner = client.vehicles.length > 1;
    result.push(client);
  }

  // Sort by last service date (newest first), then by vehicle count
  result.sort((a, b) => {
    if (a.lastServiceDate && b.lastServiceDate) {
      return new Date(b.lastServiceDate).getTime() - new Date(a.lastServiceDate).getTime();
    }
    if (a.lastServiceDate && !b.lastServiceDate) return -1;
    if (!a.lastServiceDate && b.lastServiceDate) return 1;
    return b.vehicles.length - a.vehicles.length;
  });

  return result;
}

/**
 * Computes executive KPI summary metrics for the clients directory.
 */
export function computeClientKPIs(
  clients: WorkshopClientAggregate[],
  totalVehiclesCount: number
): ClientDirectoryKPIs {
  const totalClients = clients.length;
  const fleetClientsCount = clients.filter((c) => c.isFleetOwner).length;
  const totalServices = clients.reduce((acc, c) => acc + c.totalServices, 0);

  return {
    totalClients,
    fleetClientsCount,
    totalVehicles: totalVehiclesCount,
    totalServices,
  };
}

/**
 * Filter workshop clients by query matching name, identification, phone, or owned vehicle plates.
 */
export function filterWorkshopClients(
  clients: WorkshopClientAggregate[],
  query?: string
): WorkshopClientAggregate[] {
  const q = (query || '').trim().toLowerCase();
  if (!q) {
    return clients;
  }

  return clients.filter((c) => {
    if (c.name.toLowerCase().includes(q)) return true;
    if (c.identification && c.identification.toLowerCase().includes(q)) return true;
    if (c.phone && c.phone.toLowerCase().includes(q)) return true;
    if (c.email && c.email.toLowerCase().includes(q)) return true;
    if (c.vehicles.some((v) => v.plate.toLowerCase().includes(q))) return true;
    return false;
  });
}

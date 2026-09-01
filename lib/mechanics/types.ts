export type ServiceType = 
  | 'oil_change'
  | 'brakes'
  | 'suspension'
  | 'full_abc'
  | 'alignment_balancing'
  | 'general_repair';

export interface Vehicle {
  id: string;
  tenant_id: string;
  plate: string;
  brand: string;
  model: string;
  year?: number;
  owner_name?: string;
  owner_phone?: string;
  current_mileage: number;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRecord {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  service_date: string;
  mileage: number;
  service_type: ServiceType;
  description: string;
  technician_name?: string;
  cost?: number;
  status: 'completed' | 'in_progress';
  next_service_date?: string;
  next_service_mileage?: number;
  created_at: string;
}

export interface NextServiceCalculation {
  nextMileage: number;
  nextDate: Date;
}

-- 00019_public_odometer_update.sql
-- Secure RPC to allow QR vehicle owners to update their current odometer reading.
-- Enforces integrity: anti-rollback (mileage cannot decrease) and reasonable delta limits.

create or replace function public.update_public_vehicle_odometer(
  p_vehicle_id uuid,
  p_mileage integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current integer;
begin
  if p_vehicle_id is null or p_mileage is null or p_mileage <= 0 then
    return jsonb_build_object('success', false, 'error', 'Kilometraje inválido');
  end if;

  select current_mileage into v_current
  from public.vehicles
  where id = p_vehicle_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Vehículo no encontrado');
  end if;

  -- Anti-tampering: mileage cannot decrease below previously recorded mileage
  if p_mileage < v_current then
    return jsonb_build_object(
      'success', false, 
      'error', 'El kilometraje ingresado (' || p_mileage || ' km) no puede ser menor al actual registrado (' || v_current || ' km)'
    );
  end if;

  -- Safety cap: cannot jump more than 500,000 km in a single self-service update
  if (p_mileage - v_current) > 500000 then
    return jsonb_build_object(
      'success', false,
      'error', 'El incremento de kilometraje excede el límite permitido para actualización directa'
    );
  end if;

  update public.vehicles
  set current_mileage = p_mileage,
      updated_at = now()
  where id = p_vehicle_id;

  return jsonb_build_object(
    'success', true, 
    'vehicle_id', p_vehicle_id, 
    'previous_mileage', v_current, 
    'new_mileage', p_mileage
  );
end;
$$;

grant execute on function public.update_public_vehicle_odometer(uuid, integer) to anon, authenticated;

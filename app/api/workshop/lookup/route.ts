import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessibleTenantIds } from '@/lib/tenancy/tenant';
import { lookupVehicleByPlate, lookupClientByIdentification } from '@/lib/mechanics/client-lookup';

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');
  const type = searchParams.get('type'); // 'plate' | 'identification'
  const value = searchParams.get('value');

  if (!tenantId || !type || !value) {
    return NextResponse.json(
      { error: 'Missing required query parameters: tenantId, type, value' },
      { status: 400 }
    );
  }

  // Security check: tenant must be accessible to current user
  const accessibleTenantIds = await getAccessibleTenantIds(supabase);
  if (!accessibleTenantIds.includes(tenantId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (type === 'plate') {
    const result = await lookupVehicleByPlate(supabase, tenantId, value);
    return NextResponse.json(result);
  }

  if (type === 'identification') {
    // Optionally fetch tenant's cipherbyte api key for SRI lookup
    const { data: billingConfig } = await supabase
      .from('tenant_billing_configs')
      .select('cipherbyte_api_key')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const apiKey = billingConfig?.cipherbyte_api_key || process.env.CIPHERBYTE_API_KEY;

    const result = await lookupClientByIdentification(supabase, tenantId, value, {
      lookupSri: true,
      cipherbyteApiKey: apiKey,
    });

    return NextResponse.json(result);
  }

  return NextResponse.json({ error: 'Invalid lookup type' }, { status: 400 });
}

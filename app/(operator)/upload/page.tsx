import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAccessibleBranchIds } from '@/lib/tenancy/branch';
import { uploadReceiptOriginal } from '@/lib/upload/storage';
import { registerReceipt } from '@/lib/upload/register';

/**
 * R1 — Manual ingestion. An authenticated operator selects one of their
 * registered branches and uploads an image/PDF of a payment receipt. The
 * original is stored immutably (uuid-keyed path, upsert=false) and a pending
 * receipt is registered at the chosen branch.
 */
export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const branchIds = user
    ? await getAccessibleBranchIds(supabase)
    : [];
  const { data: branches } = branchIds.length
    ? await supabase
        .from('branches')
        .select('id, name, code')
        .in('id', branchIds)
        .eq('is_active', true)
        .order('name')
    : { data: [] };

  const params = await searchParams;

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Upload receipt</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Originals are stored byte-for-byte and never overwritten.
      </p>

      {params.ok ? (
        <p className="mt-4 rounded bg-green-50 px-3 py-2 text-sm text-green-700">
          Receipt registered as pending.
        </p>
      ) : null}
      {params.err ? (
        <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {params.err}
        </p>
      ) : null}

      {!user ? (
        <p className="mt-6 text-sm text-neutral-700">Sign in to upload a receipt.</p>
      ) : !branches?.length ? (
        <p className="mt-6 text-sm text-neutral-700">
          You are not a member of any branch. Ask your tenant admin to assign one.
        </p>
      ) : (
        <form action={uploadReceiptAction} encType="multipart/form-data" className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="font-medium">Branch</span>
            <select
              name="branchId"
              required
              className="mt-1 block w-full rounded border border-neutral-300 px-2 py-1.5"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="font-medium">Receipt image / PDF</span>
            <input
              type="file"
              name="file"
              accept="image/*,application/pdf"
              required
              className="mt-1 block w-full text-sm"
            />
          </label>

          <button
            type="submit"
            className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Upload
          </button>
        </form>
      )}
    </main>
  );
}

async function uploadReceiptAction(formData: FormData) {
  'use server';
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/upload?err=Unauthorized');

  const branchId = String(formData.get('branchId') ?? '');
  const file = formData.get('file');
  if (!branchId || !(file instanceof File) || file.size === 0) {
    redirect('/upload?err=Missing%20branch%20or%20file');
  }

  // RLS ensures only branches the user may access are returned; resolving the
  // tenant here also blocks a forged branchId from another tenant.
  const { data: branch } = await supabase
    .from('branches')
    .select('id, tenant_id')
    .eq('id', branchId)
    .maybeSingle();
  if (!branch) redirect('/upload?err=Not%20authorized%20for%20that%20branch');

  try {
    const uploaded = await uploadReceiptOriginal(supabase, {
      tenantId: branch.tenant_id,
      branchId: branch.id,
      fileId: crypto.randomUUID(),
      file,
      contentType: file.type || 'application/octet-stream',
      originalFilename: file.name,
    });
    await registerReceipt(
      supabase,
      { tenantId: branch.tenant_id, branchId: branch.id, uploadedBy: user.id },
      uploaded,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upload failed';
    redirect(`/upload?err=${encodeURIComponent(msg)}`);
  }
  redirect('/upload?ok=1');
}
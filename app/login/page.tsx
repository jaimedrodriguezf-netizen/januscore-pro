import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; err?: string; ok?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.mode) query.set('mode', params.mode);
  if (params.err) query.set('err', params.err);
  if (params.ok) query.set('ok', params.ok);

  const queryString = query.toString();
  redirect(`/signin${queryString ? `?${queryString}` : ''}`);
}

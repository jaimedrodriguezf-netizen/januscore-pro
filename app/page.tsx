import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { APP_VERSION } from '@/lib/version';

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const sections = [
    {
      title: 'Taller Mecánico & QR',
      description: 'Control de vehículos, órdenes de servicio, proyección de próximos mantenimientos y stickers QR para parabrisas.',
      href: '/workshop',
      badge: 'Mecánica',
    },
    {
      title: 'Client Portal',
      description: 'Dedicated customer portal for uploading receipts and tracking personal verification status in real time.',
      href: '/portal',
      badge: 'Client',
    },
    {
      title: 'Upload Receipts',
      description: 'Manual ingestion of bank receipts with immutable storage and automatic OCR/QR triggering (R1).',
      href: '/upload',
      badge: 'Operator',
    },
    {
      title: 'Receipts Repository',
      description: 'Searchable repository, human second-person review workflow, and fraud detection badges (R6, R9).',
      href: '/receipts',
      badge: 'Operator',
    },
    {
      title: 'Branch Metrics',
      description: 'Real-time analytics, QR verification success rates, fraud detection rates, and CSV export (R10, R11).',
      href: '/metrics',
      badge: 'Analytics',
    },
    {
      title: 'Bank Public Keys',
      description: 'Manage and activate/deactivate 32-byte Ed25519 public keys per financial institution (R14).',
      href: '/settings/keys',
      badge: 'Admin',
    },
    {
      title: 'Beneficiary Accounts',
      description: 'Configure expected destination accounts for automatic reconciliation and fraud flags (R15).',
      href: '/settings/beneficiaries',
      badge: 'Admin',
    },
    {
      title: 'Branches & Users',
      description: 'Manage physical branches, user memberships, and multi-tenant access control (R12, R13).',
      href: '/settings/branches',
      badge: 'Admin',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans text-neutral-900 dark:bg-black dark:text-neutral-100">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-12">
        <header className="mb-12 border-b border-neutral-200 pb-6 dark:border-neutral-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  Enterprise Command Center
                </span>
                <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300">
                  {APP_VERSION}
                </span>
              </div>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
                JanusCore Pro
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                Multi-Tenant Receipt Verification, Ed25519 Cryptographic Proofs & Invoicing Core
              </p>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    {user.email}
                  </span>
                  <form action="/api/auth/signout" method="POST">
                    <button
                      type="submit"
                      className="rounded bg-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-200"
                    >
                      Sign Out
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
                >
                  Sign In →
                </Link>
              )}
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((sec) => (
            <Link
              key={sec.title}
              href={sec.href}
              className="group flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-neutral-400 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-600"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    {sec.badge}
                  </span>
                  <span className="text-xs font-medium text-indigo-600 opacity-0 transition group-hover:opacity-100 dark:text-indigo-400">
                    Launch →
                  </span>
                </div>
                <h2 className="mt-3 text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                  {sec.title}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {sec.description}
                </p>
              </div>
            </Link>
          ))}
        </section>

        <footer className="mt-auto border-t border-neutral-200 pt-8 text-center text-xs text-neutral-400 dark:border-neutral-800">
          <p>
            Powered by <strong className="font-semibold text-neutral-600 dark:text-neutral-300">januscore.pro</strong> • Strict RLS & Cryptographic Trust Layer • <span className="font-mono text-[11px] font-bold text-neutral-500">{APP_VERSION}</span>
          </p>
        </footer>
      </main>
    </div>
  );
}

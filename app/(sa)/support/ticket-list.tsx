'use client';

import { useState, useTransition } from 'react';
import { updateSupportTicket, getTicketAttachmentSignedUrl } from '@/app/actions/support';

export interface SupportTicketItem {
  id: string;
  user_id: string;
  tenant_id?: string | null;
  category: 'bug' | 'question' | 'feature' | 'other';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  subject: string;
  message: string;
  attachment_path?: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  metadata: Record<string, unknown>;
  admin_notes?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { email: string; full_name?: string | null } | null;
  tenants?: { name: string; slug: string } | null;
}

interface TicketListProps {
  initialTickets: SupportTicketItem[];
}

const CATEGORY_LABELS: Record<string, { label: string; badge: string }> = {
  bug: { label: '🐛 Error / Bug', badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  question: { label: '❓ Consulta', badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
  feature: { label: '💡 Sugerencia', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  other: { label: '📌 Otro', badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
};

const STATUS_LABELS: Record<string, { label: string; badge: string }> = {
  open: { label: 'Abierto', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  in_progress: { label: 'En Proceso', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  resolved: { label: 'Resuelto', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  closed: { label: 'Cerrado', badge: 'bg-slate-700 text-slate-300 border-slate-600' },
};

const PRIORITY_LABELS: Record<string, { label: string; badge: string }> = {
  low: { label: 'Baja', badge: 'text-slate-400' },
  normal: { label: 'Normal', badge: 'text-blue-400' },
  high: { label: 'Alta', badge: 'text-amber-400 font-semibold' },
  urgent: { label: 'Urgente', badge: 'text-rose-400 font-bold' },
};

export function TicketList({ initialTickets }: TicketListProps) {
  const [tickets, setTickets] = useState<SupportTicketItem[]>(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();
  const [adminNotes, setAdminNotes] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [loadingAttachment, setLoadingAttachment] = useState(false);

  const handleSelectTicket = async (ticket: SupportTicketItem) => {
    setSelectedTicket(ticket);
    setAdminNotes(ticket.admin_notes || '');
    setAttachmentUrl(null);

    if (ticket.attachment_path) {
      setLoadingAttachment(true);
      const res = await getTicketAttachmentSignedUrl(ticket.attachment_path);
      if (res.url) {
        setAttachmentUrl(res.url);
      }
      setLoadingAttachment(false);
    }
  };

  const handleStatusChange = (newStatus: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    if (!selectedTicket) return;

    startTransition(async () => {
      const res = await updateSupportTicket(selectedTicket.id, {
        status: newStatus,
        adminNotes,
      });

      if (res.ok) {
        const updated = {
          ...selectedTicket,
          status: newStatus,
          admin_notes: adminNotes,
          resolved_at: newStatus === 'resolved' || newStatus === 'closed' ? new Date().toISOString() : null,
        };
        setSelectedTicket(updated);
        setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      }
    });
  };

  const handleSaveNotes = () => {
    if (!selectedTicket) return;

    startTransition(async () => {
      const res = await updateSupportTicket(selectedTicket.id, {
        adminNotes,
      });

      if (res.ok) {
        const updated = { ...selectedTicket, admin_notes: adminNotes };
        setSelectedTicket(updated);
        setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      }
    });
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchSubject = t.subject.toLowerCase().includes(term);
      const matchMessage = t.message.toLowerCase().includes(term);
      const matchEmail = (t.profiles?.email || '').toLowerCase().includes(term);
      const matchTenant = (t.tenants?.name || '').toLowerCase().includes(term);
      if (!matchSubject && !matchMessage && !matchEmail && !matchTenant) return false;
    }
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Ticket List & Filters */}
      <div className="lg:col-span-5 space-y-4">
        {/* Search & Filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por usuario, asunto o tenant..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="all">Todos los estados</option>
            <option value="open">Abiertos</option>
            <option value="in_progress">En Proceso</option>
            <option value="resolved">Resueltos</option>
            <option value="closed">Cerrados</option>
          </select>
        </div>

        {/* Counter */}
        <div className="text-[11px] text-slate-400 px-1">
          Mostrando {filteredTickets.length} de {tickets.length} tickets
        </div>

        {/* List items */}
        <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          {filteredTickets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
              No se encontraron tickets con los filtros actuales.
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const cat = CATEGORY_LABELS[ticket.category] || CATEGORY_LABELS.other;
              const stat = STATUS_LABELS[ticket.status] || STATUS_LABELS.open;
              const isSelected = selectedTicket?.id === ticket.id;

              return (
                <div
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket)}
                  className={`group cursor-pointer rounded-2xl border p-4 transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-950/40'
                      : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${cat.badge}`}>
                        {cat.label}
                      </span>
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${stat.badge}`}>
                        {stat.label}
                      </span>
                      {ticket.attachment_path && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300" title="Contiene imagen">
                          📷
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {new Date(ticket.created_at).toLocaleDateString('es-EC', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-100 group-hover:text-indigo-300 transition line-clamp-1">
                    {ticket.subject}
                  </h4>
                  <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                    {ticket.message}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/60 pt-2">
                    <span className="truncate max-w-[180px]">
                      {ticket.profiles?.email || 'Usuario'}
                    </span>
                    {ticket.tenants?.name && (
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 font-mono truncate max-w-[130px]">
                        {ticket.tenants.name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Ticket Detail View */}
      <div className="lg:col-span-7">
        {!selectedTicket ? (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center text-slate-500">
            <svg className="h-10 w-10 text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-xs font-medium">Seleccioná un ticket del listado para ver el detalle completo</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-6">
            {/* Header detail */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${CATEGORY_LABELS[selectedTicket.category]?.badge}`}>
                    {CATEGORY_LABELS[selectedTicket.category]?.label}
                  </span>
                  <span className="text-xs text-slate-400">
                    Prioridad: <span className={PRIORITY_LABELS[selectedTicket.priority]?.badge}>{PRIORITY_LABELS[selectedTicket.priority]?.label}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    ID: {selectedTicket.id}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100">{selectedTicket.subject}</h3>
                <div className="mt-1 text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                  <span>Por <b>{selectedTicket.profiles?.email}</b></span>
                  {selectedTicket.tenants?.name && (
                    <>
                      <span>•</span>
                      <span>Tenant: <b className="text-slate-300">{selectedTicket.tenants.name}</b></span>
                    </>
                  )}
                  <span>•</span>
                  <span>{new Date(selectedTicket.created_at).toLocaleString('es-EC')}</span>
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
                {(['open', 'in_progress', 'resolved', 'closed'] as const).map((st) => (
                  <button
                    key={st}
                    disabled={isPending}
                    onClick={() => handleStatusChange(st)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                      selectedTicket.status === st
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    {STATUS_LABELS[st]?.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Body */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Descripción del Problema
              </h4>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {selectedTicket.message}
              </div>
            </div>

            {/* Attached Image */}
            {selectedTicket.attachment_path && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                  <span>Captura de Pantalla / Evidencia</span>
                </h4>
                {loadingAttachment ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-400">
                    Cargando vista previa de la imagen...
                  </div>
                ) : attachmentUrl ? (
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                    <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={attachmentUrl}
                        alt="Captura adjunta"
                        className="w-full max-h-96 object-contain hover:opacity-95 transition cursor-zoom-in"
                      />
                    </a>
                    <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Clic en la imagen para abrir en tamaño completo</span>
                      <a
                        href={attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:underline"
                      >
                        Abrir pestaña nueva ↗
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                    No se pudo cargar la imagen adjunta.
                  </div>
                )}
              </div>
            )}

            {/* System Metadata / Context */}
            {selectedTicket.metadata && Object.keys(selectedTicket.metadata).length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Contexto Automático del Sistema
                </h4>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs space-y-2 font-mono">
                  {typeof selectedTicket.metadata.page_url === 'string' && (
                    <div className="flex items-start gap-2">
                      <span className="text-slate-500 min-w-[70px]">Ruta:</span>
                      <a
                        href={selectedTicket.metadata.page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:underline break-all"
                      >
                        {selectedTicket.metadata.page_url}
                      </a>
                    </div>
                  )}
                  {typeof selectedTicket.metadata.app_version === 'string' && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 min-w-[70px]">Versión:</span>
                      <span className="text-slate-300">v{selectedTicket.metadata.app_version}</span>
                    </div>
                  )}
                  {typeof selectedTicket.metadata.screen_resolution === 'string' && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 min-w-[70px]">Pantalla:</span>
                      <span className="text-slate-300">{selectedTicket.metadata.screen_resolution}</span>
                    </div>
                  )}
                  {typeof selectedTicket.metadata.user_agent === 'string' && (
                    <div className="flex items-start gap-2">
                      <span className="text-slate-500 min-w-[70px]">Entorno:</span>
                      <span className="text-slate-400 text-[11px] break-all leading-normal">
                        {selectedTicket.metadata.user_agent}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Admin Internal Notes */}
            <div className="border-t border-slate-800 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Notas Internas de Soporte (Solo Superadmin)
              </h4>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Anotaciones sobre resolución, llamadas con el cliente o seguimiento interno..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSaveNotes}
                  className="rounded-lg bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition disabled:opacity-50"
                >
                  Guardar Notas
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

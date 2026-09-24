'use client';

import { useState, useRef, useEffect, useCallback, useTransition } from 'react';
import { createSupportTicket } from '@/app/actions/support';

interface SupportWidgetProps {
  userEmail?: string | null;
}

export function SupportWidget({ userEmail: _userEmail }: SupportWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<'bug' | 'question' | 'feature' | 'other'>('bug');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string; ticketId?: string } | null>(null);

  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateSelectedFile = useCallback((newFile: File | null) => {
    setFile(newFile);
    setPreviewUrl((prevUrl) => {
      if (prevUrl) {
        URL.revokeObjectURL(prevUrl);
      }
      return newFile ? URL.createObjectURL(newFile) : null;
    });
  }, []);

  // Revoke object URL on unmount if any
  useEffect(() => {
    return () => {
      setPreviewUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return null;
      });
    };
  }, []);

  // Handle Ctrl+V / Cmd+V paste of images directly when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const pastedFile = items[i].getAsFile();
          if (pastedFile) {
            updateSelectedFile(pastedFile);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, updateSelectedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 10 * 1024 * 1024) {
        setStatusMessage({ type: 'error', text: 'La imagen excede el límite máximo de 10MB.' });
        return;
      }
      updateSelectedFile(selected);
    }
  };

  const handleRemoveFile = () => {
    updateSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!subject.trim()) {
      setStatusMessage({ type: 'error', text: 'Por favor, ingresá un asunto breve.' });
      return;
    }
    if (!message.trim()) {
      setStatusMessage({ type: 'error', text: 'Por favor, detallá el problema o tu consulta.' });
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('message', message);
      formData.append('category', category);
      formData.append('priority', priority);

      if (file) {
        formData.append('file', file);
      }

      // Collect automatic environment metadata
      const metadata = {
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`,
        submitted_at: new Date().toISOString(),
      };
      formData.append('metadata', JSON.stringify(metadata));

      const res = await createSupportTicket(formData);

      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: 'Ticket enviado con éxito. Nuestro equipo fue notificado de inmediato.',
          ticketId: res.ticketId,
        });
        setSubject('');
        setMessage('');
        updateSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Ocurrió un error al enviar el ticket.',
        });
      }
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setStatusMessage(null);
  };

  return (
    <>
      {/* Floating Action Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xl shadow-indigo-950/50 backdrop-blur-md transition-all hover:scale-105 hover:bg-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-400"
        title="Enviar consulta o reportar un problema"
        aria-label="Soporte Técnico"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span>Soporte</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={handleClose}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-slate-950 overflow-hidden text-slate-100 font-sans z-10 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Centro de Ayuda & Soporte</h3>
                  <p className="text-xs text-slate-400">Reportá un inconveniente o envianos tu duda</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
                aria-label="Cerrar"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto px-6 py-5 space-y-4">
              {statusMessage?.type === 'success' ? (
                <div className="py-6 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-base font-semibold text-emerald-400">¡Reporte Enviado!</h4>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto">
                    {statusMessage.text}
                  </p>
                  {statusMessage.ticketId && (
                    <p className="text-[11px] font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg inline-block border border-slate-800">
                      ID de Seguimiento: {statusMessage.ticketId}
                    </p>
                  )}
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="rounded-lg bg-slate-800 px-5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                    >
                      Aceptar y Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {statusMessage?.type === 'error' && (
                    <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300">
                      ⚠️ {statusMessage.text}
                    </div>
                  )}

                  {/* Category Pills & Priority */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Tipo de Inquietud
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setCategory('bug')}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition text-center ${
                            category === 'bug'
                              ? 'border-rose-500/50 bg-rose-500/15 text-rose-300'
                              : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                          }`}
                        >
                          🐛 Error / Falla
                        </button>
                        <button
                          type="button"
                          onClick={() => setCategory('question')}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition text-center ${
                            category === 'question'
                              ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-300'
                              : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                          }`}
                        >
                          ❓ Consulta
                        </button>
                        <button
                          type="button"
                          onClick={() => setCategory('feature')}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition text-center ${
                            category === 'feature'
                              ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                              : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                          }`}
                        >
                          💡 Sugerencia
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Nivel de Urgencia
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high' | 'urgent')}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
                      >
                        <option value="low">🟢 Baja (Consulta o duda menor)</option>
                        <option value="normal">🔵 Normal (Comportamiento inesperado)</option>
                        <option value="high">🟠 Alta (Impide continuar una tarea)</option>
                        <option value="urgent">🔴 Urgente (Servicio o taller detenido)</option>
                      </select>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Asunto o Título Corto <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Ej: Error al emitir orden de trabajo..."
                      required
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Descripción Detallada <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describí qué estabas haciendo y qué mensaje o comportamiento inesperado ocurrió..."
                      required
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  {/* Image Attachment & Paste zone */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-300">
                        Captura de Pantalla o Foto <span className="text-slate-500 font-normal">(Opcional)</span>
                      </label>
                      <span className="text-[10px] text-indigo-400 font-mono">
                        💡 Podés pegar con Ctrl+V
                      </span>
                    </div>

                    {!file ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="group flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-4 text-center cursor-pointer hover:border-indigo-500 hover:bg-slate-950 transition"
                      >
                        <svg className="h-6 w-6 text-slate-500 group-hover:text-indigo-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-1.5 text-xs text-slate-400">
                          Hacé clic para seleccionar una imagen o <span className="text-indigo-400 font-medium">pegala aquí</span>
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">JPG, PNG, WEBP hasta 10MB</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                        {previewUrl && (
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-800">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={previewUrl}
                              alt="Adjunto"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-200 truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/10 transition"
                          title="Eliminar imagen"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  {/* Context notice */}
                  <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] text-slate-400 flex items-start gap-2">
                    <span className="text-slate-500">ℹ️</span>
                    <span>
                      Para agilizar la solución, se adjuntará automáticamente la URL actual y datos del navegador.
                    </span>
                  </div>

                  {/* Form Footer */}
                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isPending}
                      className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition disabled:opacity-50"
                    >
                      {isPending ? (
                        <>
                          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <span>Enviar Ticket</span>
                          <span>→</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

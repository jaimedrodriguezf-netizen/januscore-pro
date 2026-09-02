'use client';

import Link from 'next/link';
import { type PrintableStickerData, type A4SheetLayout } from '@/lib/mechanics/printable-sheet';

interface PrintableSheetProps {
  stickerData: PrintableStickerData;
  layout: A4SheetLayout;
  vehiclePlate?: string;
  tenantName?: string;
}

export function PrintableSheet({
  stickerData,
  layout,
  vehiclePlate,
  tenantName,
}: PrintableSheetProps) {
  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      {/* Control Bar (Hidden on Print) */}
      <div className="print:hidden rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🖨️</span>
            <span className="rounded bg-indigo-500/15 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
              Formato A4 Estándar
            </span>
          </div>
          <h1 className="mt-1 text-lg font-extrabold text-white">
            Plancha de 15 Stickers QR para Parabrisas
          </h1>
          <p className="text-xs text-slate-400">
            {vehiclePlate
              ? `Plancha personalizada para el vehículo con placa: ${vehiclePlate}`
              : 'Plancha genérica para el taller con enlace público: januscore.pro/auto'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/workshop"
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            ← Volver al Taller
          </Link>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-indigo-500 active:scale-95 transition cursor-pointer"
          >
            <span>🖨️ Imprimir Plancha A4</span>
          </button>
        </div>
      </div>

      {/* A4 Sheet Container Preview & Printable Area */}
      <div className="overflow-x-auto pb-8 print:p-0 print:m-0 print:overflow-visible flex justify-center">
        <div
          id="printable-a4-sheet"
          className="w-[210mm] min-h-[297mm] bg-white text-black p-[6mm] shadow-2xl print:shadow-none print:m-0 print:p-0 border border-slate-300 print:border-none rounded-lg print:rounded-none"
          style={{ boxSizing: 'border-box' }}
        >
          {/* Header on sheet (Subtle) */}
          <div className="text-center border-b border-gray-300 pb-1 mb-2 print:mb-1 flex items-center justify-between px-2 text-[8px] text-gray-500 uppercase tracking-widest font-mono">
            <span>JanusCore Pro Auto Service • Plancha de Stickers A4</span>
            <span>Web: {stickerData.website} • 15 Unidades</span>
          </div>

          {/* 3x5 Grid for 15 Stickers */}
          <div className="grid grid-cols-3 gap-[4mm] print:gap-[3.5mm]">
            {layout.stickers.map((num) => (
              <div
                key={num}
                className="relative rounded-xl border border-dashed border-gray-400 p-2.5 flex flex-col items-center justify-between text-center bg-white"
                style={{
                  height: '52mm',
                  boxSizing: 'border-box',
                  pageBreakInside: 'avoid',
                }}
              >
                {/* Brand / Mechanics Logo Header */}
                <div className="w-full border-b border-gray-200 pb-1">
                  <div className="text-[10px] font-black uppercase tracking-tight text-gray-900 leading-tight truncate">
                    {tenantName || stickerData.tenantName}
                  </div>
                  <div className="text-[7.5px] font-bold text-indigo-700 tracking-wider font-mono">
                    {stickerData.website}
                  </div>
                </div>

                {/* High-Resolution QR Code */}
                <div className="my-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={stickerData.qrDataUrl}
                    alt={`QR Sticker ${num}`}
                    className="h-[23mm] w-[23mm] mx-auto object-contain"
                  />
                </div>

                {/* Plate / Client Info */}
                <div className="w-full border-t border-gray-200 pt-1 space-y-0.5">
                  {vehiclePlate ? (
                    <div className="font-mono text-xs font-black text-gray-900 tracking-wider">
                      {vehiclePlate}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1 text-[8px] font-mono font-bold text-gray-700">
                      <span>PLACA:</span>
                      <span className="border-b border-gray-400 w-16 inline-block" />
                    </div>
                  )}
                  <div className="text-[6.5px] font-semibold text-gray-600 leading-tight">
                    Escanea para ver tu próximo mantenimiento
                  </div>
                </div>

                {/* Scissors Cut Indicator in Corner */}
                <div className="absolute top-1 right-1 text-[8px] text-gray-400 opacity-60">
                  ✂️
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm;
          }
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header,
          aside,
          nav,
          footer,
          .print\\:hidden {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          #printable-a4-sheet {
            width: 100% !important;
            min-height: 100% !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}

"use client";
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface ExportMenuProps { kinds: { key: string; label: string; }[]; }

export function ExportMenu({ kinds }: ExportMenuProps) {
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const baseParams = ['from','to','g'].map(k=> sp?.get(k) ? `${k}=${encodeURIComponent(sp.get(k)!)}` : null).filter(Boolean).join('&');

  function buildUrl(kind: string, format: 'csv'|'json') {
    const qs = baseParams ? `?${baseParams}&format=${format}` : `?format=${format}`;
    return `/api/admin/metrics/export/${kind}${qs}`;
  }

  return (
    <div className="relative inline-block text-left">
      <button onClick={()=> setOpen(o=> !o)} className="px-3 py-1.5 text-xs border rounded bg-white hover:bg-neutral-50 shadow-sm flex items-center gap-1">
        Exportar
        <span className="text-neutral-400">▾</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 right-0 w-52 bg-white border rounded-md shadow-lg p-2 flex flex-col gap-2">
          {kinds.map(k => (
            <div key={k.key} className="flex flex-col gap-1">
              <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-medium">{k.label}</p>
              <div className="flex gap-2">
                <a href={buildUrl(k.key,'csv')} className="flex-1 text-[11px] text-center bg-carrot text-nav font-medium rounded px-2 py-1 hover:opacity-90">CSV</a>
                <a href={buildUrl(k.key,'json')} className="flex-1 text-[11px] text-center bg-neutral-200 font-medium rounded px-2 py-1 hover:bg-neutral-300">JSON</a>
              </div>
            </div>
          ))}
          <button onClick={()=> setOpen(false)} className="w-full mt-1 text-[10px] text-neutral-500 hover:text-neutral-700">Cerrar</button>
        </div>
      )}
    </div>
  );
}
'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';

function fmt(d: Date) { return d.toISOString().slice(0,10); }
function parse(str?: string|null): Date|undefined { if (!str) return undefined; const d = new Date(str); return Number.isNaN(d.getTime())? undefined : d; }
function daysBetween(a: Date, b: Date) { return Math.round((b.getTime()-a.getTime())/86400000); }

const PRESETS: { key:string; label:string; resolve:()=>{from:string;to:string}; desc:string }[] = [
  { key:'7d', label:'Últimos 7 días', desc:'Incluye hoy', resolve: ()=> { const now=new Date(); const s=new Date(now.getTime()-6*86400000); return { from: fmt(toUTC(s)), to: fmt(toUTC(now)) }; } },
  { key:'30d', label:'Últimos 30 días', desc:'Incluye hoy', resolve: ()=> { const now=new Date(); const s=new Date(now.getTime()-29*86400000); return { from: fmt(toUTC(s)), to: fmt(toUTC(now)) }; } },
  { key:'90d', label:'Últimos 90 días', desc:'Trimestre rolling', resolve: ()=> { const now=new Date(); const s=new Date(now.getTime()-89*86400000); return { from: fmt(toUTC(s)), to: fmt(toUTC(now)) }; } },
  { key:'ytd', label:'Año actual', desc:'Desde 1 enero', resolve: ()=> { const now=new Date(); const s=new Date(Date.UTC(now.getUTCFullYear(),0,1)); return { from: fmt(s), to: fmt(toUTC(now)) }; } },
];

function toUTC(d: Date) { return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); }

export function DashboardFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Actuales desde URL
  const urlFrom = sp?.get('from');
  const urlTo = sp?.get('to');
  const granularity = sp?.get('g') || 'day';

  // Estado editable (no aplica hasta pulsar Aplicar)
  const [from, setFrom] = useState<string | ''>(urlFrom || '');
  const [to, setTo] = useState<string | ''>(urlTo || '');
  const [g, setG] = useState(granularity);
  const [error, setError] = useState<string>('');
  const [activePreset, setActivePreset] = useState<string|undefined>();

  useEffect(()=> { setFrom(urlFrom || ''); setTo(urlTo || ''); setG(granularity); }, [urlFrom, urlTo, granularity]);

  // Detect preset activo según rango
  useEffect(()=> {
    const f = parse(from); const t = parse(to);
    if (!f || !t) { setActivePreset(undefined); return; }
    for (const p of PRESETS) {
      const { from: pf, to: pt } = p.resolve();
      if (pf === from && pt === to) { setActivePreset(p.key); return; }
    }
    setActivePreset(undefined);
  }, [from, to]);

  const apply = useCallback(()=> {
    setError('');
    const f = parse(from); const t = parse(to);
    if ((from && !f) || (to && !t)) { setError('Fecha inválida.'); return; }
    if (f && t && f > t) { setError('La fecha inicial es mayor que la final.'); return; }
    if (f && t && daysBetween(f,t) > 365) { setError('Rango máximo: 365 días.'); return; }
    const q = new URLSearchParams(sp?.toString() || '');
    function setQ(k:string,v?:string) { if (!v) q.delete(k); else q.set(k,v); }
    setQ('from', from || undefined);
    setQ('to', to || undefined);
    setQ('g', g || undefined);
    startTransition(()=> router.push(`/admin?${q.toString()}`));
  }, [from, to, g, sp, router]);

  function applyPreset(key: string) {
    const p = PRESETS.find(x=>x.key===key); if (!p) return;
    const r = p.resolve();
    setFrom(r.from); setTo(r.to); setActivePreset(key); setTimeout(()=> apply(), 0);
  }

  function reset() {
    setFrom(''); setTo(''); setActivePreset(undefined); setError(''); setTimeout(()=> apply(), 0);
  }

  const summary = useMemo(()=> {
    const f = parse(from); const t = parse(to);
    if (f && t) return `${daysBetween(f,t)+1} días`;
    if (from || to) return 'Rango incompleto';
    return 'Sin filtro';
  }, [from, to]);

  return (
    <div className="w-full p-3 border rounded-lg bg-white/90 shadow-sm text-xs flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-600">Rango</span>
          <span className="px-2 py-0.5 rounded bg-neutral-100 text-[10px] border font-medium tabular-nums">{summary}</span>
          {activePreset && <span className="px-2 py-0.5 rounded bg-carrot/20 text-[10px] border border-carrot/40 font-medium">{activePreset.toUpperCase()}</span>}
        </div>
        <div className="flex items-center gap-1">
          {['day','week','month'].map(opt => (
            <button
              key={opt}
              onClick={()=> setG(opt)}
              className={`px-2 py-1 rounded border transition text-[11px] ${g===opt? 'bg-carrot text-nav border-carrot shadow-sm':'bg-white hover:bg-neutral-50'}`}
              aria-pressed={g===opt}
            >{opt==='day'?'Día': opt==='week'?'Semana':'Mes'}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map(p => (
          <button
            key={p.key}
            type="button"
            onClick={()=> applyPreset(p.key)}
            className={`group relative px-3 py-1.5 rounded border text-[11px] transition ${activePreset===p.key? 'bg-neutral-900 text-white border-neutral-900 shadow':'bg-white hover:bg-neutral-50'}`}
          >
            {p.label}
            <span className="pointer-events-none absolute left-1/2 top-full z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-neutral-800 px-2 py-1 text-[10px] font-medium text-white group-hover:block mt-1 shadow-lg">
              {p.desc}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={reset}
          className="px-3 py-1.5 rounded border text-[11px] bg-white hover:bg-neutral-50"
          title="Limpiar rango y usar valores por defecto"
        >Reset</button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500" htmlFor="fromInput">Desde</label>
          <input id="fromInput" type="date" value={from} onChange={e=> setFrom(e.target.value)} className="px-2 py-1 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-carrot/50" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500" htmlFor="toInput">Hasta</label>
            <input id="toInput" type="date" value={to} onChange={e=> setTo(e.target.value)} className="px-2 py-1 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-carrot/50" />
        </div>
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={apply}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded border text-[11px] font-medium bg-carrot text-nav border-carrot hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending && <span className="w-3 h-3 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />}
            Aplicar
          </button>
        </div>
      </div>
      {error && <p className="text-[11px] font-medium text-red-600">{error}</p>}
      <p className="text-[10px] text-neutral-400">Consejo: primero elige un preset y luego ajusta manualmente si necesitas días específicos. Máximo 365 días.</p>
    </div>
  );
}

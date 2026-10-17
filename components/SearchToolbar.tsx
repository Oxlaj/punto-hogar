"use client";
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

interface SearchToolbarProps {
  q: string;
  sort: string;
  per: number;
  cat: string;
  categories: { id: string; name: string; slug: string }[];
  base?: string;
  priceMin?: number; // applied filter
  priceMax?: number; // applied filter
  minBound: number; // global min
  maxBound: number; // global max
}

export default function SearchToolbar({ q, sort, per, cat, categories, base = '/search', priceMin, priceMax, minBound, maxBound }: SearchToolbarProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [localMin, setLocalMin] = React.useState<number>(priceMin ?? minBound);
  const [localMax, setLocalMax] = React.useState<number>(priceMax ?? maxBound);

  function update(next: Partial<{ sort: string; per: number|string; cat: string; page?: number; priceMin?: number|string; priceMax?: number|string }>) {
    const sp = new URLSearchParams(params?.toString() || '');
    sp.set('q', q);
    if (next.sort) sp.set('sort', next.sort); else sp.set('sort', sort);
    if (next.per) sp.set('per', String(next.per)); else sp.set('per', String(per));
    if (next.cat !== undefined) {
      if (next.cat) sp.set('cat', next.cat); else sp.delete('cat');
    } else if (cat) sp.set('cat', cat);
    const useMin = next.priceMin !== undefined ? next.priceMin : (priceMin !== undefined ? priceMin : undefined);
    const useMax = next.priceMax !== undefined ? next.priceMax : (priceMax !== undefined ? priceMax : undefined);
    if (useMin !== undefined) sp.set('priceMin', String(useMin)); else sp.delete('priceMin');
    if (useMax !== undefined) sp.set('priceMax', String(useMax)); else sp.delete('priceMax');
    // reiniciar page si se cambió algo importante
    sp.delete('page');
    const url = `${base}?${sp.toString()}`;
    startTransition(()=> router.push(url));
  }

  function resetFilters() {
    const sp = new URLSearchParams();
    sp.set('q', q);
    const url = `${base}?${sp.toString()}`;
    startTransition(()=> router.push(url));
  }

  function onRangeChange(newMin: number, newMax: number) {
    setLocalMin(newMin);
    setLocalMax(newMax);
    update({
      priceMin: newMin !== minBound ? newMin : undefined,
      priceMax: newMax !== maxBound ? newMax : undefined
    });
  }

  // Keep local state in sync if route changes externally
  React.useEffect(()=>{ setLocalMin(priceMin ?? minBound); }, [priceMin, minBound]);
  React.useEffect(()=>{ setLocalMax(priceMax ?? maxBound); }, [priceMax, maxBound]);

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <div className="flex items-center gap-1">
        <label htmlFor="sort" className="hidden font-medium text-neutral-600 sm:block">Ordenar</label>
        <select
          id="sort"
          defaultValue={sort}
          onChange={e=>update({ sort: e.target.value })}
          disabled={isPending}
          className="px-2 py-1 bg-white border rounded border-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/50 disabled:opacity-50"
        >
          <option value="new">Nuevos</option>
          <option value="price_asc">Precio ↑</option>
          <option value="price_desc">Precio ↓</option>
            <option value="name">Nombre A-Z</option>
        </select>
      </div>
      <div className="flex items-center gap-1">
        <label htmlFor="per" className="hidden font-medium text-neutral-600 sm:block">Por página</label>
        <select
          id="per"
          defaultValue={String(per)}
          onChange={e=>update({ per: e.target.value })}
          disabled={isPending}
          className="px-2 py-1 bg-white border rounded border-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/50 disabled:opacity-50"
        >
          {[12,24,36,48].map(o=> <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <label htmlFor="cat" className="hidden font-medium text-neutral-600 sm:block">Categoría</label>
        <select
          id="cat"
          defaultValue={cat || ''}
          onChange={e=>update({ cat: e.target.value })}
          disabled={isPending}
          className="px-2 py-1 bg-white border rounded border-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/50 disabled:opacity-50"
        >
          <option value="">Todas</option>
          {categories.map(c=> <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
      </div>
      {isPending && <span className="text-neutral-400">Actualizando…</span>}
      <div className="flex items-center w-full gap-2 sm:w-auto sm:ml-2">
        <PriceRange
          minBound={minBound}
          maxBound={maxBound}
          valueMin={localMin}
          valueMax={localMax}
          onChange={onRangeChange}
        />
      </div>
      <button
        type="button"
        onClick={resetFilters}
        className="px-3 py-1 font-medium transition bg-white border rounded hover:bg-neutral-50 border-neutral-300 text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/50"
      >Limpiar filtros</button>
    </div>
  );
}

interface PriceRangeProps {
  minBound: number; maxBound: number; valueMin: number; valueMax: number; onChange: (min:number,max:number)=>void;
}
function PriceRange({ minBound, maxBound, valueMin, valueMax, onChange }: PriceRangeProps) {
  const min = Math.min(minBound, maxBound);
  const max = Math.max(minBound, maxBound);
  const [draftMin, setDraftMin] = React.useState(String(valueMin));
  const [draftMax, setDraftMax] = React.useState(String(valueMax));
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setDraftMin(String(valueMin));
    setDraftMax(String(valueMax));
  }, [valueMin, valueMax]);

  function apply() {
    const nextMin = Number(draftMin);
    const nextMax = Number(draftMax);
    if (!Number.isFinite(nextMin) || !Number.isFinite(nextMax) || nextMin < 0 || nextMax < 0) {
      setError('Ingresa precios numéricos no negativos.');
      return;
    }
    if (nextMin > nextMax) {
      setError('El precio mínimo no puede superar al máximo.');
      return;
    }
    setError(null);
    onChange(Math.max(min, nextMin), Math.min(max, nextMax));
  }

  return (
    <div className="flex flex-wrap items-end gap-2 min-w-[270px]">
      <label className="flex flex-col gap-1 text-[10px] font-medium text-neutral-600">
        <span>Mínimo (Q)</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={draftMin}
          onChange={e => setDraftMin(e.target.value)}
          className="w-24 px-2 py-1 text-xs bg-white border rounded border-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/50"
          aria-label="Precio mínimo"
        />
      </label>
      <label className="flex flex-col gap-1 text-[10px] font-medium text-neutral-600">
        <span>Máximo (Q)</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={draftMax}
          onChange={e => setDraftMax(e.target.value)}
          className="w-24 px-2 py-1 text-xs bg-white border rounded border-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/50"
          aria-label="Precio máximo"
        />
      </label>
      <button
        type="button"
        onClick={apply}
        className="px-3 py-1 text-xs font-medium transition rounded bg-carrot text-nav hover:bg-carrot-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/50"
      >
        Aplicar
      </button>
      {error && <span role="alert" className="w-full text-[10px] text-red-600">{error}</span>}
      <span className="w-full text-[10px] text-neutral-400">Rango disponible: Q{min.toFixed(2)}–Q{max.toFixed(2)}</span>
    </div>
  );
}

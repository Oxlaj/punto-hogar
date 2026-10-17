"use client";
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { mapApiError } from '@/lib/client-errors';

interface PermissionDef { key: string; description: string | null }
interface Props { permissions: PermissionDef[] }

export default function NewRoleForm({ permissions }: Props) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState<string|null>(null);

  function toggle(p: string) {
    setSelected(s => s.includes(p) ? s.filter(x=>x!==p) : [...s, p]);
  }

  function groupedPermissions(list: PermissionDef[]): Record<string, PermissionDef[]> {
    const groups: Record<string, PermissionDef[]> = {};
    for (const perm of list) {
      const g = perm.key.includes(':') ? perm.key.split(':')[0] : 'otros';
      if (!groups[g]) groups[g] = [];
      groups[g].push(perm);
    }
    return groups;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (!name.trim()) { setError('Nombre requerido'); return; }
    start(async ()=>{
      try {
        const res = await fetch('/api/admin/roles', {
          method: 'POST',
          headers: { 'Content-Type':'application/json' },
            body: JSON.stringify({ name: name.trim(), label: label.trim(), description: description.trim() || null, permissions: selected })
        });
        if (!res.ok) {
          const data = await res.json().catch(()=>null);
          throw new Error(mapApiError(data));
        }
        setSuccess('Rol creado');
        setTimeout(()=>{ router.push('/admin/roles'); router.refresh(); }, 700);
      } catch (err:any) { setError(err.message || 'Error'); }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-2xl" noValidate>
      {error && <div className="px-3 py-2 text-sm rounded-md bg-red-100 text-red-700">{error}</div>}
      {success && <div className="px-3 py-2 text-sm rounded-md bg-green-100 text-green-700">{success}</div>}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">Nombre (machine)</label>
          <input value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2 text-sm rounded-md border bg-white border-neutral-300 focus:outline-none focus:ring-2 focus:ring-carrot/50 font-mono" placeholder="manager" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">Label</label>
          <input value={label} onChange={e=>setLabel(e.target.value)} className="w-full px-3 py-2 text-sm rounded-md border bg-white border-neutral-300 focus:outline-none focus:ring-2 focus:ring-carrot/50" placeholder="Manager" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-neutral-700">Descripción</label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm rounded-md border bg-white border-neutral-300 focus:outline-none focus:ring-2 focus:ring-carrot/50" placeholder="Rol con permisos de gestión de catálogo" />
        </div>
      </div>

      <fieldset className="space-y-5">
        <legend className="text-sm font-medium text-neutral-700">Permisos</legend>
        {permissions.length === 0 && <p className="text-xs text-neutral-500">No hay permisos definidos.</p>}
        {permissions.length > 0 && (
          <div className="space-y-6">
            {Object.entries(groupedPermissions(permissions)).map(([group, list]) => (
              <div key={group} className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{group}</h3>
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((p: PermissionDef) => (
                    <li key={p.key} className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selected.includes(p.key)}
                        onChange={()=>toggle(p.key)}
                        className="w-4 h-4 mt-0.5 rounded border-neutral-300 text-carrot focus:ring-carrot/50" />
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] leading-tight">{p.key}</p>
                        {p.description && <p className="text-[10px] text-neutral-500 leading-tight">{p.description}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </fieldset>

      <div className="flex gap-3 pt-2">
        <button disabled={isPending} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-md bg-carrot text-nav hover:bg-carrot-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/60 disabled:opacity-60">
          {isPending && <i className='bx bx-loader-alt animate-spin text-base'/>}
          Crear rol
        </button>
        <button type="button" disabled={isPending} onClick={()=>router.push('/admin/roles')} className="px-5 py-2.5 text-sm font-medium transition rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/50 disabled:opacity-50">Cancelar</button>
      </div>
    </form>
  );
}

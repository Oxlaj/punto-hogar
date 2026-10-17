"use client";
import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mapApiError } from '@/lib/client-errors';

interface PermissionDef { key: string; description: string|null }
interface Props { role: { id: string; name: string; label: string; description: string|null; permissions: string[]; users: string[] }; canUpdate: boolean; allPermissions: PermissionDef[] }

export default function RoleEditForm({ role, canUpdate, allPermissions }: Props) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [label, setLabel] = useState(role.label);
  const [description, setDescription] = useState(role.description || '');
  const [permissions, setPermissions] = useState<string[]>(role.permissions);
  const [userInput, setUserInput] = useState('');
  const [users, setUsers] = useState<string[]>(role.users);
  const [searchResults, setSearchResults] = useState<{id:string; email:string; name:string|null}[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string|null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState<string|null>(null);

  function toggle(p: string) {
    setPermissions(s => s.includes(p) ? s.filter(x=>x!==p) : [...s, p]);
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

  // Debounced user search
  useEffect(()=>{
    if (!query.trim()) { setSearchResults([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async ()=>{
      try {
        setSearchLoading(true); setSearchError(null);
        const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error('No se pudo buscar');
        const data = await res.json();
        setSearchResults(data);
      } catch(e:any) {
        if (e.name !== 'AbortError') setSearchError(e.message || 'Error');
      } finally { setSearchLoading(false); }
    }, 350);
    return ()=>{ clearTimeout(t); ctrl.abort(); };
  }, [query]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canUpdate) return;
    setError(null); setSuccess(null);
    start(async ()=>{
      try {
        const res = await fetch(`/api/admin/roles/${role.id}`, {
          method: 'PUT',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify({ label: label.trim(), description: description.trim() || null, permissions })
        });
        if (!res.ok) {
          const data = await res.json().catch(()=>null);
          throw new Error(mapApiError(data));
        }
        setSuccess('Rol actualizado');
        setTimeout(()=>{ router.refresh(); }, 800);
      } catch(err:any) { setError(err.message || 'Error'); }
    });
  }

  async function onDelete() {
    if (!canUpdate) return;
    if (!confirm('¿Eliminar rol? Esta acción no se puede deshacer.')) return;
    setError(null); setSuccess(null);
    start(async ()=>{
      try {
        const res = await fetch(`/api/admin/roles/${role.id}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json().catch(()=>null);
            throw new Error(mapApiError(data));
        }
        setSuccess('Rol eliminado');
        setTimeout(()=>{ router.push('/admin/roles'); router.refresh(); }, 700);
      } catch (err:any) { setError(err.message || 'Error'); }
    });
  }

  async function assignUser() {
    if (!canUpdate || !userInput.trim()) return;
    const id = userInput.trim();
    setError(null); setSuccess(null);
    start(async ()=>{
      try {
        const res = await fetch(`/api/admin/roles/${role.id}/assign`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ userId: id }) });
        if (!res.ok) {
          const data = await res.json().catch(()=>null); throw new Error(mapApiError(data));
        }
        setUsers(u => u.includes(id)? u : [...u, id]);
        setUserInput('');
        setSuccess('Usuario asignado');
      } catch(err:any) { setError(err.message || 'Error'); }
    });
  }

  async function revokeUser(id: string) {
    if (!canUpdate) return;
    if (!confirm('¿Remover usuario del rol?')) return;
    setError(null); setSuccess(null);
    start(async ()=>{
      try {
        const res = await fetch(`/api/admin/roles/${role.id}/assign`, { method: 'DELETE', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ userId: id }) });
        if (!res.ok) { const data = await res.json().catch(()=>null); throw new Error(mapApiError(data)); }
        setUsers(u => u.filter(x=>x!==id));
        setSuccess('Usuario removido');
      } catch(err:any) { setError(err.message || 'Error'); }
    });
  }

  return (
    <form onSubmit={onSave} className="space-y-8 max-w-3xl" noValidate>
      {error && <div className="px-3 py-2 text-sm rounded-md bg-red-100 text-red-700">{error}</div>}
      {success && <div className="px-3 py-2 text-sm rounded-md bg-green-100 text-green-700">{success}</div>}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">Nombre (solo lectura)</label>
          <input value={role.name} disabled className="w-full px-3 py-2 text-sm rounded-md border bg-neutral-100 border-neutral-300" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">Label</label>
          <input value={label} disabled={!canUpdate} onChange={e=>setLabel(e.target.value)} className="w-full px-3 py-2 text-sm rounded-md border bg-white border-neutral-300 focus:outline-none focus:ring-2 focus:ring-carrot/50 disabled:opacity-50" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-neutral-700">Descripción</label>
          <textarea value={description} disabled={!canUpdate} onChange={e=>setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm rounded-md border bg-white border-neutral-300 focus:outline-none focus:ring-2 focus:ring-carrot/50 disabled:opacity-50" />
        </div>
      </div>

      <fieldset className="space-y-5">
        <legend className="text-sm font-medium text-neutral-700">Permisos</legend>
        {allPermissions.length === 0 && <p className="text-xs text-neutral-500">No hay permisos configurados.</p>}
        {allPermissions.length > 0 && (
          <div className="space-y-6">
            {Object.entries(groupedPermissions(allPermissions)).map(([group, list]) => (
              <div key={group} className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{group}</h3>
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map(p => (
                    <li key={p.key} className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        disabled={!canUpdate}
                        checked={permissions.includes(p.key)}
                        onChange={()=>toggle(p.key)}
                        className="w-4 h-4 mt-0.5 rounded border-neutral-300 text-carrot focus:ring-carrot/50 disabled:opacity-50" />
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

      <div className="flex flex-wrap gap-3 pt-2">
        <button disabled={isPending || !canUpdate} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-md bg-carrot text-nav hover:bg-carrot-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/60 disabled:opacity-60">
          {isPending && <i className='bx bx-loader-alt animate-spin text-base'/>}
          Guardar cambios
        </button>
        <button type="button" disabled={isPending} onClick={()=>router.push('/admin/roles')} className="px-5 py-2.5 text-sm font-medium transition rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/50 disabled:opacity-50">Volver</button>
        {canUpdate && (
          <button type="button" disabled={isPending} onClick={onDelete} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-red-700 transition rounded-md bg-red-100 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-60">Eliminar</button>
        )}
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wide text-neutral-700">Usuarios asignados</h2>
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              placeholder="Buscar email, nombre o pegar ID"
              value={query}
              onChange={e=>{ setQuery(e.target.value); setUserInput(e.target.value); }}
              disabled={!canUpdate}
              className="px-3 py-2 text-sm rounded-md border bg-white border-neutral-300 focus:outline-none focus:ring-2 focus:ring-carrot/50 w-full sm:w-80 disabled:opacity-50" />
            <button type="button" onClick={assignUser} disabled={!canUpdate || isPending || !userInput.trim()} className="px-4 py-2 text-sm font-semibold rounded-md bg-carrot text-nav hover:bg-carrot-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/60 disabled:opacity-50">Asignar</button>
          </div>
          {(searchLoading || searchError || searchResults.length > 0) && (
            <div className="relative">
              <div className="p-3 border rounded-md bg-white shadow-sm space-y-2 text-xs max-h-64 overflow-auto">
                {searchLoading && <p className="text-neutral-500">Buscando...</p>}
                {searchError && <p className="text-red-600">{searchError}</p>}
                {!searchLoading && !searchError && searchResults.length === 0 && query.trim() && (
                  <p className="text-neutral-500">Sin resultados</p>
                )}
                {searchResults.map(u => {
                  const already = users.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      disabled={already}
                      onClick={()=>{ setUserInput(u.id); assignUser(); }}
                      className={`w-full text-left px-2 py-1 rounded-md border transition ${(already? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border-neutral-200':'hover:bg-carrot/10 border-neutral-200')}`}
                    >
                      <span className="font-mono text-[10px] mr-2">{u.id.slice(0,8)}…</span>
                      <span className="font-medium">{u.email}</span>
                      {u.name && <span className="ml-1 text-neutral-500">({u.name})</span>}
                      {already && <span className="ml-2 text-[10px] uppercase">Asignado</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {users.length === 0 && <p className="text-xs text-neutral-500">No hay usuarios en este rol.</p>}
        {users.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {users.map(u => (
              <li key={u} className="flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-md border bg-white/60 border-neutral-300">
                <span className="font-mono truncate" title={u}>{u}</span>
                {canUpdate && <button type="button" onClick={()=>revokeUser(u)} className="text-red-600 hover:underline">Quitar</button>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </form>
  );
}
